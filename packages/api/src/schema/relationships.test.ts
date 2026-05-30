import { GraphQLList, GraphQLNonNull, type GraphQLObjectType } from 'graphql'

import type { RelationshipType, ResourceType } from '@dna-codes/dna-core'

import { planRelationshipFields } from './relationships'
import { buildResourceTypes } from './types'

function makeRT(name: string, attrs: ResourceType['attribute_schema'] = []): ResourceType {
  return {
    id: `rt-${name}`,
    name,
    category: 'resource',
    attribute_schema: attrs,
    current_version: 1,
    stability: 'experimental',
    is_seed: false,
  }
}

function makeRRT(cardinality: RelationshipType['cardinality']): RelationshipType {
  return {
    id: 'rrt-1',
    name: 'Loan.borrower',
    from: 'Loan',
    to: 'Borrower',
    cardinality,
    attribute: 'borrower_id',
    current_version: 1,
    stability: 'experimental',
    is_seed: false,
  }
}

describe('schema/relationships — planRelationshipFields', () => {
  it('many-to-one produces a single-valued expansion field', () => {
    const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const plan = planRelationshipFields([makeRRT('many-to-one')], bundle)
    expect(plan).toHaveLength(1)
    expect(plan[0].fieldName).toBe('borrower')
    expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'))
  })

  it('one-to-one produces a single-valued expansion field', () => {
    const types = [makeRT('Loan'), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const plan = planRelationshipFields([makeRRT('one-to-one')], bundle)
    expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'))
  })

  it('one-to-many produces a list-valued expansion field', () => {
    const types = [makeRT('Loan'), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const plan = planRelationshipFields([makeRRT('one-to-many')], bundle)
    expect(plan[0].fieldType).toBeInstanceOf(GraphQLList)
    const listType = plan[0].fieldType as unknown as { ofType: unknown }
    expect(listType.ofType).toBeInstanceOf(GraphQLNonNull)
  })

  it('many-to-many produces a list-valued expansion field', () => {
    const types = [makeRT('Loan'), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const plan = planRelationshipFields([makeRRT('many-to-many')], bundle)
    expect(plan[0].fieldType).toBeInstanceOf(GraphQLList)
  })

  it('RelationshipType with missing endpoints is silently skipped', () => {
    const bundle = buildResourceTypes([makeRT('Loan')])
    const plan = planRelationshipFields([makeRRT('many-to-one')], bundle)
    expect(plan).toHaveLength(0)
  })

  it('FK attribute stays on the from-type alongside the expansion plan', () => {
    const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const Loan = bundle.registry.get('Loan') as GraphQLObjectType
    expect(Loan.getFields().borrowerId).toBeDefined()
  })

  it('no RelationshipType means no expansion plan even with reference attribute', () => {
    const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')]
    const bundle = buildResourceTypes(types)
    const plan = planRelationshipFields([], bundle)
    expect(plan).toHaveLength(0)
  })
})
