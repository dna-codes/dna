import {
  resolveStructuralAccess,
  lintEmptySurfaces,
  type StructuralAccessGraph,
} from './structural-access'

// A small product tree: App "Lending" contains Module "Origination",
// which contains Page "Intake".
const tree: StructuralAccessGraph['contains'] = [
  { parent: 'app:lending', child: 'mod:origination' },
  { parent: 'mod:origination', child: 'page:intake' },
]

describe('resolveStructuralAccess', () => {
  it('grants a surface a subject can_access directly', () => {
    const graph: StructuralAccessGraph = {
      grants: [{ subject: 'Underwriter', surface: 'app:lending' }],
      contains: tree,
    }
    expect(resolveStructuralAccess(graph, 'app:lending', ['Underwriter'])).toBe(true)
  })

  it('hides a surface no subject can_access (default deny)', () => {
    const graph: StructuralAccessGraph = {
      grants: [{ subject: 'Underwriter', surface: 'app:lending' }],
      contains: tree,
    }
    expect(resolveStructuralAccess(graph, 'app:lending', ['Borrower'])).toBe(false)
  })

  it('resolves a direct User grant as well as a Role grant', () => {
    const graph: StructuralAccessGraph = {
      grants: [{ subject: 'user:dana', surface: 'app:lending' }],
      contains: tree,
    }
    expect(resolveStructuralAccess(graph, 'app:lending', ['user:dana'])).toBe(true)
  })

  it('cascades a grant down the contains hierarchy', () => {
    const graph: StructuralAccessGraph = {
      grants: [{ subject: 'Underwriter', surface: 'app:lending' }],
      contains: tree,
    }
    // No narrower grant on the Module/Page — inherits the App grant.
    expect(resolveStructuralAccess(graph, 'mod:origination', ['Underwriter'])).toBe(true)
    expect(resolveStructuralAccess(graph, 'page:intake', ['Underwriter'])).toBe(true)
  })

  it('lets a nested grant narrow the inherited App grant', () => {
    const graph: StructuralAccessGraph = {
      grants: [
        { subject: 'Underwriter', surface: 'app:lending' },
        // Module is explicitly restricted to Servicing — overrides inheritance.
        { subject: 'Servicing', surface: 'mod:origination' },
      ],
      contains: tree,
    }
    expect(resolveStructuralAccess(graph, 'app:lending', ['Underwriter'])).toBe(true)
    // Underwriter inherits nothing here: the Module's own grant set decides.
    expect(resolveStructuralAccess(graph, 'mod:origination', ['Underwriter'])).toBe(false)
    expect(resolveStructuralAccess(graph, 'mod:origination', ['Servicing'])).toBe(true)
    // …and the narrowing cascades further down to the Page.
    expect(resolveStructuralAccess(graph, 'page:intake', ['Underwriter'])).toBe(false)
  })

  it('lets a nested grant widen access the App did not give', () => {
    const graph: StructuralAccessGraph = {
      grants: [{ subject: 'Auditor', surface: 'page:intake' }],
      contains: tree,
    }
    // Auditor has no App grant, but the Page grants them directly.
    expect(resolveStructuralAccess(graph, 'app:lending', ['Auditor'])).toBe(false)
    expect(resolveStructuralAccess(graph, 'page:intake', ['Auditor'])).toBe(true)
  })

  it('terminates on a containment cycle', () => {
    const graph: StructuralAccessGraph = {
      grants: [],
      contains: [
        { parent: 'a', child: 'b' },
        { parent: 'b', child: 'a' },
      ],
    }
    expect(resolveStructuralAccess(graph, 'a', ['x'])).toBe(false)
  })
})

describe('lintEmptySurfaces', () => {
  it('flags a role granted a surface whose operations it can never perform', () => {
    const warnings = lintEmptySurfaces({
      grants: [{ subject: 'Borrower', surface: 'page:intake' }],
      surfaceOperations: [{ surface: 'page:intake', operation: 'Loan.Approve' }],
      operationAllows: [{ operation: 'Loan.Approve', role: 'Underwriter' }],
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ subject: 'Borrower', surface: 'page:intake' })
  })

  it('does not flag a role that can perform at least one operation', () => {
    const warnings = lintEmptySurfaces({
      grants: [{ subject: 'Underwriter', surface: 'page:intake' }],
      surfaceOperations: [{ surface: 'page:intake', operation: 'Loan.Approve' }],
      operationAllows: [{ operation: 'Loan.Approve', role: 'Underwriter' }],
    })
    expect(warnings).toHaveLength(0)
  })

  it('treats an operation with no allow-entries as performable by everyone', () => {
    const warnings = lintEmptySurfaces({
      grants: [{ subject: 'Borrower', surface: 'page:intake' }],
      surfaceOperations: [{ surface: 'page:intake', operation: 'Loan.View' }],
      operationAllows: [],
    })
    expect(warnings).toHaveLength(0)
  })

  it('does not flag a surface that exposes no operations (may be planned)', () => {
    const warnings = lintEmptySurfaces({
      grants: [{ subject: 'Borrower', surface: 'page:intake' }],
      surfaceOperations: [],
      operationAllows: [],
    })
    expect(warnings).toHaveLength(0)
  })

  it('rolls operations up from contained surfaces', () => {
    const warnings = lintEmptySurfaces({
      grants: [{ subject: 'Borrower', surface: 'app:lending' }],
      // The App itself exposes nothing; its Page exposes an Underwriter-only op.
      surfaceOperations: [{ surface: 'page:intake', operation: 'Loan.Approve' }],
      operationAllows: [{ operation: 'Loan.Approve', role: 'Underwriter' }],
      contains: tree,
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0].surface).toBe('app:lending')
  })
})
