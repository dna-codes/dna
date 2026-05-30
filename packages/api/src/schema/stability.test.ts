/**
 * GraphQL-surface tests for resource/relationship-type stability:
 *   - `stability` is queryable on both type kinds
 *   - the transition mutations change stability WITHOUT bumping currentVersion
 *   - an out-of-range enum value is rejected
 *   - the GraphQL `Stability` enum stays in sync with the core union
 */

import { graphql } from 'graphql'

import { STABILITIES } from '@dna-codes/dna-core'
import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'

import { ValidatorCache } from '../validation/validator-cache'
import { buildRegistrySchema } from './index'
import { SchemaManager } from './schema-manager'
import { StabilityEnum } from './registry-types'

async function makeStore() {
  const store = createMemoryClient()
  await store.resourceType.create({
    name: 'Loan',
    category: 'resource',
    attribute_schema: [{ name: 'amount', type: 'number' }],
  })
  await store.resourceType.create({
    name: 'Borrower',
    category: 'person',
    attribute_schema: [{ name: 'email', type: 'string' }],
  })
  await store.relationshipType.create({
    name: 'Loan.borrower',
    from: 'Loan',
    to: 'Borrower',
    cardinality: 'many-to-one',
    attribute: 'borrower_id',
  })
  return store
}

async function buildSchema(store: Awaited<ReturnType<typeof makeStore>>) {
  const validatorCache = new ValidatorCache()
  let schemaManager!: SchemaManager
  schemaManager = new SchemaManager(() =>
    buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
  )
  return schemaManager.rebuild()
}

describe('schema/stability — GraphQL surface', () => {
  it('exposes stability on resource types (defaults to experimental for tenant types)', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const { id } = (await store.resourceType.list()).find((rt) => rt.name === 'Loan')!
    const res = await graphql({ schema, source: `{ resourceType(id: "${id}") { stability currentVersion } }` })
    expect(res.errors).toBeUndefined()
    expect((res.data as any).resourceType.stability).toBe('EXPERIMENTAL')
  })

  it('exposes stability on relationship types', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const { id } = (await store.relationshipType.list())[0]
    const res = await graphql({ schema, source: `{ relationshipType(id: "${id}") { stability } }` })
    expect(res.errors).toBeUndefined()
    expect((res.data as any).relationshipType.stability).toBe('EXPERIMENTAL')
  })

  it('setResourceTypeStability transitions stability without bumping currentVersion', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const before = (await store.resourceType.list()).find((rt) => rt.name === 'Loan')!
    const res = await graphql({
      schema,
      source: `mutation { setResourceTypeStability(id: "${before.id}", stability: STABLE) { stability currentVersion } }`,
    })
    expect(res.errors).toBeUndefined()
    expect((res.data as any).setResourceTypeStability.stability).toBe('STABLE')
    expect((res.data as any).setResourceTypeStability.currentVersion).toBe(before.current_version)
  })

  it('setRelationshipTypeStability transitions stability without bumping currentVersion', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const before = (await store.relationshipType.list())[0]
    const res = await graphql({
      schema,
      source: `mutation { setRelationshipTypeStability(id: "${before.id}", stability: BETA) { stability currentVersion } }`,
    })
    expect(res.errors).toBeUndefined()
    expect((res.data as any).setRelationshipTypeStability.stability).toBe('BETA')
    expect((res.data as any).setRelationshipTypeStability.currentVersion).toBe(before.current_version)
  })

  it('honors stability supplied on create', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const res = await graphql({
      schema,
      source: `mutation { createResourceType(input: { name: "Invoice", category: RESOURCE, attributeSchema: [], stability: BETA }) { stability } }`,
    })
    expect(res.errors).toBeUndefined()
    expect((res.data as any).createResourceType.stability).toBe('BETA')
  })

  it('rejects an out-of-range stability enum value', async () => {
    const store = await makeStore()
    const schema = await buildSchema(store)
    const { id } = (await store.resourceType.list()).find((rt) => rt.name === 'Loan')!
    const res = await graphql({
      schema,
      source: `mutation { setResourceTypeStability(id: "${id}", stability: GA) { stability } }`,
    })
    expect(res.errors).toBeDefined()
    expect(res.errors!.length).toBeGreaterThan(0)
  })
})

describe('schema/stability — enum/core sync', () => {
  it('the GraphQL Stability enum mirrors the core STABILITIES union', () => {
    const enumValues = StabilityEnum.getValues()
      .map((v) => v.value as string)
      .sort()
    expect(enumValues).toEqual([...STABILITIES].sort())
    // Member names are the upper-cased values.
    for (const v of StabilityEnum.getValues()) {
      expect(v.name).toBe((v.value as string).toUpperCase())
    }
  })
})
