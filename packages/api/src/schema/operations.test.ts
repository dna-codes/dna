import type { OperationalDNA } from '@dna-codes/dna-core'

import { buildOperationMutations } from './operations'
import { buildResourceTypes } from './types'

function lendingDna(): OperationalDNA {
  return {
    domain: {
      name: 'lending',
      resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'string' }] }],
    },
    operations: [
      { name: 'Loan.Apply', target: 'Loan', action: 'Apply' },
      { name: 'Loan.Approve', target: 'Loan', action: 'Approve' },
    ],
  }
}

const stubResolvers = { forTarget: () => () => null }

describe('schema/operations — buildOperationMutations', () => {
  it('emits one mutation per DNA Operation with camelCased name', () => {
    const dna = lendingDna()
    const bundle = buildResourceTypes(dna)
    const { mutations } = buildOperationMutations(dna, bundle, stubResolvers, new Set())
    expect(mutations.loanApply).toBeDefined()
    expect(mutations.loanApprove).toBeDefined()
  })

  it('signature is (id: ID!, input: <Target>Input!): <Target>!', () => {
    const dna = lendingDna()
    const bundle = buildResourceTypes(dna)
    const { mutations } = buildOperationMutations(dna, bundle, stubResolvers, new Set())
    const loanApply = mutations.loanApply
    expect(loanApply.args?.id).toBeDefined()
    expect(loanApply.args?.input).toBeDefined()
  })

  it('Operation-CRUD name collisions are reported via crudMutationsToOmit', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex', resources: [{ name: 'Loan' }] },
      operations: [{ name: 'Loan.Create', target: 'Loan', action: 'Create' }],
    }
    const bundle = buildResourceTypes(dna)
    // The Operation mutation name would be `loanCreate`. Provide a
    // synthetic CRUD set that *includes* that name to simulate a
    // contrived collision (the realistic generator does not produce
    // `loanCreate`, but the omission policy must still be honored).
    const fakeCrud = new Set<string>(['loanCreate'])
    const { mutations, crudMutationsToOmit } = buildOperationMutations(
      dna,
      bundle,
      stubResolvers,
      fakeCrud,
    )
    expect(mutations.loanCreate).toBeDefined()
    expect(crudMutationsToOmit.has('loanCreate')).toBe(true)
  })

  it('silently skips Operations whose target is missing from the registry', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex' },
      operations: [{ name: 'Phantom.Do', target: 'Phantom', action: 'Do' }],
    }
    const bundle = buildResourceTypes(dna)
    const { mutations } = buildOperationMutations(dna, bundle, stubResolvers, new Set())
    expect(Object.keys(mutations)).toHaveLength(0)
  })

  it('de-duplicates same-named Operations (first wins)', () => {
    const dna: OperationalDNA = {
      domain: { name: 'ex', resources: [{ name: 'Loan' }] },
      operations: [
        { name: 'Loan.Apply', target: 'Loan', action: 'Apply' },
        { name: 'Loan.Apply.Duplicate', target: 'Loan', action: 'Apply' },
      ],
    }
    const bundle = buildResourceTypes(dna)
    const { mutations } = buildOperationMutations(dna, bundle, stubResolvers, new Set())
    expect(Object.keys(mutations)).toEqual(['loanApply'])
  })
})
