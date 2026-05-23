import { GraphQLList, GraphQLNonNull, type GraphQLObjectType } from 'graphql'

import type { OperationalDNA } from '@dna-codes/dna-core'

import { planRelationshipFields } from './relationships'
import { buildResourceTypes } from './types'

function makeDna(relCardinality: 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many'): OperationalDNA {
  return {
    domain: {
      name: 'ex',
      resources: [
        { name: 'Loan', attributes: [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }] },
        { name: 'Borrower', attributes: [{ name: 'email', type: 'string' }] },
      ],
    },
    relationships: [
      {
        name: 'Loan.borrower',
        from: 'Loan',
        to: 'Borrower',
        cardinality: relCardinality,
        attribute: 'borrower_id',
      },
    ],
  }
}

describe('schema/relationships — planRelationshipFields', () => {
  it('many-to-one produces a single-valued expansion field', () => {
    const dna = makeDna('many-to-one')
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan).toHaveLength(1)
    expect(plan[0].fieldName).toBe('borrower')
    // Single-valued → not wrapped in a List
    expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'))
  })

  it('one-to-one produces a single-valued expansion field', () => {
    const dna = makeDna('one-to-one')
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'))
  })

  it('one-to-many produces a list-valued expansion field', () => {
    const dna = makeDna('one-to-many')
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan[0].fieldType).toBeInstanceOf(GraphQLList)
    const listType = plan[0].fieldType as unknown as { ofType: unknown }
    expect(listType.ofType).toBeInstanceOf(GraphQLNonNull)
  })

  it('many-to-many produces a list-valued expansion field', () => {
    const dna = makeDna('many-to-many')
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan[0].fieldType).toBeInstanceOf(GraphQLList)
  })

  it('relationship whose endpoints are missing from the registry is silently skipped', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex', resources: [{ name: 'Loan' }] },
      relationships: [
        {
          name: 'Loan.borrower',
          from: 'Loan',
          to: 'MissingType',
          cardinality: 'many-to-one',
          attribute: 'borrower_id',
        },
      ],
    }
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan).toHaveLength(0)
  })

  it('FK attribute stays present alongside the expansion field', () => {
    const dna = makeDna('many-to-one')
    const bundle = buildResourceTypes(dna)
    // The expansion field is installed by the schema composer; for this
    // unit, we just verify the FK scalar field exists in the base types.
    const Loan = bundle.registry.get('Loan') as GraphQLObjectType
    expect(Loan.getFields().borrowerId).toBeDefined()
  })

  it('Resources with a reference attribute but no declared Relationship omit the expansion', () => {
    const dna: OperationalDNA = {
      domain: {
        name: 'ex',
        resources: [
          { name: 'Loan', attributes: [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }] },
          { name: 'Borrower' },
        ],
      },
    }
    const bundle = buildResourceTypes(dna)
    const plan = planRelationshipFields(dna, bundle)
    expect(plan).toHaveLength(0)
  })
})
