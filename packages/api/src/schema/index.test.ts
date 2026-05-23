/**
 * Schema-composition smoke tests. Validates that the codegen runs end to
 * end against real example DNAs (`examples/lending`) and produces the
 * expected types/queries/mutations after composition.
 */

import { readFileSync } from 'fs'
import { graphql, getIntrospectionQuery, type IntrospectionQuery } from 'graphql'
import { join } from 'path'

import { createClient as createMemoryClient } from '@dna-codes/dna-adapters/integration/memory'
import type { OperationalDNA } from '@dna-codes/dna-core'

import { buildSchema } from './index'

const LENDING_FIXTURE = join(__dirname, '..', '..', '..', '..', 'examples', 'lending', 'operational.json')

function loadLending(): OperationalDNA {
  return JSON.parse(readFileSync(LENDING_FIXTURE, 'utf-8')) as OperationalDNA
}

describe('schema/index — buildSchema', () => {
  it('builds a complete schema from the lending example', () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    expect(schema.getQueryType()).toBeDefined()
    expect(schema.getMutationType()).toBeDefined()
  })

  it('includes the expected types from the lending example', () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    expect(schema.getType('Loan')).toBeDefined()
    expect(schema.getType('Borrower')).toBeDefined()
    expect(schema.getType('LoanInput')).toBeDefined()
  })

  it('exposes CRUD queries + mutations for each Resource', () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    const queries = schema.getQueryType()!.getFields()
    const mutations = schema.getMutationType()!.getFields()
    expect(queries.loan).toBeDefined()
    expect(queries.loans).toBeDefined()
    expect(mutations.createLoan).toBeDefined()
    expect(mutations.updateLoan).toBeDefined()
    expect(mutations.deleteLoan).toBeDefined()
  })

  it('exposes DNA Operations as mutations (e.g. loanApply)', () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    const mutations = schema.getMutationType()!.getFields()
    // The lending example has Operation `Loan.Apply` and `Loan.Approve`.
    expect(mutations.loanApply).toBeDefined()
    expect(mutations.loanApprove).toBeDefined()
  })

  it('throws on invalid DNA', () => {
    const bad = { domain: 'not-an-object' } as unknown as OperationalDNA
    const store = createMemoryClient({ domain: { name: 'x' } })
    expect(() => buildSchema({ dna: bad, dataStore: store })).toThrow(/failed validation/i)
  })

  it('introspection succeeds against the generated schema', async () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    const result = await graphql({ schema, source: getIntrospectionQuery() })
    expect(result.errors).toBeUndefined()
    const data = result.data as unknown as IntrospectionQuery | undefined
    expect(data?.__schema.queryType.name).toBe('Query')
  })

  it('round-trips a Loan via the generated CRUD mutations', async () => {
    const dna = loadLending()
    const store = createMemoryClient(dna)
    const schema = buildSchema({ dna, dataStore: store })
    await store.migrate()

    const create = await graphql({
      schema,
      source: `mutation {
        createLoan(input: {
          amount: 1000,
          interestRate: 0.05,
          borrowerId: "b1",
          status: PENDING
        }) { id amount status }
      }`,
    })
    expect(create.errors).toBeUndefined()
    const created = (create.data as { createLoan: { id: string; amount: number; status: string } }).createLoan
    expect(typeof created.id).toBe('string')
    expect(created.amount).toBe(1000)

    const read = await graphql({
      schema,
      source: `{ loan(id: "${created.id}") { amount status } }`,
    })
    expect(read.errors).toBeUndefined()
    expect((read.data as { loan: { amount: number } }).loan.amount).toBe(1000)

    const list = await graphql({ schema, source: `{ loans { id } }` })
    expect((list.data as { loans: unknown[] }).loans).toHaveLength(1)

    const del = await graphql({ schema, source: `mutation { deleteLoan(id: "${created.id}") }` })
    expect((del.data as { deleteLoan: boolean }).deleteLoan).toBe(true)

    const afterDelete = await graphql({ schema, source: `{ loan(id: "${created.id}") { id } }` })
    expect((afterDelete.data as { loan: null }).loan).toBeNull()
  })
})
