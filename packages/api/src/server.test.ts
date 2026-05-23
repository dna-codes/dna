import { readFileSync } from 'fs'
import { join } from 'path'
import request from 'supertest'

import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'
import type { OperationalDNA } from '@dna-codes/dna-core'

import { createServer } from './server'

const LENDING_FIXTURE = join(__dirname, '..', '..', '..', 'examples', 'lending', 'operational.json')

function lendingDna(): OperationalDNA {
  return JSON.parse(readFileSync(LENDING_FIXTURE, 'utf-8')) as OperationalDNA
}

describe('server', () => {
  it('GET /healthz returns 200', async () => {
    const dna = lendingDna()
    const store = createMemoryClient(dna)
    const server = await createServer({ dna, dataStore: store })
    const res = await request(server.expressApp).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.text).toBe('ok')
    await server.apolloServer.stop()
    await store.close()
  })

  it('POST /graphql introspection succeeds', async () => {
    const dna = lendingDna()
    const store = createMemoryClient(dna)
    const server = await createServer({ dna, dataStore: store })
    const res = await request(server.expressApp)
      .post('/graphql')
      .send({ query: '{ __schema { queryType { name } } }' })
      .set('Content-Type', 'application/json')
    expect(res.status).toBe(200)
    expect(res.body.data.__schema.queryType.name).toBe('Query')
    await server.apolloServer.stop()
    await store.close()
  })

  it('full create → read → delete cycle over HTTP', async () => {
    const dna = lendingDna()
    const store = createMemoryClient(dna)
    const server = await createServer({ dna, dataStore: store })

    const create = await request(server.expressApp)
      .post('/graphql')
      .send({
        query:
          'mutation { createLoan(input: { amount: 1000, interestRate: 0.05, borrowerId: "b1", status: PENDING }) { id amount status } }',
      })
      .set('Content-Type', 'application/json')
    expect(create.status).toBe(200)
    const created = create.body.data.createLoan as { id: string; amount: number; status: string }
    expect(created.amount).toBe(1000)

    const read = await request(server.expressApp)
      .post('/graphql')
      .send({ query: `{ loan(id: "${created.id}") { amount status } }` })
      .set('Content-Type', 'application/json')
    expect(read.body.data.loan.amount).toBe(1000)

    const del = await request(server.expressApp)
      .post('/graphql')
      .send({ query: `mutation { deleteLoan(id: "${created.id}") }` })
      .set('Content-Type', 'application/json')
    expect(del.body.data.deleteLoan).toBe(true)

    await server.apolloServer.stop()
    await store.close()
  })

  it('listen binds to a port and close releases it', async () => {
    const dna = lendingDna()
    const store = createMemoryClient(dna)
    const server = await createServer({ dna, dataStore: store })
    // Use port 0 to let the OS pick an ephemeral free port.
    const handle = await server.listen(0)
    await handle.close()
    await store.close()
  })

  it('calls dataStore.migrate() during createServer', async () => {
    const dna = lendingDna()
    const store = createMemoryClient(dna)
    const migrateSpy = jest.spyOn(store, 'migrate')
    const server = await createServer({ dna, dataStore: store })
    expect(migrateSpy).toHaveBeenCalledTimes(1)
    await server.apolloServer.stop()
    await store.close()
  })
})
