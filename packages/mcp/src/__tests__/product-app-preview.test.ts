/**
 * Builder tests for the product-app-preview lens: the tree mirrors `project()`,
 * `planned` nodes are kept, building twice mutates nothing, and a persisted
 * `can_access` edge surfaces in the access snapshot keyed by projection key.
 */

import { createClient } from '@dna-codes/dna-adapters/integration/memory'
import type { DnaDataStore } from '@dna-codes/dna-core'
import { seedProductTypes, applyProjection, project } from '@dna-codes/dna-core'
import { buildProductAppPreview } from '../lenses/product-app-preview.js'

// A minimal Lending business graph: Domain → Process → Task → Operation.
async function seedLending(store: DnaDataStore) {
  await store.migrate()
  for (const name of ['Domain', 'Process', 'Task', 'Operation']) {
    await store.resourceType.create({ name, category: 'resource', attribute_schema: [], stability: 'stable' })
  }
  await store.relationshipType.create({ name: 'rel', from: '*', to: '*', cardinality: 'many-to-many', attribute: 'rel', stability: 'stable' })

  const d = (await store.instance.create('Domain', { name: 'Lending' })).id
  const p = (await store.instance.create('Process', { name: 'Origination' })).id
  const t = (await store.instance.create('Task', { name: 'Collect' })).id
  const o = (await store.instance.create('Operation', { name: 'Loan.Create', changes: [{ attribute: 'status', set: 'new' }] })).id
  const link = (from: { typeName: string; id: string }, to: { typeName: string; id: string }) => store.link.create(from, to, { role: 'rel' })
  await link({ typeName: 'Domain', id: d }, { typeName: 'Process', id: p })
  await link({ typeName: 'Process', id: p }, { typeName: 'Task', id: t })
  await link({ typeName: 'Task', id: t }, { typeName: 'Operation', id: o })
  return { d, p, t, o }
}

/** A LensDataResult equivalent of the seeded business graph, for project(). */
async function businessGraph(store: DnaDataStore) {
  const nodes: any[] = []
  for (const rt of await store.resourceType.list()) {
    for (const inst of await store.instance.list(rt.name)) nodes.push({ ...inst, _typeName: rt.name })
  }
  return { nodes, links: await store.link.list() } as any
}

describe('buildProductAppPreview', () => {
  it('returns an App→Module→Page tree mirroring project()', async () => {
    const store = createClient() as unknown as DnaDataStore
    await seedLending(store)

    const vm = await buildProductAppPreview(store)
    expect(vm.lens).toBe('product-app-preview')
    expect(vm.roots).toHaveLength(1)
    const app = vm.roots[0]
    expect(app.level).toBe('app')
    expect(app.name).toBe('Lending')
    const mod = app.children.find((c) => c.level === 'module')
    expect(mod).toBeDefined()
    expect(mod!.children.some((c) => c.level === 'page')).toBe(true)

    // Same key set as the pure projection's surface nodes.
    const projected = project(await businessGraph(store))
    const surfaceKeys = projected.nodes.filter((n) => ['app', 'module', 'workflow', 'page', 'section'].includes(n.level)).map((n) => n.key)
    const treeKeys: string[] = []
    const walk = (n: { id: string; children: any[] }) => { treeKeys.push(n.id); n.children.forEach(walk) }
    vm.roots.forEach(walk)
    expect(new Set(treeKeys)).toEqual(new Set(surfaceKeys))
  })

  it('keeps planned nodes rather than hiding them', async () => {
    const store = createClient() as unknown as DnaDataStore
    await store.migrate()
    await store.resourceType.create({ name: 'Domain', category: 'resource', attribute_schema: [], stability: 'stable' })
    // A lone Domain with no Process ⇒ the App is planned and has no Module children.
    await store.instance.create('Domain', { name: 'Lending' })

    const vm = await buildProductAppPreview(store)
    expect(vm.roots).toHaveLength(1)
    expect(vm.roots[0].planned).toBe(true)
  })

  it('does not mutate the store when building the view model', async () => {
    const store = createClient() as unknown as DnaDataStore
    await seedLending(store)

    const count = async () => {
      let n = 0
      for (const rt of await store.resourceType.list()) n += (await store.instance.list(rt.name)).length
      return { instances: n, links: (await store.link.list()).length, types: (await store.resourceType.list()).length }
    }
    const before = await count()
    await buildProductAppPreview(store)
    await buildProductAppPreview(store)
    expect(await count()).toEqual(before)
  })

  it('renders an authored materialized tree with ui type, page layout, and binding-driven records', async () => {
    const store = createClient() as unknown as DnaDataStore
    await store.migrate()
    await seedProductTypes(store)
    // A business resource type with rows for the bound table.
    await store.resourceType.create({ name: 'order', category: 'resource', attribute_schema: [], stability: 'stable' })
    await store.instance.create('order', { name: 'SW-1', status: 'paid' })
    await store.instance.create('order', { name: 'SW-2', status: 'pending' })

    // Author App → Module → Workflow → Page(layout) → Section → Component(table, bound to order).
    const app = (await store.instance.create('App', { name: 'Shopwave Admin' })).id
    const mod = (await store.instance.create('Module', { name: 'Order Fulfillment' })).id
    const wf = (await store.instance.create('Workflow', { name: 'Fulfill Order' })).id
    const page = (await store.instance.create('Page', { name: 'Orders', layout: 'AdminLayout' })).id
    const section = (await store.instance.create('Section', { name: 'List' })).id
    const comp = (await store.instance.create('Component', { name: 'OrderTable', type: 'table', resource: 'order' })).id
    await store.instance.create('Layout', { name: 'AdminLayout' })
    const contains = (from: string, fromType: string, to: string, toType: string) =>
      store.link.create({ typeName: fromType, id: from }, { typeName: toType, id: to }, { role: 'contains' })
    await contains(app, 'App', mod, 'Module')
    await contains(mod, 'Module', wf, 'Workflow')
    await contains(wf, 'Workflow', page, 'Page')
    await contains(page, 'Page', section, 'Section')
    await contains(section, 'Section', comp, 'Component')

    // Authored governance grant on the Module.
    await store.resourceType.create({ name: 'Role', category: 'position', attribute_schema: [], stability: 'stable' })
    const role = (await store.instance.create('Role', { name: 'FulfillmentLead' })).id
    await store.link.create({ typeName: 'Role', id: role }, { typeName: 'Module', id: mod }, { role: 'can_access' })

    const vm = await buildProductAppPreview(store)
    expect(vm.roots).toHaveLength(1)
    const appNode = vm.roots[0]
    expect(appNode.level).toBe('app')
    const modNode = appNode.children.find((c) => c.level === 'module')!
    const wfNode = modNode.children.find((c) => c.level === 'workflow')!
    const pageNode = wfNode.children.find((c) => c.level === 'page')!
    expect(pageNode.layout).toBe('AdminLayout')
    const sectionNode = pageNode.children.find((c) => c.level === 'section')!
    const compNode = sectionNode.children.find((c) => c.level === 'component')!
    expect(compNode.uiType).toBe('table')

    // Binding-driven records, keyed by the component surface id.
    const records = vm.surfaceRecords.find((r) => r.surface === comp)
    expect(records).toBeDefined()
    expect(records!.resourceType).toBe('order')
    expect(records!.rows).toHaveLength(2)
    expect(records!.columns).not.toContain('id')

    // Governance overlay keyed by instance id (authored nodes carry no _projectionKey).
    expect(vm.access.grants).toContainEqual({ subject: 'FulfillmentLead', surface: mod })
    expect(vm.subjects).toContain('FulfillmentLead')
  })

  it('overlays a persisted can_access edge onto the snapshot, keyed by projection key', async () => {
    const store = createClient() as unknown as DnaDataStore
    await seedLending(store)

    // Materialize the product nodes and author a can_access on the Module.
    await seedProductTypes(store)
    await applyProjection(project(await businessGraph(store)), store)
    const moduleInst = (await store.instance.list('Module'))[0]
    await store.resourceType.create({ name: 'Role', category: 'position', attribute_schema: [], stability: 'stable' })
    const role = (await store.instance.create('Role', { name: 'Underwriter' })).id
    await store.link.create({ typeName: 'Role', id: role }, { typeName: 'Module', id: moduleInst.id }, { role: 'can_access' })

    const vm = await buildProductAppPreview(store)
    expect(vm.access.grants).toContainEqual({ subject: 'Underwriter', surface: moduleInst._projectionKey })
    expect(vm.subjects).toContain('Underwriter')
    // contains is emitted for cascade resolution.
    expect(vm.access.contains.some((c) => c.child === moduleInst._projectionKey)).toBe(true)
  })
})
