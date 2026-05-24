import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'

import { ValidatorCache } from '../validation/validator-cache'
import {
  makeCreateResolver,
  makeDeleteResolver,
  makeGetResolver,
  makeListResolver,
  makeUpdateResolver,
} from './instance'

async function makeStoreWithLoanType() {
  const store = createMemoryClient()
  await store.resourceType.create({
    name: 'Loan',
    category: 'resource',
    attribute_schema: [
      { name: 'amount', type: 'number', required: true },
    ],
  })
  return store
}

const NO_INFO = {} as never

describe('resolvers/instance', () => {
  it('makeGetResolver calls store.instance.get', async () => {
    const store = await makeStoreWithLoanType()
    await store.instance.create('Loan', { id: 'l1', amount: 1000 })
    const get = makeGetResolver({ dataStore: store, typeName: 'Loan' })
    const out = await get({}, { id: 'l1' }, {}, NO_INFO)
    expect(out).toMatchObject({ id: 'l1', amount: 1000 })
  })

  it('makeListResolver calls store.instance.list', async () => {
    const store = await makeStoreWithLoanType()
    await store.instance.create('Loan', { amount: 1 })
    await store.instance.create('Loan', { amount: 2 })
    const list = makeListResolver({ dataStore: store, typeName: 'Loan' })
    const out = (await list({}, {}, {}, NO_INFO)) as unknown[]
    expect(out).toHaveLength(2)
  })

  it('makeCreateResolver validates then creates', async () => {
    const store = await makeStoreWithLoanType()
    const validatorCache = new ValidatorCache()
    const create = makeCreateResolver({ dataStore: store, typeName: 'Loan', validatorCache })
    const out = (await create({}, { input: { amount: 7 } }, {}, NO_INFO)) as { id: string; amount: number }
    expect(out.amount).toBe(7)
    expect(typeof out.id).toBe('string')
  })

  it('makeCreateResolver rejects invalid input via ajv', async () => {
    const store = await makeStoreWithLoanType()
    const validatorCache = new ValidatorCache()
    const create = makeCreateResolver({ dataStore: store, typeName: 'Loan', validatorCache })
    await expect(
      create({}, { input: { /* missing required amount */ } }, {}, NO_INFO),
    ).rejects.toThrow(/Validation failed/)
  })

  it('makeCreateResolver errors on unknown typeName', async () => {
    const store = await makeStoreWithLoanType()
    const validatorCache = new ValidatorCache()
    const create = makeCreateResolver({ dataStore: store, typeName: 'Ghost', validatorCache })
    await expect(create({}, { input: { amount: 1 } }, {}, NO_INFO)).rejects.toThrow(
      /No ResourceType named "Ghost"/,
    )
  })

  it('makeUpdateResolver validates and patches', async () => {
    const store = await makeStoreWithLoanType()
    const { id } = await store.instance.create('Loan', { amount: 1 })
    const validatorCache = new ValidatorCache()
    const update = makeUpdateResolver({ dataStore: store, typeName: 'Loan', validatorCache })
    const out = (await update({}, { id, input: { amount: 5 } }, {}, NO_INFO)) as Record<string, unknown>
    expect(out.amount).toBe(5)
  })

  it('makeDeleteResolver returns true and removes the record', async () => {
    const store = await makeStoreWithLoanType()
    const { id } = await store.instance.create('Loan', { amount: 9 })
    const del = makeDeleteResolver({ dataStore: store, typeName: 'Loan' })
    const out = await del({}, { id }, {}, NO_INFO)
    expect(out).toBe(true)
    expect(await store.instance.get('Loan', id)).toBeNull()
  })

  it('makeGetResolver returns null for missing records', async () => {
    const store = await makeStoreWithLoanType()
    const get = makeGetResolver({ dataStore: store, typeName: 'Loan' })
    expect(await get({}, { id: 'nope' }, {}, NO_INFO)).toBeNull()
  })
})
