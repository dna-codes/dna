import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'

import { makeOperationResolver } from './operations'

const NO_INFO = {} as never

describe('resolvers/operations', () => {
  it('v1 behavior: update + re-read', async () => {
    const store = createMemoryClient({
      domain: { name: 'ex', resources: [{ name: 'Loan' }] },
    })
    const { id } = await store.instance.create('Loan', { status: 'pending', amount: 1000 })
    const resolve = makeOperationResolver({ dataStore: store, targetType: 'Loan' })
    const out = (await resolve({}, { id, input: { status: 'active' } }, {}, NO_INFO)) as Record<string, unknown>
    expect(out.status).toBe('active')
    expect(out.amount).toBe(1000)
  })
})
