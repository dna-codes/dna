import { DnaValidator } from './validator'
import { lenses } from './index'

const validator = new DnaValidator()

describe('product/ui/workflow', () => {
  it('validates a minimal workflow', () => {
    const result = validator.validate({ name: 'LoanApplication' }, 'product/ui/workflow')
    expect(result.valid).toBe(true)
  })

  it('validates a workflow with pages', () => {
    const result = validator.validate(
      { name: 'LoanApplication', resource: 'Loan', pages: ['LoanApply', 'LoanReview'] },
      'product/ui/workflow',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects a workflow missing name', () => {
    const result = validator.validate({ resource: 'Loan' }, 'product/ui/workflow')
    expect(result.valid).toBe(false)
  })

  it('accepts a workflow with no pages (pages optional)', () => {
    const result = validator.validate({ name: 'Onboarding' }, 'product/ui/workflow')
    expect(result.valid).toBe(true)
  })
})

describe('product/ui/section', () => {
  it('validates a minimal section', () => {
    const result = validator.validate({ name: 'Main' }, 'product/ui/section')
    expect(result.valid).toBe(true)
  })

  it('validates a section with components', () => {
    const result = validator.validate(
      { name: 'Main', role: 'main', components: [{ name: 'LoanCard', type: 'card' }] },
      'product/ui/section',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects a section with an unknown role', () => {
    const result = validator.validate({ name: 'Main', role: 'cockpit' }, 'product/ui/section')
    expect(result.valid).toBe(false)
  })
})

describe('product/ui/component', () => {
  it('validates a minimal component', () => {
    const result = validator.validate({ name: 'LoanCard', type: 'card' }, 'product/ui/component')
    expect(result.valid).toBe(true)
  })

  it('validates a component with an operation ref', () => {
    const result = validator.validate(
      { name: 'ApplyForm', type: 'form', operation: 'Loan.Apply' },
      'product/ui/component',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects a component missing type', () => {
    const result = validator.validate({ name: 'LoanCard' }, 'product/ui/component')
    expect(result.valid).toBe(false)
  })

  it('rejects a component with a malformed operation ref', () => {
    const result = validator.validate(
      { name: 'ApplyForm', type: 'form', operation: 'loan.apply' },
      'product/ui/component',
    )
    expect(result.valid).toBe(false)
  })
})

describe('product/ui/element', () => {
  it('validates a minimal element', () => {
    const result = validator.validate({ name: 'SubmitButton', type: 'button' }, 'product/ui/element')
    expect(result.valid).toBe(true)
  })

  it('validates an element with a field ref', () => {
    const result = validator.validate({ name: 'AmountInput', type: 'input', field: 'amount' }, 'product/ui/element')
    expect(result.valid).toBe(true)
  })

  it('rejects an element with an unknown type', () => {
    const result = validator.validate({ name: 'Widget', type: 'hologram' }, 'product/ui/element')
    expect(result.valid).toBe(false)
  })
})

describe('product/ui/operation', () => {
  const base = {
    id: 'submit-loan',
    name: 'SubmitLoan',
    trigger: { component: 'SubmitButton', event: 'click' },
  }

  it('validates a minimal operation', () => {
    const result = validator.validate(
      { ...base, effects: [{ type: 'navigate', to: 'LoanConfirm' }] },
      'product/ui/operation',
    )
    expect(result.valid).toBe(true)
  })

  it('validates all four effect types', () => {
    const result = validator.validate(
      {
        ...base,
        effects: [
          { type: 'state-change', target: 'form.submitting', value: true },
          { type: 'api-call', operation: 'Loan.Apply' },
          { type: 'render', component: 'SuccessBanner' },
          { type: 'navigate', to: 'LoanConfirm' },
        ],
      },
      'product/ui/operation',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects an unknown effect type', () => {
    const result = validator.validate(
      { ...base, effects: [{ type: 'teleport', to: 'LoanConfirm' }] },
      'product/ui/operation',
    )
    expect(result.valid).toBe(false)
  })

  it('rejects an operation missing trigger', () => {
    const result = validator.validate(
      { id: 'x', name: 'X', effects: [{ type: 'navigate', to: 'Home' }] },
      'product/ui/operation',
    )
    expect(result.valid).toBe(false)
  })

  it('rejects an operation missing effects', () => {
    const result = validator.validate(base, 'product/ui/operation')
    expect(result.valid).toBe(false)
  })

  it('rejects an operation with empty effects array', () => {
    const result = validator.validate({ ...base, effects: [] }, 'product/ui/operation')
    expect(result.valid).toBe(false)
  })
})

describe('product/ui composite', () => {
  const layout = { name: 'Shell', type: 'sidebar' }
  const pages = [{ name: 'LoanList', resource: 'Loan' }]
  const routes = [{ path: '/loans', page: 'LoanList' }]

  it('validates a composite with workflows', () => {
    const result = validator.validate(
      { layout, pages, routes, workflows: [{ name: 'LoanApplication', pages: ['LoanList'] }] },
      'product/ui',
    )
    expect(result.valid).toBe(true)
  })

  it('validates a composite with operations', () => {
    const result = validator.validate(
      {
        layout,
        pages,
        routes,
        operations: [
          {
            id: 'open-loan',
            name: 'OpenLoan',
            trigger: { component: 'LoanRow', event: 'click' },
            effects: [{ type: 'navigate', to: 'LoanDetail' }],
          },
        ],
      },
      'product/ui',
    )
    expect(result.valid).toBe(true)
  })

  it('validates an existing composite without workflows or operations (additive, non-breaking)', () => {
    const result = validator.validate({ layout, pages, routes }, 'product/ui')
    expect(result.valid).toBe(true)
  })
})

describe('product/ui/app', () => {
  it('validates a minimal app', () => {
    const result = validator.validate({ name: 'Lending' }, 'product/ui/app')
    expect(result.valid).toBe(true)
  })

  it('validates an app realizing a Domain with modules', () => {
    const result = validator.validate(
      { name: 'Lending', realizes: 'Lending', modules: ['Origination'] },
      'product/ui/app',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects an app missing name', () => {
    const result = validator.validate({ realizes: 'Lending' }, 'product/ui/app')
    expect(result.valid).toBe(false)
  })
})

describe('product/ui/module', () => {
  it('validates a minimal module', () => {
    const result = validator.validate({ name: 'Origination' }, 'product/ui/module')
    expect(result.valid).toBe(true)
  })

  it('validates a module realizing a Process with pages', () => {
    const result = validator.validate(
      { name: 'Origination', realizes: 'LoanOrigination', pages: ['ApplicationPage'] },
      'product/ui/module',
    )
    expect(result.valid).toBe(true)
  })
})

describe('product/ui composite with apps and modules', () => {
  it('validates a composite with top-level apps and modules', () => {
    const result = validator.validate(
      {
        layout: { name: 'LendingDashboard', type: 'sidebar' },
        pages: [{ name: 'LoanList', resource: 'Loan', blocks: [{ name: 'LoanTable', type: 'table', operation: 'Loan.List' }] }],
        routes: [{ path: '/loans', page: 'LoanList' }],
        apps: [{ name: 'Lending', realizes: 'Lending', modules: ['Origination'] }],
        modules: [{ name: 'Origination', realizes: 'LoanOrigination' }],
      },
      'product/ui',
    )
    expect(result.valid).toBe(true)
  })
})

describe('product-ui lens coverage', () => {
  it('covers app/module/endpoint/namespace nodes and realized_as/exposes edges', () => {
    const lens = lenses.productUi as unknown as { nodes: { slot: string }[]; edges: { via: string }[] }
    const slots = new Set(lens.nodes.map(n => n.slot))
    for (const s of ['app', 'module', 'endpoint', 'namespace']) expect(slots.has(s)).toBe(true)
    const vias = new Set(lens.edges.map(e => e.via))
    expect(vias.has('realized_as')).toBe(true)
    expect(vias.has('exposes')).toBe(true)
  })
})
