import { render, renderMany } from './index'
import { DnaInput } from './types'

const dna: DnaInput = {
  operational: {
    domain: {
      name: 'lending',
      path: 'acme.finance.lending',
      description: 'Consumer lending.',
      resources: [
        {
          name: 'Loan',
          description: 'A loan applied for by a borrower.',
          attributes: [
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'enum' },
          ],
          actions: [{ name: 'Apply' }, { name: 'Approve' }],
        },
        { name: 'Borrower' },
        { name: 'Underwriter' },
      ],
    },
    operations: [
      { name: 'Loan.Apply', resource: 'Loan', action: 'Apply', description: 'Submit a loan application.', changes: [{ attribute: 'loan.status', set: 'pending' }] },
      { name: 'Loan.Approve', resource: 'Loan', action: 'Approve', changes: [{ attribute: 'loan.status', set: 'active' }] },
    ],
    triggers: [{ operation: 'Loan.Apply', source: 'user' }],
    rules: [
      { operation: 'Loan.Apply', subtype: 'access', allow: [{ role: 'Borrower' }] },
      { operation: 'Loan.Approve', subtype: 'access', allow: [{ role: 'Underwriter' }] },
      {
        operation: 'Loan.Approve',
        subtype: 'condition',
        conditions: [{ attribute: 'loan.status', operator: 'eq', value: 'pending' }],
      },
    ],
    processes: [
      {
        name: 'LoanOnboarding',
        description: 'End-to-end loan onboarding.',
        operator: 'LendingOps',
        startStep: 's1',
        steps: [
          { id: 's1', task: 'submit-application' },
          { id: 's2', task: 'underwrite-loan', depends_on: ['s1'] },
        ],
      },
    ],
    tasks: [
      { name: 'submit-application', actor: 'Borrower', operation: 'Loan.Apply' },
      { name: 'underwrite-loan', actor: 'Underwriter', operation: 'Loan.Approve' },
    ],
  },
}

describe('render — single combined document', () => {
  it('renders the operations section with the default user-story style', () => {
    const out = render(dna)
    expect(out).toContain('# acme.finance.lending')
    expect(out).toContain('## Operations')
    expect(out).toContain('### Apply Loan')
    expect(out).toContain('**As a** Borrower')
    expect(out).not.toContain('## Domain model')
  })

  it('includes other units when their styles are set', () => {
    const out = render(dna, {
      styles: { operation: 'user-story', resource: 'product-dna', process: 'product-dna' },
    })
    expect(out).toContain('## Operations')
    expect(out).toContain('## Domain model')
    expect(out).toContain('## Processes')
  })

  it('returns empty string for empty DNA', () => {
    expect(render({})).toBe('')
  })
})

describe('renderMany — defaults', () => {
  it('emits one document per operation with prefixed ids', () => {
    const docs = renderMany(dna)
    expect(docs).toHaveLength(2)
    expect(docs[0]).toMatchObject({ id: 'operation-loan-apply', title: 'Apply Loan' })
    expect(docs[1]).toMatchObject({ id: 'operation-loan-approve', title: 'Approve Loan' })
  })

  it('returns an empty array for empty DNA', () => {
    expect(renderMany({})).toEqual([])
  })
})

describe('renderMany — styles', () => {
  it('user-story puts As a / I want / So that + acceptance criteria in the body', () => {
    const [apply] = renderMany(dna, { styles: { operation: 'user-story' } })
    expect(apply.body).toContain('**As a** Borrower')
    expect(apply.body).toContain('**I want to** apply a loan')
    expect(apply.body).toContain('**Triggered by:**')
    expect(apply.body).toContain('**Acceptance criteria:**')
    expect(apply.body).toContain('Sets `loan.status` to `"pending"`')
  })

  it('gherkin renders Feature / Scenario / Given / When / Then', () => {
    const [, approve] = renderMany(dna, { styles: { operation: 'gherkin' } })
    expect(approve.body).toContain('Feature: Approve Loan')
    expect(approve.body).toContain('Scenario:')
    expect(approve.body).toContain('Given an actor with role `Underwriter`')
    expect(approve.body).toContain('And `loan.status` eq "pending"')
    expect(approve.body).toContain('When they approve the loan')
    expect(approve.body).toContain('Then Sets `loan.status` to `"active"`')
  })

  it('product-dna renders Resource / Action / Actor / pre- and postconditions', () => {
    const [, approve] = renderMany(dna, { styles: { operation: 'product-dna' } })
    expect(approve.body).toContain('**Resource:** `Loan`')
    expect(approve.body).toContain('**Action:** `Approve`')
    expect(approve.body).toContain('**Actor:** `Underwriter`')
    expect(approve.body).toContain('**Preconditions:**')
    expect(approve.body).toContain('- `loan.status` eq "pending"')
    expect(approve.body).toContain('**Postconditions:**')
    expect(approve.body).toContain('- Sets `loan.status` to `"active"`')
  })
})

describe('renderMany — multi-unit', () => {
  it('returns docs for every unit in the styles map, in canonical order', () => {
    const docs = renderMany(dna, {
      styles: { operation: 'product-dna', resource: 'product-dna', process: 'product-dna' },
    })
    const ids = docs.map((d) => d.id)
    expect(ids).toEqual([
      'operation-loan-apply',
      'operation-loan-approve',
      'resource-loan',
      'resource-borrower',
      'resource-underwriter',
      'process-loan-onboarding',
    ])
  })

  it('resource body uses product-dna vocabulary', () => {
    const [r] = renderMany(dna, { styles: { resource: 'product-dna' } })
    expect(r.id).toBe('resource-loan')
    expect(r.body).toContain('**Resource:** `Loan`')
    expect(r.body).toContain('**Fields:**')
    expect(r.body).toContain('`amount`: number (required)')
    expect(r.body).toContain('**Actions:**')
  })

  it('process body uses Operation / Role / Steps vocabulary', () => {
    const [p] = renderMany(dna, { styles: { process: 'product-dna' } })
    expect(p.id).toBe('process-loan-onboarding')
    expect(p.body).toContain('**Operation:** `LoanOnboarding`')
    expect(p.body).toContain('**Role:** `LendingOps`')
    expect(p.body).toContain('**Steps:**')
    expect(p.body).toContain('(after: s1)')
  })
})
