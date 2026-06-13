/**
 * Regression gate for the org-chart evaluator migration. Seeds a representative
 * org with the in-memory store, snapshots `buildOrgChart` output, and asserts
 * the evaluator-backed reimplementation produces an identical OrgChartViewModel.
 */

import { createClient } from '@dna-codes/dna-adapters/integration/memory'
import type { DnaDataStore } from '@dna-codes/dna-core'
import { buildOrgChart } from '../lenses/org-chart.js'

async function seedOrg(store: DnaDataStore) {
  await store.migrate()
  await store.resourceType.create({ name: 'company', category: 'group', attribute_schema: [], stability: 'stable' })
  await store.resourceType.create({ name: 'department', category: 'group', attribute_schema: [], stability: 'stable' })
  await store.resourceType.create({ name: 'position', category: 'role', attribute_schema: [], stability: 'stable' })
  await store.resourceType.create({ name: 'person', category: 'person', attribute_schema: [], stability: 'stable' })
  await store.relationshipType.create({ name: 'belongs_to', from: 'position', to: 'company', cardinality: 'many-to-one', attribute: 'belongs_to', stability: 'stable' })
  await store.relationshipType.create({ name: 'reports_to', from: 'position', to: 'position', cardinality: 'many-to-one', attribute: 'reports_to', stability: 'stable' })
  await store.relationshipType.create({ name: 'fills', from: 'person', to: 'position', cardinality: 'many-to-one', attribute: 'fills', stability: 'stable' })

  const co = (await store.instance.create('company', { name: 'Acme Corp' })).id
  const eng = (await store.instance.create('department', { name: 'Engineering' })).id
  const prod = (await store.instance.create('department', { name: 'Product' })).id
  const ceo = (await store.instance.create('position', { name: 'CEO' })).id
  const cto = (await store.instance.create('position', { name: 'CTO' })).id
  const vpp = (await store.instance.create('position', { name: 'VP Product' })).id
  const eng1 = (await store.instance.create('position', { name: 'Engineer' })).id
  const sarah = (await store.instance.create('person', { name: 'Sarah' })).id
  const marcus = (await store.instance.create('person', { name: 'Marcus' })).id

  const link = (from: { typeName: string; id: string }, to: { typeName: string; id: string }, role: string) =>
    store.link.create(from, to, { role })

  await link({ typeName: 'department', id: eng }, { typeName: 'company', id: co }, 'belongs_to')
  await link({ typeName: 'department', id: prod }, { typeName: 'company', id: co }, 'belongs_to')
  await link({ typeName: 'position', id: ceo }, { typeName: 'company', id: co }, 'belongs_to')
  await link({ typeName: 'position', id: cto }, { typeName: 'department', id: eng }, 'belongs_to')
  await link({ typeName: 'position', id: vpp }, { typeName: 'department', id: prod }, 'belongs_to')
  await link({ typeName: 'position', id: eng1 }, { typeName: 'department', id: eng }, 'belongs_to')
  await link({ typeName: 'position', id: cto }, { typeName: 'position', id: ceo }, 'reports_to')
  await link({ typeName: 'position', id: vpp }, { typeName: 'position', id: ceo }, 'reports_to')
  await link({ typeName: 'position', id: eng1 }, { typeName: 'position', id: cto }, 'reports_to')
  await link({ typeName: 'person', id: sarah }, { typeName: 'position', id: ceo }, 'fills')
  await link({ typeName: 'person', id: marcus }, { typeName: 'position', id: cto }, 'fills')
}

// Strip volatile ids so the snapshot is stable across runs (ids are UUIDs).
function stripIds(node: Record<string, unknown>): unknown {
  const { id: _id, parentId: _p, holders, reports, ...rest } = node as {
    id: string; parentId?: string; holders: { id: string; name: string }[]; reports: Record<string, unknown>[]
  }
  return {
    ...rest,
    holders: holders.map(h => h.name),
    reports: reports.map(stripIds),
  }
}

describe('org-chart regression', () => {
  it('produces a stable org-chart view-model', async () => {
    const store = createClient()
    await seedOrg(store)
    const vm = await buildOrgChart(store)
    const stable = { lens: vm.lens, groupName: vm.groupName, roots: vm.roots.map(r => stripIds(r as unknown as Record<string, unknown>)) }
    expect(stable).toMatchSnapshot()
  })
})
