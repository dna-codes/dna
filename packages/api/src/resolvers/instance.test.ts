import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'

import {
  makeCreateResolver,
  makeDeleteResolver,
  makeGetResolver,
  makeListResolver,
  makeUpdateResolver,
} from './instance'

function makeStore() {
  return createMemoryClient({
    domain: {
      name: 'lending',
      resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }],
    },
  })
}

const NO_INFO = {} as never

describe('resolvers/instance', () => {
  it('makeGetResolver calls store.instance.get', async () => {
    const store = makeStore()
    await store.instance.create('Loan', { id: 'l1', amount: 1000 })
    const get = makeGetResolver({ dataStore: store, typeName: 'Loan' })
    const out = await get({}, { id: 'l1' }, {}, NO_INFO)
    expect(out).toMatchObject({ id: 'l1', amount: 1000 })
  })

  it('makeListResolver calls store.instance.list', async () => {
    const store = makeStore()
    await store.instance.create('Loan', { amount: 1 })
    await store.instance.create('Loan', { amount: 2 })
    const list = makeListResolver({ dataStore: store, typeName: 'Loan' })
    const out = (await list({}, {}, {}, NO_INFO)) as unknown[]
    expect(out).toHaveLength(2)
  })

  it('makeCreateResolver creates and returns the new record', async () => {
    const store = makeStore()
    const create = makeCreateResolver({ dataStore: store, typeName: 'Loan' })
    const out = (await create({}, { input: { amount: 7 } }, {}, NO_INFO)) as { id: string; amount: number }
    expect(out.amount).toBe(7)
    expect(typeof out.id).toBe('string')
  })

  it('makeUpdateResolver patches the record', async () => {
    const store = makeStore()
    const { id } = await store.instance.create('Loan', { amount: 1, status: 'pending' })
    const update = makeUpdateResolver({ dataStore: store, typeName: 'Loan' })
    const out = (await update({}, { id, input: { status: 'active' } }, {}, NO_INFO)) as Record<string, unknown>
    expect(out.status).toBe('active')
    expect(out.amount).toBe(1)
  })

  it('makeDeleteResolver returns true and removes the record', async () => {
    const store = makeStore()
    const { id } = await store.instance.create('Loan', { amount: 9 })
    const del = makeDeleteResolver({ dataStore: store, typeName: 'Loan' })
    const out = await del({}, { id }, {}, NO_INFO)
    expect(out).toBe(true)
    expect(await store.instance.get('Loan', id)).toBeNull()
  })

  it('makeGetResolver returns null for missing records', async () => {
    const store = makeStore()
    const get = makeGetResolver({ dataStore: store, typeName: 'Loan' })
    expect(await get({}, { id: 'nope' }, {}, NO_INFO)).toBeNull()
  })
})
