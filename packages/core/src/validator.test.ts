import { DnaValidator } from './validator'
import { schemas } from './index'

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000'

const rawValidator = new DnaValidator()

/**
 * Test-only validator wrapper: when validating against a per-primitive
 * operational schema, auto-injects the base contract (`id`, `type`,
 * `version`) on the document so tests can keep their concise inline
 * fixtures. The base contract is exercised explicitly in a dedicated
 * test block — see "operational base-primitive contract" below.
 */
const validator = {
  validate(doc: unknown, schemaId: string) {
    if (
      doc &&
      typeof doc === 'object' &&
      !Array.isArray(doc) &&
      schemaId.startsWith('operational/') &&
      schemaId !== 'operational' &&
      schemaId !== 'operational/base'
    ) {
      const type = schemaId.split('/').pop()!
      const obj = doc as Record<string, unknown>
      doc = {
        id: obj.id ?? TEST_UUID,
        type: obj.type ?? type,
        version: obj.version ?? '1',
        // Some primitives didn't previously require `name` (Trigger, Operation, Rule).
        // The base contract now does. Synthesize one for fixtures that omit it so
        // tests stay focused on the per-primitive shape they're exercising.
        name: obj.name ?? `${type}TestName`,
        ...obj,
      }
    }
    return rawValidator.validate(doc, schemaId)
  },
  validateCrossLayer: rawValidator.validateCrossLayer.bind(rawValidator),
  availableSchemas: rawValidator.availableSchemas.bind(rawValidator),
  // Forwarded so the schema-introspection tests can reach into the private map.
  validators: (rawValidator as unknown as { validators: Map<string, unknown> }).validators,
}

/**
 * Walks an Operational DNA shape and stamps every primitive with the base
 * contract (`id`, `type`, `version`, and a synthesized `name` when absent).
 * Used so the long-lived inline fixtures stay readable while still satisfying
 * the post-base-contract schema. Mutates a fresh copy and returns it.
 */
function stampOperationalBase<T extends Record<string, any>>(doc: T): T {
  const synthName = (type: string) => `${type}TestName`
  const stamp = (type: string, p: any) => {
    if (!p || typeof p !== 'object') return p
    return {
      id: p.id ?? TEST_UUID,
      type: p.type ?? type,
      version: p.version ?? '1',
      name: p.name ?? synthName(type),
      ...p,
    }
  }
  const stampList = (type: string, arr: any) =>
    Array.isArray(arr) ? arr.map(p => stamp(type, p)) : arr
  const walkDomain = (d: any) => {
    if (!d || typeof d !== 'object') return d
    const out: any = { ...d }
    if (d.resources) out.resources = stampList('resource', d.resources)
    if (d.persons) out.persons = stampList('person', d.persons)
    if (d.roles) out.roles = stampList('role', d.roles)
    if (d.groups) out.groups = stampList('group', d.groups)
    if (Array.isArray(d.domains)) out.domains = d.domains.map(walkDomain)
    return out
  }
  const out: any = { ...doc }
  if ((doc as any).domain) out.domain = walkDomain((doc as any).domain)
  // Some layers (product/core) keep resources at the top level
  if ((doc as any).resources && !((doc as any).domain?.resources))
    out.resources = stampList('resource', (doc as any).resources)
  if ((doc as any).memberships) out.memberships = stampList('membership', (doc as any).memberships)
  if ((doc as any).operations) out.operations = stampList('operation', (doc as any).operations)
  if ((doc as any).triggers) out.triggers = stampList('trigger', (doc as any).triggers)
  if ((doc as any).rules) out.rules = stampList('rule', (doc as any).rules)
  if ((doc as any).relationships) out.relationships = stampList('relationship', (doc as any).relationships)
  if ((doc as any).tasks) out.tasks = stampList('task', (doc as any).tasks)
  if ((doc as any).processes) out.processes = stampList('process', (doc as any).processes)
  return out
}

// Shared inline fixtures for cross-layer tests. Intentionally minimal but
// wired end-to-end so the baseline "passes for valid DNA" case holds; each
// test spreads and overrides what it needs to exercise a specific error path.
const operationalFixture = {
  domain: {
    name: 'lending',
    path: 'acme.finance.lending',
    resources: [
      {
        name: 'Loan',
        attributes: [
          { name: 'id', type: 'string', required: true },
          { name: 'borrower_id', type: 'reference', resource: 'Borrower' },
          { name: 'status', type: 'string' },
        ],
        actions: [
          { name: 'Apply', type: 'write' },
          { name: 'Approve', type: 'write' },
          { name: 'View', type: 'read' },
          { name: 'List', type: 'read' },
        ],
      },
    ],
    persons: [
      { name: 'Borrower', attributes: [{ name: 'id', type: 'string', required: true }] },
      { name: 'Employee' },
    ],
    groups: [
      { name: 'BankDepartment', attributes: [{ name: 'region', type: 'string' }] },
    ],
    roles: [
      { name: 'Underwriter', scope: 'BankDepartment' },
      { name: 'LendingManager', scope: 'BankDepartment' },
    ],
  },
  memberships: [
    { name: 'EmployeeUnderwriter', person: 'Employee', role: 'Underwriter' },
    { name: 'EmployeeLendingManager', person: 'Employee', role: 'LendingManager' },
  ],
  operations: [
    { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
    { target: 'Loan', action: 'Approve', name: 'Loan.Approve', changes: [{ attribute: 'loan.status', set: 'active' }] },
    { target: 'Loan', action: 'View', name: 'Loan.View' },
  ],
  triggers: [{ operation: 'Loan.Apply', source: 'user' }],
  relationships: [
    {
      name: 'Loan.borrower',
      from: 'Loan',
      to: 'Borrower',
      cardinality: 'many-to-one',
      attribute: 'borrower_id',
    },
  ],
} as any

const productApiFixture = {
  namespace: { name: 'Lending', path: '/lending' },
  resources: [
    {
      name: 'Loan',
      resource: 'Loan',
      fields: [],
      actions: [
        { name: 'Approve', action: 'Approve' },
        { name: 'View', action: 'View' },
      ],
    },
  ],
  operations: [
    { name: 'Loan.Approve', resource: 'Loan', action: 'Approve' },
    { name: 'Loan.View', resource: 'Loan', action: 'View' },
  ],
  endpoints: [
    { method: 'POST', path: '/loans/:id/approve', operation: 'Loan.Approve' },
    { method: 'GET', path: '/loans/:id', operation: 'Loan.View' },
  ],
} as any

const productUiFixture = {
  layout: { name: 'AppLayout', type: 'sidebar' },
  pages: [
    {
      name: 'LoanList',
      resource: 'Loan',
      blocks: [{ name: 'LB', type: 'list', operation: 'Loan.View' }],
    },
  ],
  routes: [{ path: '/loans', page: 'LoanList' }],
} as any

const technicalFixture = {
  providers: [{ name: 'aws', type: 'cloud', region: 'us-east-1' }],
  constructs: [
    { name: 'primary-db', type: 'database', category: 'storage', provider: 'aws' },
  ],
  cells: [
    {
      name: 'api',
      dna: 'product/api',
      adapter: { type: 'node/express' },
      constructs: ['primary-db'],
    },
  ],
} as any

const productCoreFixture = {
  domain: { name: 'lending', path: 'acme.finance.lending' },
  resources: [
    {
      name: 'Loan',
      attributes: [{ name: 'id', type: 'string' }],
      actions: [{ name: 'Approve' }, { name: 'View' }],
    },
  ],
  operations: [
    { resource: 'Loan', action: 'Approve', name: 'Loan.Approve' },
    { resource: 'Loan', action: 'View', name: 'Loan.View' },
  ],
} as any

describe('DnaValidator — operational/resource', () => {
  it('validates a valid Resource document', () => {
    const doc = {
      name: 'Loan',
      description: 'A financial loan issued to a borrower.',
      domain: 'acme.finance.lending',
      attributes: [
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'enum', required: true, values: ['pending', 'active', 'repaid', 'defaulted'] }
      ],
      actions: [{ name: 'Apply', type: 'write' }, { name: 'Approve', type: 'write' }]
    }
    const result = validator.validate(doc, 'operational/resource')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a Resource missing required name field', () => {
    // Use rawValidator so the helper doesn't auto-inject `name`.
    const result = rawValidator.validate({ id: TEST_UUID, type: 'resource', version: '1', domain: 'acme.finance' }, 'operational/resource')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'name')).toBe(true)
  })

  it('rejects a Resource declaring a stripped field (scope)', () => {
    const result = validator.validate({ name: 'Loan', scope: 'BankDepartment' }, 'operational/resource')
    expect(result.valid).toBe(false)
  })

  it('rejects a Resource declaring stripped memberships', () => {
    const result = validator.validate({
      name: 'Joe',
      memberships: [{ role: 'Father', in: 'Family' }],
    }, 'operational/resource')
    expect(result.valid).toBe(false)
  })

  it('rejects an Attribute with enum type but no values', () => {
    const doc = {
      name: 'Order',
      attributes: [{ name: 'status', type: 'enum' }]
    }
    const result = validator.validate(doc, 'operational/resource')
    expect(result.valid).toBe(false)
  })

  it('validates a Resource declaring a valid stability (base contract)', () => {
    const result = validator.validate({ name: 'Loan', stability: 'beta' }, 'operational/resource')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates a Resource with stability absent (optional base field)', () => {
    const result = validator.validate({ name: 'Loan' }, 'operational/resource')
    expect(result.valid).toBe(true)
  })

  it('rejects a Resource with an out-of-range stability value', () => {
    const result = validator.validate({ name: 'Loan', stability: 'ga' }, 'operational/resource')
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.instancePath.includes('stability'))).toBe(true)
  })
})

describe('DnaValidator — operational/person', () => {
  it('validates a Person with attributes and actions', () => {
    const result = validator.validate({
      name: 'Patient',
      attributes: [{ name: 'dob', type: 'date' }],
      actions: [
        { name: 'GetAdmitted', type: 'write' },
        { name: 'GetDischarged', type: 'write' },
      ],
    }, 'operational/person')
    expect(result.valid).toBe(true)
  })

  it('validates a Person with a resource link', () => {
    const result = validator.validate({
      name: 'Customer',
      resource: 'Customer',
    }, 'operational/person')
    expect(result.valid).toBe(true)
  })

  it('rejects a Person missing name', () => {
    const result = validator.validate({}, 'operational/person')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — operational/group', () => {
  it('validates a Group with attributes, actions, and parent', () => {
    const result = validator.validate({
      name: 'Ward',
      parent: 'Hospital',
      attributes: [{ name: 'floor', type: 'number' }],
      actions: [{ name: 'Open', type: 'write' }],
    }, 'operational/group')
    expect(result.valid).toBe(true)
  })

  it('rejects a Group missing name', () => {
    const result = validator.validate({}, 'operational/group')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — operational/role', () => {
  it('validates a Role with single scope', () => {
    const result = validator.validate({
      name: 'Underwriter',
      scope: 'BankDepartment',
    }, 'operational/role')
    expect(result.valid).toBe(true)
  })

  it('validates a Role with multi-scope (array)', () => {
    const result = validator.validate({
      name: 'SuperAdmin',
      scope: ['Workspace', 'Tenant'],
    }, 'operational/role')
    expect(result.valid).toBe(true)
  })

  it('validates a system Role with resource link', () => {
    const result = validator.validate({
      name: 'NightlyDelinquencySweep',
      system: true,
      resource: 'ScheduledJob',
    }, 'operational/role')
    expect(result.valid).toBe(true)
  })

  it('validates a global Role (no scope)', () => {
    const result = validator.validate({ name: 'SystemAuditor' }, 'operational/role')
    expect(result.valid).toBe(true)
  })

  it('rejects a Role missing name', () => {
    const result = validator.validate({ scope: 'BankDepartment' }, 'operational/role')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — operational/membership', () => {
  it('validates a Membership with required fields', () => {
    const result = validator.validate({
      name: 'EmployeeUnderwriter',
      person: 'Employee',
      role: 'Underwriter',
    }, 'operational/membership')
    expect(result.valid).toBe(true)
  })

  it('validates a Membership with explicit group', () => {
    const result = validator.validate({
      name: 'EmployeeAdminWorkspace',
      person: 'Employee',
      role: 'SuperAdmin',
      group: 'Workspace',
    }, 'operational/membership')
    expect(result.valid).toBe(true)
  })

  it('rejects a Membership missing person', () => {
    const result = validator.validate({
      name: 'X',
      role: 'Underwriter',
    }, 'operational/membership')
    expect(result.valid).toBe(false)
  })

  it('rejects a Membership missing role', () => {
    const result = validator.validate({
      name: 'X',
      person: 'Employee',
    }, 'operational/membership')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — operational/operation', () => {
  it('validates a valid Operation targeting a Resource', () => {
    const result = validator.validate({ target: 'Loan', action: 'Approve', name: 'Loan.Approve' }, 'operational/operation')
    expect(result.valid).toBe(true)
  })

  it('validates an Operation targeting a Person', () => {
    const result = validator.validate({ target: 'Patient', action: 'GetAdmitted', name: 'Patient.GetAdmitted' }, 'operational/operation')
    expect(result.valid).toBe(true)
  })

  it('validates an Operation targeting a Role (org-admin)', () => {
    const result = validator.validate({ target: 'Underwriter', action: 'Activate', name: 'Underwriter.Activate' }, 'operational/operation')
    expect(result.valid).toBe(true)
  })

  it('rejects an Operation missing action', () => {
    const result = validator.validate({ target: 'Loan' }, 'operational/operation')
    expect(result.valid).toBe(false)
  })

  it('validates an Operation with `changes`', () => {
    const result = validator.validate(
      { target: 'Loan', action: 'Approve', name: 'Loan.Approve', changes: [{ attribute: 'status', set: 'approved' }] },
      'operational/operation',
    )
    expect(result.valid).toBe(true)
  })
})

describe('DnaValidator — operational/task', () => {
  it('validates a valid Task', () => {
    const result = validator.validate({
      name: 'close-loan',
      actor: 'ClosingSpecialist',
      operation: 'Loan.Close',
      description: 'Closing specialist closes an approved loan.'
    }, 'operational/task')
    expect(result.valid).toBe(true)
  })

  it('rejects a Task missing required operation', () => {
    const result = validator.validate({ name: 'close-loan', actor: 'ClosingSpecialist' }, 'operational/task')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'operation')).toBe(true)
  })
})

describe('DnaValidator — operational/process', () => {
  it('validates a valid Process', () => {
    const result = validator.validate({
      name: 'LoanOrigination',
      operator: 'LendingManager',
      startStep: 'intake',
      steps: [
        { id: 'intake', task: 'intake-loan' },
        { id: 'underwrite', task: 'underwrite-loan', depends_on: ['intake'] },
        { id: 'close', task: 'close-loan', depends_on: ['underwrite'], conditions: ['LoanIsApproved'], else: 'abort' }
      ]
    }, 'operational/process')
    expect(result.valid).toBe(true)
  })

  it('rejects a Process with no steps', () => {
    const result = validator.validate({
      name: 'EmptyProcess',
      operator: 'Manager',
      startStep: 'x',
      steps: []
    }, 'operational/process')
    expect(result.valid).toBe(false)
  })

  it('rejects a Process missing required operator', () => {
    const result = validator.validate({
      name: 'NoOperator',
      startStep: 'step-one',
      steps: [{ id: 'step-one', task: 'some-task' }]
    }, 'operational/process')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'operator')).toBe(true)
  })

  it('rejects a Process missing required startStep', () => {
    const result = validator.validate({
      name: 'NoStart',
      operator: 'Manager',
      steps: [{ id: 'step-one', task: 'some-task' }]
    }, 'operational/process')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'startStep')).toBe(true)
  })
})

describe('DnaValidator — operational/trigger', () => {
  it('validates a Trigger targeting an Operation with user source', () => {
    const result = validator.validate({
      operation: 'Loan.Apply',
      source: 'user'
    }, 'operational/trigger')
    expect(result.valid).toBe(true)
  })

  it('validates a Trigger targeting a Process with webhook source', () => {
    const result = validator.validate({
      process: 'LoanOrigination',
      source: 'webhook',
      event: 'crm.lead.qualified'
    }, 'operational/trigger')
    expect(result.valid).toBe(true)
  })

  it('rejects a Trigger missing both operation and process', () => {
    const result = validator.validate({ source: 'user' }, 'operational/trigger')
    expect(result.valid).toBe(false)
  })

  it('rejects a Trigger with both operation and process', () => {
    const result = validator.validate({
      operation: 'Loan.Apply',
      process: 'LoanOrigination',
      source: 'user'
    }, 'operational/trigger')
    expect(result.valid).toBe(false)
  })

  it('rejects a Trigger with the retired signal source', () => {
    const result = validator.validate({
      operation: 'PaymentSchedule.Create',
      source: 'signal'
    }, 'operational/trigger')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — product/core/resource', () => {
  it('validates a valid Resource document', () => {
    const result = validator.validate({
      name: 'Loan',
      resource: 'Loan',
      description: 'A financial loan.',
      fields: [
        { name: 'amount', type: 'number', label: 'Amount', required: true },
        { name: 'status', type: 'enum', label: 'Status', values: ['pending', 'active'] }
      ],
      actions: [{ name: 'Apply', action: 'Apply' }]
    }, 'product/core/resource')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a Resource missing required name', () => {
    const result = validator.validate({ resource: 'Loan' }, 'product/core/resource')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'name')).toBe(true)
  })

  it('rejects a Field with enum type but no values', () => {
    const result = validator.validate({
      name: 'Loan',
      fields: [{ name: 'status', type: 'enum' }]
    }, 'product/core/resource')
    expect(result.valid).toBe(false)
  })

  it('validates a Resource with an object Field carrying nested fields', () => {
    const result = validator.validate({
      name: 'Conversion',
      fields: [
        {
          name: 'from',
          label: 'From',
          type: 'object',
          required: true,
          fields: [
            { name: 'format', type: 'enum', values: ['text', 'json', 'dna'], required: true },
            { name: 'input', type: 'string', required: true },
          ],
        },
      ],
    }, 'product/core/resource')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates deeply-nested object Fields (recursion)', () => {
    const result = validator.validate({
      name: 'Wrapper',
      fields: [
        {
          name: 'outer',
          type: 'object',
          fields: [
            {
              name: 'inner',
              type: 'object',
              fields: [
                { name: 'leaf', type: 'string' },
              ],
            },
          ],
        },
      ],
    }, 'product/core/resource')
    expect(result.valid).toBe(true)
  })

  it('rejects an object Field missing fields[]', () => {
    const result = validator.validate({
      name: 'Conversion',
      fields: [{ name: 'from', type: 'object' }],
    }, 'product/core/resource')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'fields')).toBe(true)
  })

  it('rejects an object Field with empty fields[] (minItems: 1)', () => {
    const result = validator.validate({
      name: 'Conversion',
      fields: [{ name: 'from', type: 'object', fields: [] }],
    }, 'product/core/resource')
    expect(result.valid).toBe(false)
  })

  it('rejects an object Field carrying values[] (enum/object mutual exclusion)', () => {
    const result = validator.validate({
      name: 'Conversion',
      fields: [
        {
          name: 'from',
          type: 'object',
          values: ['a', 'b'],
          fields: [{ name: 'format', type: 'string' }],
        },
      ],
    }, 'product/core/resource')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — product/core/operation', () => {
  it('validates a valid Operation', () => {
    const result = validator.validate({
      resource: 'Loan',
      action: 'Approve',
      name: 'Loan.Approve'
    }, 'product/core/operation')
    expect(result.valid).toBe(true)
  })

  it('rejects an Operation missing action', () => {
    const result = validator.validate({ resource: 'Loan' }, 'product/core/operation')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'action')).toBe(true)
  })
})

describe('DnaValidator — product/core/user', () => {
  it('validates a minimal User (name only)', () => {
    const result = validator.validate({ name: 'Member' }, 'product/core/user')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates a User with identity and projected fields', () => {
    const result = validator.validate({
      name: 'Member',
      person: 'Customer',
      identity: { identifier: 'email', verified: true },
      fields: [{ name: 'email', type: 'email' }],
    }, 'product/core/user')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a User missing required name', () => {
    const result = validator.validate({ person: 'Customer' }, 'product/core/user')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'name')).toBe(true)
  })

  it('rejects a User identity missing identifier', () => {
    const result = validator.validate({ name: 'Member', identity: { verified: true } }, 'product/core/user')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'identifier')).toBe(true)
  })
})

describe('DnaValidator — product/core/role', () => {
  it('validates a minimal Role (name only)', () => {
    const result = validator.validate({ name: 'Underwriter' }, 'product/core/role')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates a Role with scope and permissions', () => {
    const result = validator.validate({
      name: 'Underwriter',
      role: 'Underwriter',
      scope: 'BankDepartment',
      permissions: ['Loan.Approve'],
    }, 'product/core/role')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a Role missing required name', () => {
    const result = validator.validate({ role: 'Underwriter' }, 'product/core/role')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'name')).toBe(true)
  })
})

describe('DnaValidator — shared stability marker', () => {
  it('accepts stability on a Product Core primitive', () => {
    const result = validator.validate({ name: 'Loan', stability: 'beta' }, 'product/core/resource')
    expect(result.valid).toBe(true)
  })

  it('accepts stability on a Technical primitive', () => {
    const result = validator.validate(
      { name: 'api', dna: 'product/api', adapter: { type: 'nestjs', version: '10' }, stability: 'beta' },
      'technical/cell',
    )
    expect(result.valid).toBe(true)
  })

  it('rejects an invalid stability value on a Product Core primitive', () => {
    const result = validator.validate({ name: 'Loan', stability: 'ga' }, 'product/core/resource')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.schemaPath?.includes('stability'))).toBe(true)
  })

  it('rejects an invalid stability value on a Technical primitive', () => {
    const result = validator.validate(
      { name: 'api', dna: 'product/api', adapter: { type: 'nestjs', version: '10' }, stability: 'ga' },
      'technical/cell',
    )
    expect(result.valid).toBe(false)
  })

  it('declares experimental as the default stability of the Field primitive', () => {
    const field = schemas.product.core.field as { properties: { stability: { default?: string } } }
    expect(field.properties.stability.default).toBe('experimental')
  })
})

describe('DnaValidator — product/api/endpoint', () => {
  it('validates a valid Endpoint', () => {
    const result = validator.validate({
      method: 'POST',
      path: '/loans/:id/approve',
      operation: 'Loan.Approve',
      params: [{ name: 'loan_id', in: 'path', type: 'string', required: true }]
    }, 'product/api/endpoint')
    expect(result.valid).toBe(true)
  })

  it('rejects an Endpoint missing path', () => {
    const result = validator.validate({ method: 'GET', operation: 'Loan.View' }, 'product/api/endpoint')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'path')).toBe(true)
  })
})

describe('DnaValidator — product/web/page', () => {
  it('validates a valid Page', () => {
    const result = validator.validate({
      name: 'LoanDetail',
      resource: 'Loan',
      blocks: [{ name: 'LoanHeader', type: 'detail', operation: 'Loan.View' }]
    }, 'product/web/page')
    expect(result.valid).toBe(true)
  })
})

describe('DnaValidator — technical/construct', () => {
  it('validates a valid Construct', () => {
    const result = validator.validate({
      name: 'primary-db',
      category: 'storage',
      type: 'database',
      provider: 'aws',
      config: { engine: 'postgres', version: '15' }
    }, 'technical/construct')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a Construct missing type', () => {
    const result = validator.validate({ name: 'primary-db', category: 'storage' }, 'technical/construct')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'type')).toBe(true)
  })
})

describe('DnaValidator — technical/cell', () => {
  it('validates a valid Cell', () => {
    const result = validator.validate({
      name: 'api',
      dna: 'product/api',
      adapter: { type: 'nestjs', version: '10' },
      constructs: ['primary-db', 'auth-provider']
    }, 'technical/cell')
    expect(result.valid).toBe(true)
  })

  it('rejects a Cell missing adapter', () => {
    const result = validator.validate({ name: 'api', dna: 'product/api' }, 'technical/cell')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'adapter')).toBe(true)
  })

  it('validates a Cell with variables and outputs', () => {
    const result = validator.validate({
      name: 'db',
      dna: 'operational/loan',
      adapter: { type: 'postgres', version: '15' },
      constructs: ['primary-db'],
      variables: [{ name: 'DATABASE_URL', source: 'secret', value: 'arn:aws:secretsmanager:us-east-1:123:secret:db-url' }],
      outputs: [{ name: 'db.connection_string', cell: 'db', value: 'primary-db.connection_string' }]
    }, 'technical/cell')
    expect(result.valid).toBe(true)
  })
})

describe('DnaValidator — technical/environment', () => {
  it('validates a valid Environment', () => {
    const result = validator.validate({
      name: 'prod',
      description: 'Live production environment.',
      providers: [{ name: 'aws', type: 'cloud', region: 'us-east-1' }]
    }, 'technical/environment')
    expect(result.valid).toBe(true)
  })

  it('rejects an Environment with an invalid name', () => {
    const result = validator.validate({ name: 'local' }, 'technical/environment')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — operational/relationship', () => {
  it('validates a valid Relationship', () => {
    const result = validator.validate({
      name: 'Loan.borrower',
      from: 'Loan',
      to: 'Borrower',
      cardinality: 'many-to-one',
      attribute: 'borrower_id',
      description: 'Each loan belongs to one borrower.',
      inverse: 'loans'
    }, 'operational/relationship')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a Relationship missing required fields', () => {
    const result = validator.validate({ name: 'Loan.borrower' }, 'operational/relationship')
    expect(result.valid).toBe(false)
  })

  it('rejects a Relationship with invalid cardinality', () => {
    const result = validator.validate({
      name: 'Loan.borrower',
      from: 'Loan',
      to: 'Borrower',
      cardinality: 'some-to-some',
      attribute: 'borrower_id'
    }, 'operational/relationship')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — composite: operational', () => {
  it('validates the inline operational fixture', () => {
    const result = validator.validate(stampOperationalBase(operationalFixture), 'operational')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects an operational document missing domain', () => {
    const result = validator.validate({ operations: [] }, 'operational')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'domain')).toBe(true)
  })
})

describe('DnaValidator — operational schemas reject undeclared properties', () => {
  // These tests prove that `additionalProperties: false` is enforced on every
  // Operational primitive schema and the top-level layer schema. They give
  // teeth to the rejection scenarios in operational-event-model/spec.md
  // (signals[]/outcomes[]/equations[] on the layer, initiates on Operation,
  // condition on Trigger, emits on Process, etc.).

  const minimalOp = { target: 'Loan', action: 'Apply' }
  const minimalTrigger = { operation: 'Loan.Apply', source: 'user' }
  const minimalProcess = {
    name: 'P', operator: 'Op', startStep: 'a',
    steps: [{ id: 'a', task: 't' }],
  }
  const minimalRule = { operation: 'Loan.Apply' }
  const minimalTask = { name: 't', actor: 'A', operation: 'Loan.Apply' }
  const minimalAttribute = { name: 'amount', type: 'number' }
  const minimalRelationship = {
    name: 'Loan.borrower', from: 'Loan', to: 'Borrower',
    cardinality: 'many-to-one', attribute: 'borrower_id',
  }

  function expectAdditionalPropertiesError(result: { valid: boolean; errors: any[] }, prop: string) {
    expect(result.valid).toBe(false)
    const offending = result.errors.find(
      e =>
        (e.keyword === 'additionalProperties' && e.params?.additionalProperty === prop) ||
        (e.keyword === 'unevaluatedProperties' && e.params?.unevaluatedProperty === prop),
    )
    expect(offending).toBeDefined()
  }

  it('top-level Operational doc rejects an unknown collection (e.g. widgets[])', () => {
    const doc = {
      domain: { name: 'd', path: 'd' },
      widgets: [],
    }
    expectAdditionalPropertiesError(validator.validate(doc, 'operational'), 'widgets')
  })

  it('Operation rejects `initiates` field', () => {
    const op = { ...minimalOp, initiates: ['Loan.Disburse'] }
    expectAdditionalPropertiesError(validator.validate(op, 'operational/operation'), 'initiates')
  })

  it('Trigger rejects `condition` field', () => {
    const trigger = { ...minimalTrigger, condition: { attribute: 'x', eq: 'y' } }
    expectAdditionalPropertiesError(validator.validate(trigger, 'operational/trigger'), 'condition')
  })

  it('Process rejects `emits` field', () => {
    const process = { ...minimalProcess, emits: ['SomeSignal'] }
    expectAdditionalPropertiesError(validator.validate(process, 'operational/process'), 'emits')
  })

  it('Rule rejects an unknown field', () => {
    const rule = { ...minimalRule, bogus: true }
    expectAdditionalPropertiesError(validator.validate(rule, 'operational/rule'), 'bogus')
  })

  it('Task rejects an unknown field', () => {
    const task = { ...minimalTask, bogus: true }
    expectAdditionalPropertiesError(validator.validate(task, 'operational/task'), 'bogus')
  })

  it('Attribute rejects an unknown field', () => {
    const attribute = { ...minimalAttribute, bogus: true }
    expectAdditionalPropertiesError(validator.validate(attribute, 'operational/attribute'), 'bogus')
  })

  it('Relationship rejects an unknown field', () => {
    const relationship = { ...minimalRelationship, bogus: true }
    expectAdditionalPropertiesError(validator.validate(relationship, 'operational/relationship'), 'bogus')
  })
})

describe('DnaValidator — composite: product/core', () => {
  it('validates a minimal product core document', () => {
    // Product Core reuses `operational/resource` for its resources[] items,
    // so the base contract applies. Stamp before validating.
    const doc = stampOperationalBase({
      domain: { name: 'lending', path: 'acme.finance.lending' },
      resources: [
        {
          name: 'Loan',
          attributes: [
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'enum', values: ['pending', 'active'] }
          ],
          actions: [{ name: 'Apply' }, { name: 'Approve' }]
        }
      ],
      operations: [
        { resource: 'Loan', action: 'Apply', name: 'Loan.Apply' },
        { resource: 'Loan', action: 'Approve', name: 'Loan.Approve' }
      ]
    })
    const result = validator.validate(doc, 'product/core')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validates a product core document with users[] and roles[]', () => {
    // resources[] uses operational/resource (needs the base contract); users[]/roles[]
    // are Product Core primitives that do NOT, so they are spread in after stamping.
    const doc = {
      ...stampOperationalBase({
        domain: { name: 'lending', path: 'acme.finance.lending' },
        resources: [{ name: 'Loan', actions: [{ name: 'Apply' }] }],
      }),
      users: [
        { name: 'Member', person: 'Customer', identity: { identifier: 'email', verified: true } },
      ],
      roles: [
        { name: 'Underwriter', role: 'Underwriter', scope: 'BankDepartment', permissions: ['Loan.Approve'] },
      ],
    }
    const result = validator.validate(doc, 'product/core')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a product core document missing domain', () => {
    const result = validator.validate({ resources: [] }, 'product/core')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'domain')).toBe(true)
  })

  it('rejects a product core document missing resources', () => {
    const result = validator.validate({
      domain: { name: 'lending', path: 'acme.finance.lending' }
    }, 'product/core')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'resources')).toBe(true)
  })

  it('rejects unknown top-level properties', () => {
    const result = validator.validate({
      domain: { name: 'lending', path: 'acme.finance.lending' },
      resources: [],
      bogus: true
    }, 'product/core')
    expect(result.valid).toBe(false)
  })
})

describe('DnaValidator — composite: product/api', () => {
  it('validates the inline product/api fixture', () => {
    const result = validator.validate(productApiFixture, 'product/api')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a product/api document missing endpoints', () => {
    const result = validator.validate({
      namespace: { name: 'Lending', path: '/lending' }
    }, 'product/api')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'endpoints')).toBe(true)
  })
})

describe('DnaValidator — composite: product/ui', () => {
  it('validates the inline product/ui fixture', () => {
    const result = validator.validate(productUiFixture, 'product/ui')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a product/ui document missing routes', () => {
    const result = validator.validate({
      layout: { name: 'AppLayout', type: 'sidebar' },
      pages: [{ name: 'LoanList', resource: 'Loan' }]
    }, 'product/ui')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'routes')).toBe(true)
  })
})

describe('DnaValidator — composite: technical', () => {
  it('validates the inline technical fixture', () => {
    const result = validator.validate(technicalFixture, 'technical')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a technical document missing cells', () => {
    const result = validator.validate({ providers: [] }, 'technical')
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.params?.missingProperty === 'cells')).toBe(true)
  })
})

describe('DnaValidator — availableSchemas', () => {
  it('lists all registered schemas', () => {
    const schemas = validator.availableSchemas()
    expect(schemas).toContain('operational/resource')
    expect(schemas).toContain('operational/person')
    expect(schemas).toContain('operational/role')
    expect(schemas).toContain('operational/group')
    expect(schemas).toContain('operational/membership')
    expect(schemas).toContain('operational/action')
    expect(schemas).toContain('operational/operation')
    expect(schemas).toContain('operational/attribute')
    expect(schemas).toContain('operational/domain')
    expect(schemas).toContain('operational/trigger')
    expect(schemas).toContain('operational/rule')
    expect(schemas).toContain('operational/task')
    expect(schemas).toContain('operational/process')
    expect(schemas).toContain('operational/relationship')
    expect(schemas).toContain('product/core/resource')
    expect(schemas).toContain('product/core/action')
    expect(schemas).toContain('product/core/operation')
    expect(schemas).toContain('product/core/field')
    expect(schemas).toContain('product/core/user')
    expect(schemas).toContain('product/core/role')
    expect(schemas).toContain('meta/stability')
    expect(schemas).toContain('product/api/endpoint')
    expect(schemas).toContain('product/api/namespace')
    expect(schemas).toContain('product/api/param')
    expect(schemas).toContain('product/api/schema')
    expect(schemas).toContain('product/web/page')
    expect(schemas).toContain('product/web/block')
    expect(schemas).toContain('product/web/layout')
    expect(schemas).toContain('product/web/route')
    expect(schemas).toContain('technical/construct')
    expect(schemas).toContain('technical/provider')
    expect(schemas).toContain('technical/variable')
    expect(schemas).toContain('technical/output')
    expect(schemas).toContain('technical/environment')
    expect(schemas).toContain('technical/cell')
    expect(schemas).toContain('operational')
    expect(schemas).toContain('product/api')
    expect(schemas).toContain('product/ui')
    expect(schemas).toContain('technical')
  })

  it('no longer registers retired primitives (capability, cause, user, signal, equation)', () => {
    const schemas = validator.availableSchemas()
    expect(schemas).not.toContain('operational/capability')
    expect(schemas).not.toContain('operational/cause')
    expect(schemas).not.toContain('operational/user')
    expect(schemas).not.toContain('operational/signal')
    expect(schemas).not.toContain('operational/equation')
  })
})

// ── Cross-layer validation ─────────────────────────────────────────────────

describe('DnaValidator — cross-layer validation', () => {
  const operational = operationalFixture
  const productApi = productApiFixture
  const productUi = productUiFixture
  const technical = technicalFixture

  it('passes for valid lending DNA', () => {
    const result = validator.validateCrossLayer({ operational, productApi, productUi, technical })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('detects invalid resource cross-layer reference', () => {
    const badApi = {
      ...productApi,
      resources: [{ name: 'Widget', resource: 'NonExistentResource', fields: [], actions: [] }],
    }
    const result = validator.validateCrossLayer({ operational, productApi: badApi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('NonExistentResource'))).toBe(true)
    expect(result.errors.some(e => e.layer === 'product/api')).toBe(true)
  })

  it('detects invalid action cross-layer reference', () => {
    const badApi = {
      ...productApi,
      resources: [
        { name: 'Loan', resource: 'Loan', fields: [], actions: [{ name: 'Fly', action: 'Fly' }] },
      ],
    }
    const result = validator.validateCrossLayer({ operational, productApi: badApi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Action "Fly"'))).toBe(true)
  })

  it('detects API operation not present in operational', () => {
    const badApi = {
      ...productApi,
      operations: [
        { resource: 'Loan', action: 'Warp', name: 'Loan.Warp' },
      ],
    }
    const result = validator.validateCrossLayer({ operational, productApi: badApi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Loan.Warp'))).toBe(true)
  })

  it('detects invalid endpoint operation reference', () => {
    const badApi = {
      ...productApi,
      endpoints: [{ method: 'GET', path: '/x', operation: 'Loan.Teleport' }],
    }
    const result = validator.validateCrossLayer({ operational, productApi: badApi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Operation "Loan.Teleport"'))).toBe(true)
  })

  it('detects invalid page resource reference', () => {
    const badUi = {
      ...productUi,
      pages: [{ name: 'WidgetPage', resource: 'Widget', blocks: [] }],
    }
    const result = validator.validateCrossLayer({ operational, productApi, productUi: badUi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Resource "Widget"'))).toBe(true)
    expect(result.errors.some(e => e.layer === 'product/ui')).toBe(true)
  })

  it('detects invalid block operation reference', () => {
    const badUi = {
      ...productUi,
      pages: [
        {
          name: 'LoanPage',
          resource: 'Loan',
          blocks: [{ name: 'BadBlock', operation: 'Loan.Levitate' }],
        },
      ],
    }
    const result = validator.validateCrossLayer({ operational, productApi, productUi: badUi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Operation "Loan.Levitate"'))).toBe(true)
  })

  it('detects invalid route page reference', () => {
    const badUi = {
      pages: (productUi as any).pages,
      routes: [{ path: '/nowhere', page: 'GhostPage' }],
    }
    const result = validator.validateCrossLayer({ operational, productApi, productUi: badUi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Page "GhostPage"'))).toBe(true)
  })

  it('detects invalid construct provider reference', () => {
    const badTech = {
      ...technical,
      constructs: [{ name: 'bad-db', type: 'database', category: 'storage', provider: 'gcp' }],
    }
    const result = validator.validateCrossLayer({ operational, technical: badTech })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Provider "gcp"'))).toBe(true)
    expect(result.errors.some(e => e.layer === 'technical')).toBe(true)
  })

  it('detects invalid cell construct reference', () => {
    const badTech = {
      ...technical,
      cells: [
        { name: 'test-cell', dna: 'lending/product.api', adapter: { type: 'node/express' }, constructs: ['phantom-db'] },
      ],
    }
    const result = validator.validateCrossLayer({ operational, technical: badTech })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Construct "phantom-db"'))).toBe(true)
  })

  it('works with partial layers (only operational + productApi)', () => {
    const result = validator.validateCrossLayer({ operational, productApi })
    expect(result.valid).toBe(true)
  })

  it('works with only technical layer', () => {
    const result = validator.validateCrossLayer({ technical })
    expect(result.valid).toBe(true)
  })

  it('detects invalid Trigger process reference', () => {
    const badOp = {
      ...operational,
      triggers: [
        ...operational.triggers,
        { process: 'GhostProcess', source: 'webhook', event: 'x' }
      ]
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Process "GhostProcess"'))).toBe(true)
  })

  it('detects invalid Relationship from reference', () => {
    const badOp = {
      ...operational,
      relationships: [
        { name: 'Ghost.borrower', from: 'Ghost', to: 'Borrower', cardinality: 'many-to-one', attribute: 'borrower_id' }
      ]
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('"Ghost"') && e.message.includes('(from)'))).toBe(true)
  })

  it('detects invalid Relationship to reference', () => {
    const badOp = {
      ...operational,
      relationships: [
        { name: 'Loan.phantom', from: 'Loan', to: 'Phantom', cardinality: 'many-to-one', attribute: 'borrower_id' }
      ]
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('"Phantom"') && e.message.includes('(to)'))).toBe(true)
  })

  it('detects invalid Relationship attribute reference', () => {
    const badOp = {
      ...operational,
      relationships: [
        { name: 'Loan.borrower', from: 'Loan', to: 'Borrower', cardinality: 'many-to-one', attribute: 'ghost_id' }
      ]
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Attribute "ghost_id"'))).toBe(true)
  })

  it('detects invalid Operation target reference', () => {
    const badOp = {
      ...operational,
      operations: [
        ...operational.operations,
        { target: 'PhantomNoun', action: 'Vanish', name: 'PhantomNoun.Vanish' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomNoun'))).toBe(true)
  })

  it('accepts Operation.changes with a known attribute on the target Resource', () => {
    const okOp = {
      ...operational,
      operations: [
        { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
        { target: 'Loan', action: 'Approve', name: 'Loan.Approve', changes: [{ attribute: 'status', set: 'approved' }] },
        { target: 'Loan', action: 'View', name: 'Loan.View' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: okOp })
    expect(result.valid).toBe(true)
  })

  it('rejects Operation.changes pointing at an unknown attribute on the target', () => {
    const badOp = {
      ...operational,
      operations: [
        { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
        { target: 'Loan', action: 'Approve', name: 'Loan.Approve', changes: [{ attribute: 'nonexistentField', set: 'x' }] },
        { target: 'Loan', action: 'View', name: 'Loan.View' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e =>
      e.path === 'operations/Loan.Approve/changes/0/attribute' &&
      e.message.includes('"nonexistentField"'),
    )).toBe(true)
  })

  it('accepts Operation.changes using the legacy qualified `<resource>.<attribute>` form without enforcement', () => {
    const okOp = {
      ...operational,
      operations: [
        { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
        { target: 'Loan', action: 'Approve', name: 'Loan.Approve', changes: [{ attribute: 'loan.whatever_no_check', set: 'x' }] },
        { target: 'Loan', action: 'View', name: 'Loan.View' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: okOp })
    expect(result.valid).toBe(true)
  })

  it('operational schema does not declare an `outcomes[]` collection', () => {
    const opSchema = (validator as any).validators.get('operational').schema
    expect(opSchema.properties.outcomes).toBeUndefined()
  })

  it('operational schema does not register an Outcome primitive', () => {
    const schemaIds = validator.availableSchemas()
    expect(schemaIds).not.toContain('operational/outcome')
  })

  it('Operation schema does not declare an `initiates` field', () => {
    const opSchema = (validator as any).validators.get('operational/operation').schema
    expect(opSchema.properties.initiates).toBeUndefined()
  })

  it('Trigger schema does not declare a `condition` field', () => {
    const triggerSchema = (validator as any).validators.get('operational/trigger').schema
    expect(triggerSchema.properties.condition).toBeUndefined()
  })

  it('detects Operation.action not declared in target.actions[]', () => {
    const badOp = {
      ...operational,
      operations: [
        ...operational.operations,
        { target: 'Loan', action: 'Levitate', name: 'Loan.Levitate' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Levitate'))).toBe(true)
  })

  it('accepts an Operation targeting a Process (executable lifecycle)', () => {
    const goodOp = {
      ...operational,
      tasks: [{ name: 'kick-off', actor: 'Underwriter', operation: 'Loan.Apply' }],
      processes: [{
        name: 'LoanOrigination',
        operator: 'Underwriter',
        startStep: 'kick',
        steps: [{ id: 'kick', task: 'kick-off' }],
      }],
      operations: [
        ...operational.operations,
        { target: 'LoanOrigination', action: 'Start', name: 'LoanOrigination.Start' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects an Operation targeting an unknown Process and lists Process among targetable kinds', () => {
    const badOp = {
      ...operational,
      operations: [
        ...operational.operations,
        { target: 'GhostFlow', action: 'Start', name: 'GhostFlow.Start' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const targetErr = result.errors.find(e => e.path === 'operations/GhostFlow.Start/target')
    expect(targetErr).toBeDefined()
    expect(targetErr!.message).toContain('GhostFlow')
    expect(targetErr!.message).toContain('Process')
    expect(targetErr!.message).toContain('Resource')
  })

  it('detects invalid Task actor reference (Role missing)', () => {
    const badOp = {
      ...operational,
      tasks: [{ name: 'phantom-task', actor: 'PhantomActor', operation: 'Loan.Apply' }],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomActor'))).toBe(true)
  })

  it('detects Role.scope referencing a missing Group', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [...operational.domain.roles, { name: 'GhostRole', scope: 'PhantomGroup' }],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomGroup'))).toBe(true)
  })

  it('detects Role.parent referencing a missing Role', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'JuniorUnderwriter', parent: 'PhantomParent', scope: 'BankDepartment' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomParent'))).toBe(true)
  })

  it('detects Role.resource referencing a missing Resource', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [...operational.domain.roles, { name: 'Sweep', system: true, resource: 'PhantomJob' }],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomJob'))).toBe(true)
  })

  it('accepts Person.resource referencing a declared Resource', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        persons: [
          ...operational.domain.persons,
          { name: 'LoanHolder', resource: 'Loan' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('detects Person.resource referencing a missing Resource', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        persons: [
          ...operational.domain.persons,
          { name: 'Customer', resource: 'PhantomResource' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const resourceErr = result.errors.find(e => e.path === 'persons/Customer/resource')
    expect(resourceErr).toBeDefined()
    expect(resourceErr!.message).toContain('PhantomResource')
  })

  it('detects Membership referencing a missing Person/Role/Group', () => {
    const badOp = {
      ...operational,
      memberships: [
        ...operational.memberships,
        { name: 'BadMembership', person: 'GhostPerson', role: 'GhostRole', group: 'GhostGroup' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('GhostPerson'))).toBe(true)
    expect(result.errors.some(e => e.message.includes('GhostRole'))).toBe(true)
    expect(result.errors.some(e => e.message.includes('GhostGroup'))).toBe(true)
  })

  it('detects Membership.group not matching Role.scope', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [...operational.domain.groups, { name: 'Family' }],
      },
      memberships: [
        ...operational.memberships,
        { name: 'BadFit', person: 'Employee', role: 'Underwriter', group: 'Family' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('declares scope'))).toBe(true)
  })

  it('detects multi-scope Role Membership without group disambiguation', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [
          ...operational.domain.groups,
          { name: 'Workspace' },
          { name: 'Tenant' },
        ],
        roles: [
          ...operational.domain.roles,
          { name: 'SuperAdmin', scope: ['Workspace', 'Tenant'] },
        ],
      },
      memberships: [
        ...operational.memberships,
        { name: 'AmbiguousAdmin', person: 'Employee', role: 'SuperAdmin' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('multi-scope'))).toBe(true)
  })

  it('detects invalid Rule operation reference', () => {
    const badOp = {
      ...operational,
      rules: [
        { operation: 'Loan.Vanish', type: 'access', allow: [{ role: 'Underwriter' }] },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Loan.Vanish'))).toBe(true)
  })

  it('detects invalid Rule role reference (Role missing)', () => {
    const badOp = {
      ...operational,
      rules: [
        { operation: 'Loan.Approve', rule_type: 'access', allow: [{ role: 'PhantomRole' }] },
      ],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('PhantomRole'))).toBe(true)
  })

  it('detects Process.startStep not referencing a defined Step', () => {
    const badOp = {
      ...operational,
      tasks: [{ name: 'do-thing', actor: 'Underwriter', operation: 'Loan.Approve' }],
      processes: [{
        name: 'BadProc',
        operator: 'LendingManager',
        startStep: 'ghost-step',
        steps: [{ id: 'real-step', task: 'do-thing' }],
      }],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('startStep "ghost-step"'))).toBe(true)
  })

  it('detects Step.else referencing an unknown sibling', () => {
    const badOp = {
      ...operational,
      tasks: [{ name: 'do-thing', actor: 'Underwriter', operation: 'Loan.Approve' }],
      processes: [{
        name: 'BadProc',
        operator: 'LendingManager',
        startStep: 'real-step',
        steps: [{ id: 'real-step', task: 'do-thing', else: 'phantom-step' }],
      }],
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('phantom-step'))).toBe(true)
  })

  // ── Role hierarchy ─────────────────────────────────────────────────────────

  it('inherits scope from parent Role through a multi-step chain', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'SeniorUnderwriter', parent: 'Underwriter' },
          { name: 'PrincipalUnderwriter', parent: 'SeniorUnderwriter' },
        ],
        // Membership against the inherited-scope child must be valid
      },
      memberships: [
        ...operational.memberships,
        { name: 'EmployeePrincipal', person: 'Employee', role: 'PrincipalUnderwriter', group: 'BankDepartment' },
      ],
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('detects a 2-Role cycle in Role.parent', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'RoleA', parent: 'RoleB' },
          { name: 'RoleB', parent: 'RoleA' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const cycleErrs = result.errors.filter(e => e.message.includes('cycle'))
    expect(cycleErrs).toHaveLength(1)
    expect(cycleErrs[0].message).toContain('"RoleA"')
    expect(cycleErrs[0].message).toContain('"RoleB"')
  })

  it('detects a 3-Role cycle in Role.parent and lists members in walk order', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'A', parent: 'B' },
          { name: 'B', parent: 'C' },
          { name: 'C', parent: 'A' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const cycleErrs = result.errors.filter(e => e.message.includes('cycle'))
    expect(cycleErrs).toHaveLength(1)
    expect(cycleErrs[0].message).toMatch(/"A".*"B".*"C"|"B".*"C".*"A"|"C".*"A".*"B"/)
  })

  it('rejects child Role scope that is unrelated to parent scope', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [...operational.domain.groups, { name: 'Tenant' }],
        roles: [
          ...operational.domain.roles,
          { name: 'TenantAdmin', parent: 'Underwriter', scope: 'Tenant' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const subsetErr = result.errors.find(e => e.path === 'roles/TenantAdmin/scope' && e.message.includes('narrower-or-equal'))
    expect(subsetErr).toBeDefined()
    expect(subsetErr!.message).toContain('"Tenant"')
    expect(subsetErr!.message).toContain('"BankDepartment"')
  })

  it('rejects child Role array scope that is wider than parent', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [
          ...operational.domain.groups,
          { name: 'Workspace' },
          { name: 'Tenant' },
          { name: 'Region' },
        ],
        roles: [
          ...operational.domain.roles,
          { name: 'Parent', scope: ['Workspace', 'Tenant'] },
          { name: 'Child', parent: 'Parent', scope: ['Workspace', 'Tenant', 'Region'] },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const subsetErrs = result.errors.filter(e => e.path === 'roles/Child/scope' && e.message.includes('narrower-or-equal'))
    expect(subsetErrs).toHaveLength(1)
    expect(subsetErrs[0].message).toContain('"Region"')
  })

  it('accepts child Group scope that is a sub-Group of parent Group via Group.parent', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [
          ...operational.domain.groups,
          { name: 'RetailBranch', parent: 'BankDepartment' },
        ],
        roles: [
          ...operational.domain.roles,
          { name: 'BranchUnderwriter', parent: 'Underwriter', scope: 'RetailBranch' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects Person scope under a Group-scoped parent with a clear message', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'PerBorrowerHandler', parent: 'Underwriter', scope: 'Borrower' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const subsetErr = result.errors.find(e => e.path === 'roles/PerBorrowerHandler/scope' && e.message.includes('narrower-or-equal'))
    expect(subsetErr).toBeDefined()
    expect(subsetErr!.message).toContain('Person scope')
  })

  it('suppresses subset error on Roles inside a cycle', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [...operational.domain.groups, { name: 'Tenant' }],
        roles: [
          ...operational.domain.roles,
          { name: 'CycA', parent: 'CycB', scope: 'Tenant' },
          { name: 'CycB', parent: 'CycA', scope: 'BankDepartment' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('cycle'))).toBe(true)
    expect(result.errors.some(e => e.message.includes('narrower-or-equal'))).toBe(false)
  })

  // ── Role cardinality / required / excludes ────────────────────────────────

  it('accepts cardinality "one" on a scoped Role', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'ChiefUnderwriter', scope: 'BankDepartment', cardinality: 'one' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts cardinality "one" on a Role inheriting scope through parent', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'SeniorUnderwriter', parent: 'Underwriter', cardinality: 'one' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts required + cardinality "one" on a scoped Role', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'HeadUnderwriter', scope: 'BankDepartment', cardinality: 'one', required: true },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts same-scope excludes between two Roles (and one-sided declaration is enough)', () => {
    const goodOp = {
      ...operational,
      domain: {
        ...operational.domain,
        persons: [...operational.domain.persons, { name: 'Doctor' }],
        groups: [...operational.domain.groups, { name: 'Patient' }],
        roles: [
          ...operational.domain.roles,
          { name: 'AttendingPhysician', scope: 'Patient', excludes: ['ConsultingSpecialist'] },
          { name: 'ConsultingSpecialist', scope: 'Patient' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: goodOp })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects cardinality "one" on a global Role', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'GlobalAdmin', cardinality: 'one' },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const err = result.errors.find(e => e.path === 'roles/GlobalAdmin/cardinality')
    expect(err).toBeDefined()
    expect(err!.message).toContain('declared or inherited scope')
  })

  it('rejects required: true on a global Role', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'GlobalAuditor', required: true },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const err = result.errors.find(e => e.path === 'roles/GlobalAuditor/required')
    expect(err).toBeDefined()
    expect(err!.message).toContain('declared or inherited scope')
  })

  it('rejects cardinality, required, and excludes on a system Role (one error per field)', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          {
            name: 'NightlySweep',
            system: true,
            cardinality: 'one',
            required: true,
            excludes: ['Underwriter'],
          },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    expect(result.errors.find(e => e.path === 'roles/NightlySweep/cardinality')).toBeDefined()
    expect(result.errors.find(e => e.path === 'roles/NightlySweep/required')).toBeDefined()
    expect(result.errors.find(e => e.path === 'roles/NightlySweep/excludes')).toBeDefined()
  })

  it('rejects excludes referencing an unknown Role and lists available Roles', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'Foo', scope: 'BankDepartment', excludes: ['NotARole'] },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const err = result.errors.find(e => e.path === 'roles/Foo/excludes')
    expect(err).toBeDefined()
    expect(err!.message).toContain('"NotARole"')
    expect(err!.message).toContain('Underwriter')
  })

  it('rejects self-exclusion', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        roles: [
          ...operational.domain.roles,
          { name: 'SelfRef', scope: 'BankDepartment', excludes: ['SelfRef'] },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const err = result.errors.find(e => e.path === 'roles/SelfRef/excludes')
    expect(err).toBeDefined()
    expect(err!.message).toContain('cannot exclude itself')
  })

  it('rejects cross-scope excludes with one error naming both scopes', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [...operational.domain.groups, { name: 'Tenant' }],
        roles: [
          ...operational.domain.roles,
          { name: 'TenantAdmin', scope: 'Tenant', excludes: ['Underwriter'] },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const errs = result.errors.filter(e => e.message.includes('exclusion requires a shared scope'))
    expect(errs).toHaveLength(1)
    expect(errs[0].message).toContain('"Tenant"')
    expect(errs[0].message).toContain('"BankDepartment"')
    // Path is keyed off the lexicographically-smaller name (TenantAdmin > Underwriter).
    expect(errs[0].path).toBe('roles/TenantAdmin/excludes')
  })

  it('emits exactly one error when both sides declare a cross-scope exclusion (symmetric dedup)', () => {
    const badOp = {
      ...operational,
      domain: {
        ...operational.domain,
        groups: [...operational.domain.groups, { name: 'Tenant' }],
        roles: [
          ...operational.domain.roles,
          { name: 'TenantAdmin', scope: 'Tenant', excludes: ['DeptAdmin'] },
          { name: 'DeptAdmin', scope: 'BankDepartment', excludes: ['TenantAdmin'] },
        ],
      },
    }
    const result = validator.validateCrossLayer({ operational: badOp })
    expect(result.valid).toBe(false)
    const pairErrs = result.errors.filter(e => e.message.includes('exclusion requires a shared scope'))
    expect(pairErrs).toHaveLength(1)
  })
})

// ── Cross-layer: product.core ────────────────────────────────────────────────

describe('DnaValidator — cross-layer with product.core', () => {
  const operational = operationalFixture
  const productApi = productApiFixture
  const productCore = productCoreFixture

  it('passes when core is consistent with operational', () => {
    const result = validator.validateCrossLayer({ operational, productCore })
    expect(result.valid).toBe(true)
  })

  it('detects a Resource in product.core that is not in operational', () => {
    const badCore = {
      ...productCore,
      resources: [...(productCore.resources ?? []), { name: 'Phantom', attributes: [], actions: [] }],
    }
    const result = validator.validateCrossLayer({ operational, productCore: badCore })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.layer === 'product/core' && e.message.includes('Phantom'))).toBe(true)
  })

  it('detects an Operation in product.core that is not in operational', () => {
    const badCore = {
      ...productCore,
      operations: [
        ...(productCore.operations ?? []),
        { resource: 'Loan', action: 'Vanish', name: 'Loan.Vanish' },
      ],
    }
    const result = validator.validateCrossLayer({ operational, productCore: badCore })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Loan.Vanish'))).toBe(true)
  })

  it('resolves product.api resource refs against product.core when present', () => {
    const result = validator.validateCrossLayer({ productCore, productApi })
    expect(result.valid).toBe(true)
  })

  it('detects product.api references against product.core (not operational)', () => {
    const minimalCore = {
      domain: { name: 'lending', path: 'acme.finance.lending' },
      resources: [{ name: 'Loan', actions: [{ name: 'Apply' }] }],
    }
    const badApi = {
      ...productApi,
      resources: [{ name: 'Borrower', resource: 'Borrower', fields: [], actions: [] }],
    }
    const result = validator.validateCrossLayer({ productCore: minimalCore, productApi: badApi })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Borrower') && e.message.includes('Product Core'))).toBe(true)
  })

  it('falls back to operational when product.core is absent', () => {
    const result = validator.validateCrossLayer({ operational, productApi, productUi: productUiFixture })
    expect(result.valid).toBe(true)
  })
})
