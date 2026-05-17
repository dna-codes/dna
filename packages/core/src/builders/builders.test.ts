import {
  addGroup,
  addMembership,
  addOperation,
  addPerson,
  addProcess,
  addRelationship,
  addResource,
  addRole,
  addRule,
  addTask,
  addTrigger,
  createOperationalDna,
} from './index'
import { DnaValidator } from '../validator'
import type { OperationalDNA } from '../types/merge'

describe('createOperationalDna', () => {
  it('returns an empty-but-valid DNA shell for a minimal domain', () => {
    const dna = createOperationalDna({ domain: { name: 'lending' } })
    expect(dna).toEqual({ domain: { name: 'lending' } })
  })

  it('carries description and path through when provided', () => {
    const dna = createOperationalDna({
      domain: { name: 'lending', description: 'consumer lending', path: 'acme.lending' },
    })
    expect(dna.domain).toEqual({
      name: 'lending',
      description: 'consumer lending',
      path: 'acme.lending',
    })
  })

  it('does not include collections that were not provided', () => {
    const dna = createOperationalDna({ domain: { name: 'd' } })
    expect((dna.domain as Record<string, unknown>).resources).toBeUndefined()
    expect((dna as Record<string, unknown>).operations).toBeUndefined()
  })
})

describe('builders are pure and immutable', () => {
  it('addResource does not mutate its input DNA', () => {
    const dna = createOperationalDna({ domain: { name: 'd' } })
    const before = JSON.stringify(dna)
    addResource(dna, { name: 'Loan' })
    expect(JSON.stringify(dna)).toBe(before)
  })

  it('addResource returns deeply-equal output across calls when callers pin id', () => {
    // Builders auto-stamp a fresh UUID per call, so two un-pinned calls
    // produce different ids. Pin the id to assert structural equality.
    const dna = createOperationalDna({ domain: { name: 'd' } })
    const a = addResource(dna, { id: '00000000-0000-4000-8000-000000000001', name: 'Loan' })
    const b = addResource(dna, { id: '00000000-0000-4000-8000-000000000001', name: 'Loan' })
    expect(a.dna).toEqual(b.dna)
    expect(a.conflicts).toEqual(b.conflicts)
  })
})

describe('addResource — noun composition matrix', () => {
  const empty = () => createOperationalDna({ domain: { name: 'd' } })

  it('adds a Resource to an empty DNA', () => {
    const r = addResource(empty(), { name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] })
    expect(r.dna.domain.resources).toMatchObject([{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }])
    expect(r.conflicts).toEqual([])
  })

  it('adds two distinct Resources without composition', () => {
    let r = addResource(empty(), { name: 'Loan' })
    r = addResource(r.dna, { name: 'Account' })
    const names = (r.dna.domain.resources as Array<{ name: string }>).map((x) => x.name).sort()
    expect(names).toEqual(['Account', 'Loan'])
    expect(r.conflicts).toEqual([])
  })

  it('composes same-named Resources by unioning child attributes', () => {
    // Pin id so the two calls share identity at both `name` and `id` —
    // otherwise the auto-generated UUIDs would surface a scalar conflict on id.
    const pinned = '00000000-0000-4000-8000-000000000001'
    let r = addResource(empty(), { id: pinned, name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] })
    r = addResource(r.dna, { id: pinned, name: 'Loan', attributes: [{ name: 'status', type: 'enum', values: ['pending', 'active'] }] })
    expect(r.dna.domain.resources).toHaveLength(1)
    const attrs = ((r.dna.domain.resources as Array<{ attributes: Array<{ name: string }> }>)[0].attributes).map((a) => a.name).sort()
    expect(attrs).toEqual(['amount', 'status'])
    expect(r.conflicts).toEqual([])
  })

  it('emits a Conflict when same-named Resources disagree on a scalar', () => {
    // Pin id so the two calls collide on identity and surface only the
    // description disagreement (otherwise id alone would be a scalar conflict).
    const pinned = '00000000-0000-4000-8000-000000000001'
    let r = addResource(empty(), { id: pinned, name: 'Loan', description: 'Consumer loan' })
    r = addResource(r.dna, { id: pinned, name: 'Loan', description: 'Mortgage product' })
    expect(r.conflicts).toHaveLength(1)
    expect(r.conflicts[0].path).toBe('resources.Loan.description')
    expect(r.conflicts[0].kind).toBe('scalar')
  })

  it('never throws on a duplicate name regardless of input shape', () => {
    let r = addResource(empty(), { name: 'Loan', description: 'a' })
    expect(() => {
      r = addResource(r.dna, { name: 'Loan', description: 'b' })
      r = addResource(r.dna, { name: 'Loan', attributes: [{ name: 'x', type: 'string' }] })
    }).not.toThrow()
  })
})

describe('activity builders compose correctly', () => {
  const seeded = () => {
    let r = createOperationalDna({ domain: { name: 'd' } })
    r = addResource(r, { name: 'Loan', actions: [{ name: 'Approve', type: 'write' }] }).dna
    r = addPerson(r, { name: 'Borrower' }).dna
    r = addRole(r, { name: 'Underwriter' }).dna
    r = addGroup(r, { name: 'BankDepartment' }).dna
    return r
  }

  it('addOperation lands the Operation at the top level', () => {
    const r = addOperation(seeded(), { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })
    expect(r.dna.operations).toMatchObject([{ name: 'Loan.Approve', target: 'Loan', action: 'Approve' }])
  })

  it('addTrigger lands the Trigger at the top level', () => {
    let r = addOperation(seeded(), { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })
    r = addTrigger(r.dna, { name: 'LoanApproveUser', operation: 'Loan.Approve', source: 'user' })
    expect(r.dna.triggers).toMatchObject([{ operation: 'Loan.Approve', source: 'user' }])
  })

  it('addRule lands the Rule at the top level', () => {
    let r = addOperation(seeded(), { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })
    r = addRule(r.dna, { name: 'LoanApproveAccess', operation: 'Loan.Approve', subtype: 'access', allow: [{ role: 'Underwriter' }] })
    expect(r.dna.rules).toHaveLength(1)
  })

  it('addTask lands the Task at the top level', () => {
    let r = addOperation(seeded(), { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })
    r = addTask(r.dna, { name: 'approve-loan', actor: 'Underwriter', operation: 'Loan.Approve' })
    expect(r.dna.tasks).toMatchObject([{ name: 'approve-loan', actor: 'Underwriter', operation: 'Loan.Approve' }])
  })

  it('addProcess lands the Process at the top level', () => {
    let r = addOperation(seeded(), { name: 'Loan.Approve', target: 'Loan', action: 'Approve' })
    r = addTask(r.dna, { name: 'approve-loan', actor: 'Underwriter', operation: 'Loan.Approve' })
    r = addProcess(r.dna, {
      name: 'LoanApprovalFlow',
      operator: 'Underwriter',
      startStep: 'approve',
      steps: [{ id: 'approve', task: 'approve-loan' }],
    })
    expect((r.dna.processes as Array<{ name: string }>)[0].name).toBe('LoanApprovalFlow')
  })

  it('addMembership lands the Membership at the top level', () => {
    const r = addMembership(seeded(), { name: 'BorrowerUnderwriter', person: 'Borrower', role: 'Underwriter' })
    expect(r.dna.memberships).toMatchObject([{ name: 'BorrowerUnderwriter', person: 'Borrower', role: 'Underwriter' }])
  })

  it('addRelationship lands the Relationship at the top level', () => {
    let r = addResource(seeded(), { name: 'Borrower' })
    r = addRelationship(r.dna, {
      name: 'Loan.borrower',
      from: 'Loan',
      to: 'Borrower',
      cardinality: 'many-to-one',
      attribute: 'borrower_id',
    })
    expect(r.dna.relationships).toHaveLength(1)
  })
})

describe('runtime validation', () => {
  const empty = () => createOperationalDna({ domain: { name: 'd' } })

  it('default-on validation throws with a useful message on schema violation', () => {
    // enum attribute requires `values` per the schema; TS allows missing it
    // (values is optional in the type) so this only surfaces at runtime.
    expect(() =>
      addResource(empty(), { name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] }),
    ).toThrow(/operational\/resource input failed validation/)
  })

  it('default-on validation rejects malformed Operations', () => {
    // Schema requires action to match ^[A-Z][a-zA-Z0-9]*$ — TS sees just `string`.
    expect(() =>
      addOperation(empty(), { name: 'Loan.Lower', target: 'Loan', action: 'lowercase' }),
    ).toThrow(/failed validation/)
  })

  it('opt-out skips validation for hot paths', () => {
    expect(() =>
      addResource(
        empty(),
        { name: 'Loan', attributes: [{ name: 'status', type: 'enum' }] },
        { validate: false },
      ),
    ).not.toThrow()
  })

  it('valid input passes when validation is on', () => {
    expect(() =>
      addResource(empty(), { name: 'Loan', attributes: [{ name: 'status', type: 'enum', values: ['a'] }] }),
    ).not.toThrow()
  })
})

describe('malformed input — every class of schema violation surfaces', () => {
  const empty = () => createOperationalDna({ domain: { name: 'd' } })

  it('missing required field (Operation.action) throws', () => {
    expect(() =>
      // @ts-expect-error action is required
      addOperation(empty(), { target: 'Loan' }),
    ).toThrow(/required property 'action'/)
  })

  it('missing required field (Membership.role) throws', () => {
    expect(() =>
      // @ts-expect-error role is required
      addMembership(empty(), { name: 'M', person: 'Borrower' }),
    ).toThrow(/required property 'role'/)
  })

  it('missing required field (Process.steps) throws', () => {
    expect(() =>
      // @ts-expect-error steps is required
      addProcess(empty(), { name: 'P', operator: 'Underwriter', startStep: 's' }),
    ).toThrow(/required property 'steps'/)
  })

  it('wrong type at runtime (number where string expected) throws', () => {
    expect(() =>
      // Cast bypasses TS; runtime catches it.
      addResource(empty(), { name: 123 as unknown as string }),
    ).toThrow(/must be string/)
  })

  it('pattern violation on Resource.name (lowercase) throws', () => {
    expect(() =>
      addResource(empty(), { name: 'loan' }),
    ).toThrow(/must match pattern/)
  })

  it('pattern violation on Operation.target throws', () => {
    expect(() =>
      addOperation(empty(), { name: 'Foo.Bar', target: 'has spaces', action: 'Approve' }),
    ).toThrow(/must match pattern/)
  })

  it('invalid enum value (Attribute.type) throws', () => {
    expect(() =>
      addResource(empty(), {
        name: 'Loan',
        // @ts-expect-error 'invalid' is not in the AttributeType enum
        attributes: [{ name: 'x', type: 'invalid' }],
      }),
    ).toThrow(/must be equal to one of/)
  })

  it('invalid enum value (Trigger.source) throws', () => {
    expect(() =>
      addTrigger(empty(), {
        operation: 'Loan.Approve',
        // @ts-expect-error 'manual' is not in TriggerSource
        source: 'manual',
      }),
    ).toThrow(/must be equal to one of/)
  })

  it('additionalProperties violation (unknown field on Resource) throws', () => {
    expect(() =>
      addResource(empty(), {
        name: 'Loan',
        // @ts-expect-error not a known Resource field
        bogus_field: 'oops',
      }),
    ).toThrow(/must NOT have unevaluated properties/)
  })

  it('schema-conditional violation (Trigger.source=schedule without schedule field) throws', () => {
    expect(() =>
      addTrigger(empty(), {
        name: 'LoanDefaultSchedule',
        operation: 'Loan.Default',
        source: 'schedule',
        // schedule field omitted — required when source==='schedule'
      }),
    ).toThrow(/required property 'schedule'/)
  })

  it('schema-conditional violation (Attribute.type=enum without values) throws', () => {
    expect(() =>
      addResource(empty(), {
        name: 'Loan',
        attributes: [{ name: 'status', type: 'enum' }],
      }),
    ).toThrow(/required property 'values'/)
  })

  it('non-object input throws', () => {
    expect(() =>
      // @ts-expect-error string where Resource expected
      addResource(empty(), 'not an object'),
    ).toThrow(/failed validation/)
  })

  it('every malformation passes silently when validate: false', () => {
    // Confirms the opt-out covers every class of violation, not just one.
    expect(() =>
      addResource(empty(), { name: 'lowercase', attributes: [] }, { validate: false }),
    ).not.toThrow()
    expect(() =>
      addOperation(empty(), { name: 'Foo.Bar', target: 'has spaces', action: 'X' }, { validate: false }),
    ).not.toThrow()
    expect(() =>
      addTrigger(
        empty(),
        // @ts-expect-error
        { name: 'XYManual', operation: 'X.Y', source: 'manual' },
        { validate: false },
      ),
    ).not.toThrow()
  })
})

describe('end-to-end schema validation of builder-composed DNA', () => {
  it('a non-trivial DNA composed via builders validates against the operational schema', () => {
    let r = createOperationalDna({ domain: { name: 'lending', path: 'acme.lending' } })
    r = addResource(r, {
      name: 'Loan',
      attributes: [
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
      ],
      actions: [{ name: 'Apply', type: 'write' }, { name: 'Approve', type: 'write' }],
    }).dna
    r = addPerson(r, { name: 'Borrower' }).dna
    r = addPerson(r, { name: 'Employee' }).dna
    r = addGroup(r, { name: 'BankDepartment' }).dna
    r = addRole(r, { name: 'Underwriter', scope: 'BankDepartment' }).dna
    r = addMembership(r, { name: 'EmployeeUnderwriter', person: 'Employee', role: 'Underwriter' }).dna
    r = addOperation(r, { name: 'Loan.Apply', target: 'Loan', action: 'Apply' }).dna
    r = addOperation(r, { name: 'Loan.Approve', target: 'Loan', action: 'Approve' }).dna
    r = addTrigger(r, { name: 'LoanApplyUser', operation: 'Loan.Apply', source: 'user' }).dna
    r = addRule(r, { name: 'LoanApproveAccess', operation: 'Loan.Approve', subtype: 'access', allow: [{ role: 'Underwriter' }] }).dna
    r = addTask(r, { name: 'approve-loan', actor: 'Underwriter', operation: 'Loan.Approve' }).dna
    r = addProcess(r, {
      name: 'LoanApproval',
      operator: 'Underwriter',
      startStep: 'approve',
      steps: [{ id: 'approve', task: 'approve-loan' }],
    }).dna

    const validator = new DnaValidator()
    const result = validator.validate(r, 'operational')
    if (!result.valid) console.error(result.errors)
    expect(result.valid).toBe(true)
  })

  it('builder-composed DNA contains no inline _provenance or _source fields', () => {
    let r = createOperationalDna({ domain: { name: 'd' } })
    r = addResource(r, { name: 'Loan' }).dna
    r = addPerson(r, { name: 'Borrower' }).dna
    r = addOperation(r, { name: 'Loan.Apply', target: 'Loan', action: 'Apply' }).dna
    const json = JSON.stringify(r)
    expect(json.includes('_provenance')).toBe(false)
    expect(json.includes('_source')).toBe(false)
  })
})

describe('builders stamp the base contract', () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  it('addResource stamps id (UUID v4), type, and version when caller omits them', () => {
    const r = addResource(createOperationalDna({ domain: { name: 'd' } }), { name: 'Loan' })
    const stamped = (r.dna.domain.resources as Array<{ id: string; type: string; version: string; name: string }>)[0]
    expect(stamped.id).toMatch(UUID_V4)
    expect(stamped.type).toBe('resource')
    expect(stamped.version).toBe('1')
    expect(stamped.name).toBe('Loan')
  })

  it('addOperation stamps type "operation" and a fresh version', () => {
    const r = addOperation(createOperationalDna({ domain: { name: 'd' } }), {
      name: 'Loan.Approve', target: 'Loan', action: 'Approve',
    })
    const stamped = (r.dna.operations as Array<{ id: string; type: string; version: string }>)[0]
    expect(stamped.type).toBe('operation')
    expect(stamped.version).toBe('1')
    expect(stamped.id).toMatch(UUID_V4)
  })

  it('addRelationship stamps type "relationship"', () => {
    let r = addResource(createOperationalDna({ domain: { name: 'd' } }), {
      name: 'Loan',
      attributes: [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }],
    })
    r = addResource(r.dna, { name: 'Borrower' })
    const out = addRelationship(r.dna, {
      name: 'Loan.borrower', from: 'Loan', to: 'Borrower', cardinality: 'many-to-one', attribute: 'borrower_id',
    })
    const stamped = (out.dna.relationships as Array<{ type: string }>)[0]
    expect(stamped.type).toBe('relationship')
  })

  it('caller-supplied id is preserved', () => {
    const myId = 'a1234567-1111-4abc-8def-0123456789ab'
    const r = addResource(createOperationalDna({ domain: { name: 'd' } }), { id: myId, name: 'Loan' })
    const stamped = (r.dna.domain.resources as Array<{ id: string }>)[0]
    expect(stamped.id).toBe(myId)
  })

  it('caller-supplied version is preserved', () => {
    const r = addResource(createOperationalDna({ domain: { name: 'd' } }), { name: 'Loan', version: '2' })
    const stamped = (r.dna.domain.resources as Array<{ version: string }>)[0]
    expect(stamped.version).toBe('2')
  })
})

// TypeScript negative tests — these are compile-time checks. They live as
// commented `@ts-expect-error` blocks below so reviewers can see the intended
// failures without breaking the build. Uncommenting any block should produce
// a TS compile error.
//
//   const dna: OperationalDNA = createOperationalDna({ domain: { name: 'd' } })
//   // @ts-expect-error name must be a string
//   addResource(dna, { name: 123 })
//   // @ts-expect-error action is required on Operation
//   addOperation(dna, { target: 'Loan' })
//   // @ts-expect-error person and role are required on Membership
//   addMembership(dna, { name: 'M' })
