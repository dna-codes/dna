import { GraphQLNonNull, GraphQLList, GraphQLID, GraphQLBoolean, type GraphQLObjectType } from 'graphql'

import type { ResourceType } from '@dna-codes/dna-core'

import { buildCrudFields } from './crud'
import { buildResourceTypes } from './types'

function makeResourceType(name: string, category: ResourceType['category'] = 'resource'): ResourceType {
  return {
    id: `rt-${name}`,
    name,
    category,
    attribute_schema: [{ name: 'foo', type: 'string' }],
    current_version: 1,
    stability: 'experimental',
    is_seed: false,
  }
}

function lendingTypes(): ResourceType[] {
  return [
    makeResourceType('Loan'),
    makeResourceType('Borrower'),
    makeResourceType('Customer', 'person'),
  ]
}

const stubResolvers = {
  get: () => () => null,
  list: () => () => [],
  create: () => () => null,
  update: () => () => null,
  delete: () => () => true,
}

describe('schema/crud — buildCrudFields', () => {
  it('registers the five CRUD operations per ResourceType', () => {
    const bundle = buildResourceTypes(lendingTypes())
    const { queries, mutations } = buildCrudFields(bundle, stubResolvers)
    for (const type of ['Loan', 'Borrower', 'Customer']) {
      const single = type.charAt(0).toLowerCase() + type.slice(1)
      const plural = `${type.charAt(0).toLowerCase() + type.slice(1)}s`
      expect(queries[single]).toBeDefined()
      expect(queries[plural]).toBeDefined()
      expect(mutations[`create${type}`]).toBeDefined()
      expect(mutations[`update${type}`]).toBeDefined()
      expect(mutations[`delete${type}`]).toBeDefined()
    }
  })

  it('uses persons override for Person plural (not peoples)', () => {
    const bundle = buildResourceTypes([makeResourceType('Person', 'person')])
    const { queries } = buildCrudFields(bundle, stubResolvers)
    expect(queries.persons).toBeDefined()
    expect((queries as Record<string, unknown>).peoples).toBeUndefined()
  })

  it('list query returns a non-null list of non-null elements', () => {
    const bundle = buildResourceTypes(lendingTypes())
    const { queries } = buildCrudFields(bundle, stubResolvers)
    const loans = queries.loans
    expect(loans.type).toBeInstanceOf(GraphQLNonNull)
    const inner = (loans.type as GraphQLNonNull<GraphQLList<GraphQLObjectType>>).ofType
    expect(inner).toBeInstanceOf(GraphQLList)
  })

  it('delete mutation returns Boolean!', () => {
    const bundle = buildResourceTypes(lendingTypes())
    const { mutations } = buildCrudFields(bundle, stubResolvers)
    const del = mutations.deleteLoan
    expect(del.type).toBeInstanceOf(GraphQLNonNull)
    const inner = (del.type as GraphQLNonNull<typeof GraphQLBoolean>).ofType
    expect(inner).toBe(GraphQLBoolean)
  })

  it('update mutation takes id: ID! and input: <Type>Input!', () => {
    const bundle = buildResourceTypes(lendingTypes())
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
    const bundle = buildResourceTypes(lendingTypes())
    const { crudMutationNames } = buildCrudFields(bundle, stubResolvers)
    expect(crudMutationNames.has('createLoan')).toBe(true)
    expect(crudMutationNames.has('updateLoan')).toBe(true)
    expect(crudMutationNames.has('deleteLoan')).toBe(true)
  })
})
