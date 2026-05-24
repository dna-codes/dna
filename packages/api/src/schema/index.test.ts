/**
 * Schema-composition smoke tests for the registry-native build path.
 * Builds a schema from a populated in-memory data store and asserts the
 * expected GraphQL types / queries / mutations are present.
 */

import { graphql, getIntrospectionQuery, type IntrospectionQuery } from 'graphql'

import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'

import { ValidatorCache } from '../validation/validator-cache'
import { buildRegistrySchema } from './index'
import { SchemaManager } from './schema-manager'

async function makeSeededStore() {
  const store = createMemoryClient()
  await store.resourceType.create({
    name: 'Loan',
    category: 'resource',
    attribute_schema: [
      { name: 'amount', type: 'number', required: true },
      { name: 'status', type: 'enum', values: ['pending', 'active'] },
    ],
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

describe('schema/index — buildRegistrySchema', () => {
  it('builds a complete schema from the data store', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()
    expect(schema.getQueryType()).toBeDefined()
    expect(schema.getMutationType()).toBeDefined()
  })

  it('includes ResourceType and RelationshipType top-level CRUD', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()
    const queries = schema.getQueryType()!.getFields()
    const mutations = schema.getMutationType()!.getFields()
    expect(queries.resourceType).toBeDefined()
    expect(queries.resourceTypes).toBeDefined()
    expect(queries.relationshipType).toBeDefined()
    expect(queries.relationshipTypes).toBeDefined()
    expect(mutations.createResourceType).toBeDefined()
    expect(mutations.updateResourceType).toBeDefined()
    expect(mutations.deleteResourceType).toBeDefined()
    expect(mutations.createRelationshipType).toBeDefined()
  })

  it('exposes per-Type CRUD for each ResourceType in the store', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()
    const queries = schema.getQueryType()!.getFields()
    const mutations = schema.getMutationType()!.getFields()
    expect(queries.loan).toBeDefined()
    expect(queries.loans).toBeDefined()
    expect(mutations.createLoan).toBeDefined()
    expect(mutations.updateLoan).toBeDefined()
    expect(mutations.deleteLoan).toBeDefined()
    // Borrower's plural is 'borrowers' (naive 's')
    expect(queries.borrowers).toBeDefined()
  })

  it('schema does NOT include DNA Operation-derived mutations (removed)', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()
    const mutations = schema.getMutationType()!.getFields()
    expect((mutations as Record<string, unknown>).loanApply).toBeUndefined()
    expect((mutations as Record<string, unknown>).loanApprove).toBeUndefined()
  })

  it('introspection succeeds against the generated schema', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(result.errors).toBeUndefined()
    const data = result.data as unknown as IntrospectionQuery | undefined
    expect(data?.__schema.queryType.name).toBe('Query')
  })

  it('round-trips a Loan via the generated CRUD mutations', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()

    const create = await graphql({
      schema,
      source: `mutation { createLoan(input: { amount: 1000, status: PENDING }) { id amount status _schemaVersion } }`,
    })
    expect(create.errors).toBeUndefined()
    const created = (create.data as { createLoan: { id: string; amount: number; status: string; _schemaVersion: number } }).createLoan
    expect(typeof created.id).toBe('string')
    expect(created.amount).toBe(1000)
    expect(created._schemaVersion).toBe(1)

    const read = await graphql({
      schema,
      source: `{ loan(id: "${created.id}") { amount status _schemaVersion } }`,
    })
    expect(read.errors).toBeUndefined()
    const loan = (read.data as { loan: { amount: number; _schemaVersion: number } }).loan
    expect(loan.amount).toBe(1000)
    expect(loan._schemaVersion).toBe(1)

    const list = await graphql({ schema, source: `{ loans { id } }` })
    expect((list.data as { loans: unknown[] }).loans).toHaveLength(1)

    const del = await graphql({ schema, source: `mutation { deleteLoan(id: "${created.id}") }` })
    expect((del.data as { deleteLoan: boolean }).deleteLoan).toBe(true)

    const afterDelete = await graphql({ schema, source: `{ loan(id: "${created.id}") { id } }` })
    expect((afterDelete.data as { loan: null }).loan).toBeNull()
  })

  it('rejects an invalid createLoan input', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    const schema = await schemaManager.rebuild()

    // Missing required `amount` field — rejected by GraphQL's own non-null
    // checking before our ajv layer runs. (Defense-in-depth: GraphQL types
    // catch required-field omissions; ajv catches per-attribute schema
    // violations the type system can't express.)
    const create = await graphql({
      schema,
      source: `mutation { createLoan(input: { status: PENDING }) { id } }`,
    })
    expect(create.errors).toBeDefined()
    expect(create.errors!.length).toBeGreaterThan(0)
  })

  it('schema rebuilds reflect a new ResourceType', async () => {
    const store = await makeSeededStore()
    const validatorCache = new ValidatorCache()
    let schemaManager!: SchemaManager
    schemaManager = new SchemaManager(() =>
      buildRegistrySchema({ dataStore: store, validatorCache, schemaManager }),
    )
    await schemaManager.rebuild()

    await store.resourceType.create({
      name: 'Account',
      category: 'resource',
      attribute_schema: [{ name: 'balance', type: 'number' }],
    })
    const schema = await schemaManager.rebuild()
    const queries = schema.getQueryType()!.getFields()
    expect(queries.account).toBeDefined()
    expect(queries.accounts).toBeDefined()
  })
})
