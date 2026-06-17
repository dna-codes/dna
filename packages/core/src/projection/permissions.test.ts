import { projectPermissions, permissionKey } from './permissions'

const accessRule = (position: string) => ({
  rule_type: 'access' as const,
  allow: [{ role: position }],
})

describe('projectPermissions — derive-first', () => {
  it('derives a Permission + grants from a Membership whose Position an access Rule empowers', () => {
    const out = projectPermissions({
      positions: [{ name: 'Approver', scope: 'PandT' }],
      memberships: [{ name: 'KyleApprover', person: 'Kyle', position: 'Approver', group: 'PandT' }],
      rules: [accessRule('Approver')],
    })
    expect(out.permissions).toHaveLength(1)
    expect(out.permissions[0]).toMatchObject({
      key: permissionKey('Kyle', 'Approver', 'PandT'),
      principal: 'Kyle',
      role: 'Approver',
      scope: 'PandT',
      planned: false,
      backingMembership: 'KyleApprover',
    })
    expect(out.grants).toEqual([{ from: 'KyleApprover', to: permissionKey('Kyle', 'Approver', 'PandT'), via: 'grants' }])
  })

  it('resolves scope from a single-scope Position when the Membership omits the group', () => {
    const out = projectPermissions({
      positions: [{ name: 'Underwriter', scope: 'BankDepartment' }],
      memberships: [{ name: 'EmpUW', person: 'Employee', position: 'Underwriter' }],
      rules: [accessRule('Underwriter')],
    })
    expect(out.permissions[0].scope).toBe('BankDepartment')
    expect(out.permissions[0].planned).toBe(false)
    expect(out.grants).toHaveLength(1)
  })

  it('uses the global scope marker for a Position with no scope', () => {
    const out = projectPermissions({
      positions: [{ name: 'SuperAdmin' }],
      memberships: [{ name: 'EmpAdmin', person: 'Employee', position: 'SuperAdmin' }],
      rules: [accessRule('SuperAdmin')],
    })
    expect(out.permissions[0].scope).toBe('*')
    expect(out.grants).toHaveLength(1)
  })
})

describe('projectPermissions — guards', () => {
  it('emits no Permission when no access Rule empowers the Position', () => {
    const out = projectPermissions({
      positions: [{ name: 'Approver', scope: 'PandT' }],
      memberships: [{ name: 'KyleApprover', person: 'Kyle', position: 'Approver', group: 'PandT' }],
      rules: [],
    })
    expect(out.permissions).toHaveLength(0)
    expect(out.grants).toHaveLength(0)
  })

  it('marks a multi-scope Position with no disambiguating group as planned, with no grant', () => {
    const out = projectPermissions({
      positions: [{ name: 'SuperAdmin', scope: ['Workspace', 'Tenant'] }],
      memberships: [{ name: 'EmpAdmin', person: 'Employee', position: 'SuperAdmin' }],
      rules: [accessRule('SuperAdmin')],
    })
    expect(out.permissions).toHaveLength(1)
    expect(out.permissions[0].planned).toBe(true)
    expect(out.permissions[0].scope).toBe('')
    expect(out.grants).toHaveLength(0)
  })

  it('disambiguates a multi-scope Position when the Membership names a group', () => {
    const out = projectPermissions({
      positions: [{ name: 'SuperAdmin', scope: ['Workspace', 'Tenant'] }],
      memberships: [{ name: 'EmpAdmin', person: 'Employee', position: 'SuperAdmin', group: 'Workspace' }],
      rules: [accessRule('SuperAdmin')],
    })
    expect(out.permissions[0]).toMatchObject({ scope: 'Workspace', planned: false })
    expect(out.grants).toHaveLength(1)
  })
})

describe('projectPermissions — identity', () => {
  it('collapses two Memberships of the same {principal, role, scope} into one Permission, each granting it', () => {
    const out = projectPermissions({
      positions: [{ name: 'Underwriter', scope: 'BankDepartment' }],
      memberships: [
        { name: 'EmpUW1', person: 'Employee', position: 'Underwriter', group: 'BankDepartment' },
        { name: 'EmpUW2', person: 'Employee', position: 'Underwriter', group: 'BankDepartment' },
      ],
      rules: [accessRule('Underwriter')],
    })
    expect(out.permissions).toHaveLength(1)
    expect(out.grants.map((g) => g.from).sort()).toEqual(['EmpUW1', 'EmpUW2'])
    expect(out.grants.every((g) => g.to === out.permissions[0].key)).toBe(true)
  })
})
