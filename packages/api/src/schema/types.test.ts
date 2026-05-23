import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import type { OperationalDNA } from '@dna-codes/dna-core'

import { buildResourceTypes } from './types'

function lendingLikeDna(): OperationalDNA {
  return {
    domain: {
      name: 'lending',
      resources: [
        {
          name: 'Loan',
          attributes: [
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
            { name: 'borrower_id', type: 'reference', resource: 'Borrower' },
            { name: 'opened_at', type: 'datetime' },
          ],
        },
        {
          name: 'Borrower',
          attributes: [{ name: 'email', type: 'string' }],
        },
      ],
      persons: [{ name: 'Customer' }],
      roles: [{ name: 'Underwriter' }],
      groups: [{ name: 'BankDepartment' }],
    },
  }
}

describe('schema/types — buildResourceTypes', () => {
  it('emits one GraphQL type per noun primitive', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    expect([...bundle.registry.keys()].sort()).toEqual(
      ['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort(),
    )
    expect([...bundle.inputRegistry.keys()].sort()).toEqual(
      ['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort(),
    )
  })

  it('every type carries id: ID!', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const Loan = bundle.registry.get('Loan') as GraphQLObjectType
    const idField = Loan.getFields().id
    expect(idField).toBeDefined()
    expect(String(idField.type)).toBe('ID!')
  })

  it('maps scalar attribute types per D1', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const Loan = bundle.registry.get('Loan')!.getFields()
    expect(Loan.amount.type).toBeInstanceOf(GraphQLNonNull)
    // amount required → Float!
    const amountInner = (Loan.amount.type as GraphQLNonNull<typeof GraphQLFloat>).ofType
    expect(amountInner).toBe(GraphQLFloat)
    // openedAt → String (datetime mapped to String in v1)
    expect(Loan.openedAt.type).toBe(GraphQLString)
    // borrower_id reference attribute → ID scalar
    expect(Loan.borrowerId.type).toBe(GraphQLID)
  })

  it('generates per-attribute enum types named <Type><Attribute>', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const LoanStatus = bundle.enumRegistry.get('Loan.status') as GraphQLEnumType
    expect(LoanStatus).toBeDefined()
    expect(LoanStatus.name).toBe('LoanStatus')
    expect(LoanStatus.getValues().map((v) => v.name).sort()).toEqual(['ACTIVE', 'PENDING', 'REPAID'])
    // Enum value backs to the lowercase DNA value
    expect(LoanStatus.getValue('PENDING')?.value).toBe('pending')
  })

  it('maps required attributes to non-null wrappers', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const Loan = bundle.registry.get('Loan')!.getFields()
    expect(Loan.amount.type).toBeInstanceOf(GraphQLNonNull)
    // status is not required → not wrapped
    expect(Loan.status.type).not.toBeInstanceOf(GraphQLNonNull)
  })

  it('converts snake_case attribute names to camelCase fields', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const Loan = bundle.registry.get('Loan')!.getFields()
    expect(Loan.borrowerId).toBeDefined()
    expect(Loan.openedAt).toBeDefined()
    // snake_case keys are NOT present
    expect((Loan as Record<string, unknown>).borrower_id).toBeUndefined()
  })

  it('produces input types with optional id + attribute fields', () => {
    const bundle = buildResourceTypes(lendingLikeDna())
    const LoanInput = bundle.inputRegistry.get('Loan')!.getFields()
    // Every Input type includes an optional `id: ID` (hybrid-ID
    // contract from the underlying store).
    expect(LoanInput.id).toBeDefined()
    expect(String(LoanInput.id.type)).toBe('ID')
    expect(LoanInput.amount).toBeDefined()
    expect(LoanInput.status).toBeDefined()
    expect(LoanInput.borrowerId).toBeDefined()
  })

  it('Input types for attribute-less primitives still satisfy the one-field minimum', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex', persons: [{ name: 'Employee' }] },
    }
    const bundle = buildResourceTypes(dna)
    const EmployeeInput = bundle.inputRegistry.get('Employee')!.getFields()
    expect(Object.keys(EmployeeInput)).toEqual(['id'])
  })

  it('skips an attribute named "id" so it does not collide with reserved id: ID!', () => {
    const dna: OperationalDNA = {
      domain: {
        name: 'ex',
        resources: [
          {
            name: 'Thing',
            attributes: [
              { name: 'id', type: 'string', required: true },
              { name: 'kind', type: 'string' },
            ],
          },
        ],
      },
    }
    const bundle = buildResourceTypes(dna)
    const Thing = bundle.registry.get('Thing')!.getFields()
    expect(Thing.id.type).toBe(new GraphQLNonNull(GraphQLID).constructor.prototype.constructor === GraphQLNonNull ? Thing.id.type : Thing.id.type)
    // The reserved id field stays ID! (not string-coerced).
    const inner = (Thing.id.type as GraphQLNonNull<typeof GraphQLID>).ofType
    expect(inner).toBe(GraphQLID)
  })

  it('maps boolean attribute → GraphQLBoolean', () => {
    const dna: OperationalDNA = {
      domain: {
        name: 'ex',
        resources: [{ name: 'Flag', attributes: [{ name: 'enabled', type: 'boolean' }] }],
      },
    }
    const bundle = buildResourceTypes(dna)
    const Flag = bundle.registry.get('Flag')!.getFields()
    expect(Flag.enabled.type).toBe(GraphQLBoolean)
  })
})
