import { GraphQLNonNull, GraphQLList, GraphQLID, GraphQLBoolean, type GraphQLObjectType } from 'graphql'

import type { OperationalDNA } from '@dna-codes/dna-core'

import { buildCrudFields } from './crud'
import { buildResourceTypes } from './types'

function lendingDna(): OperationalDNA {
  return {
    domain: {
      name: 'lending',
      resources: [
        { name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] },
        { name: 'Borrower', attributes: [{ name: 'email', type: 'string' }] },
      ],
      persons: [{ name: 'Customer' }],
    },
  }
}

const stubResolvers = {
  get: () => () => null,
  list: () => () => [],
  create: () => () => null,
  update: () => () => null,
  delete: () => () => true,
}

describe('schema/crud — buildCrudFields', () => {
  it('registers the five CRUD operations per noun primitive', () => {
    const bundle = buildResourceTypes(lendingDna())
    const { queries, mutations } = buildCrudFields(bundle, stubResolvers)

    for (const type of ['Loan', 'Borrower', 'Customer']) {
      const single = type.charAt(0).toLowerCase() + type.slice(1)
      const plural =
        type === 'Person'
          ? 'persons'
          : `${type.charAt(0).toLowerCase() + type.slice(1)}s`
      expect(queries[single]).toBeDefined()
      expect(queries[plural]).toBeDefined()
      expect(mutations[`create${type}`]).toBeDefined()
      expect(mutations[`update${type}`]).toBeDefined()
      expect(mutations[`delete${type}`]).toBeDefined()
    }
  })

  it('uses persons override for Person plural (not peoples)', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex', persons: [{ name: 'Person' }] },
    }
    const bundle = buildResourceTypes(dna)
    const { queries } = buildCrudFields(bundle, stubResolvers)
    expect(queries.persons).toBeDefined()
    expect((queries as Record<string, unknown>).peoples).toBeUndefined()
  })

  it('list query returns a non-null list of non-null elements', () => {
    const bundle = buildResourceTypes(lendingDna())
    const { queries } = buildCrudFields(bundle, stubResolvers)
    const loans = queries.loans
    expect(loans.type).toBeInstanceOf(GraphQLNonNull)
    const inner = (loans.type as GraphQLNonNull<GraphQLList<GraphQLObjectType>>).ofType
    expect(inner).toBeInstanceOf(GraphQLList)
  })

  it('delete mutation returns Boolean!', () => {
    const bundle = buildResourceTypes(lendingDna())
    const { mutations } = buildCrudFields(bundle, stubResolvers)
    const del = mutations.deleteLoan
    expect(del.type).toBeInstanceOf(GraphQLNonNull)
    const inner = (del.type as GraphQLNonNull<typeof GraphQLBoolean>).ofType
    expect(inner).toBe(GraphQLBoolean)
  })

  it('update mutation takes id: ID! and input: <Type>Input!', () => {
    const bundle = buildResourceTypes(lendingDna())
    const { mutations } = buildCrudFields(bundle, stubResolvers)
    const update = mutations.updateLoan
    expect(update.args).toBeDefined()
    const idArg = update.args!.id
    expect(idArg.type).toBeInstanceOf(GraphQLNonNull)
    const idInner = (idArg.type as GraphQLNonNull<typeof GraphQLID>).ofType
    expect(idInner).toBe(GraphQLID)
    const inputArg = update.args!.input
    expect(inputArg.type).toBeInstanceOf(GraphQLNonNull)
  })

  it('emits crudMutationNames for collision detection downstream', () => {
    const bundle = buildResourceTypes(lendingDna())
    const { crudMutationNames } = buildCrudFields(bundle, stubResolvers)
    expect(crudMutationNames.has('createLoan')).toBe(true)
    expect(crudMutationNames.has('updateLoan')).toBe(true)
    expect(crudMutationNames.has('deleteLoan')).toBe(true)
  })
})
