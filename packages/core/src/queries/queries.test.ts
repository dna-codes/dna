import * as fs from 'fs'
import * as path from 'path'
import type { OperationalDNA } from '../types/merge'
import { bookshopInput } from '../fixtures/bookshop'
import {
  getResource, getResources,
  getPerson, getPersons,
  getRole, getRoles,
  getGroup, getGroups,
  getMembership, getMemberships,
  getOperation, getOperations, getOperationsForResource,
  getProcess, getProcesses, getTriggersForProcess,
  getTask, getTasks, getTasksForOperation,
  getTriggers, getTriggersForOperation,
  getRule, getRules, getRulesForOperation,
  getActorsForOperation,
  getMembershipsForRole, getMembershipsForPerson,
} from './index'

const EXAMPLES_ROOT = path.resolve(__dirname, '../../../../examples')

function loadExample(domain: string): OperationalDNA {
  const file = path.join(EXAMPLES_ROOT, domain, 'operational.json')
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as OperationalDNA
}

const bookshop = bookshopInput.operational as unknown as OperationalDNA
const lending = loadExample('lending')
const healthcare = loadExample('healthcare')
const manufacturing = loadExample('manufacturing')

// ── empty DNA baseline ──────────────────────────────────────────────────────

const emptyDna: OperationalDNA = { domain: { name: 'empty' } }

describe('empty DNA — all list getters return []', () => {
  it('getResources', () => expect(getResources(emptyDna)).toEqual([]))
  it('getPersons', () => expect(getPersons(emptyDna)).toEqual([]))
  it('getRoles', () => expect(getRoles(emptyDna)).toEqual([]))
  it('getGroups', () => expect(getGroups(emptyDna)).toEqual([]))
  it('getMemberships', () => expect(getMemberships(emptyDna)).toEqual([]))
  it('getOperations', () => expect(getOperations(emptyDna)).toEqual([]))
  it('getProcesses', () => expect(getProcesses(emptyDna)).toEqual([]))
  it('getTasks', () => expect(getTasks(emptyDna)).toEqual([]))
  it('getTriggers', () => expect(getTriggers(emptyDna)).toEqual([]))
  it('getRules', () => expect(getRules(emptyDna)).toEqual([]))
})

describe('empty DNA — all single getters return null', () => {
  it('getResource', () => expect(getResource(emptyDna, 'X')).toBeNull())
  it('getPerson', () => expect(getPerson(emptyDna, 'X')).toBeNull())
  it('getRole', () => expect(getRole(emptyDna, 'X')).toBeNull())
  it('getGroup', () => expect(getGroup(emptyDna, 'X')).toBeNull())
  it('getMembership', () => expect(getMembership(emptyDna, 'X')).toBeNull())
  it('getOperation', () => expect(getOperation(emptyDna, 'X')).toBeNull())
  it('getProcess', () => expect(getProcess(emptyDna, 'X')).toBeNull())
  it('getTask', () => expect(getTask(emptyDna, 'X')).toBeNull())
  it('getRule', () => expect(getRule(emptyDna, 'X')).toBeNull())
})

describe('empty DNA — cross-ref resolvers return []', () => {
  it('getOperationsForResource', () => expect(getOperationsForResource(emptyDna, 'X')).toEqual([]))
  it('getTriggersForProcess', () => expect(getTriggersForProcess(emptyDna, 'X')).toEqual([]))
  it('getTasksForOperation', () => expect(getTasksForOperation(emptyDna, 'X')).toEqual([]))
  it('getTriggersForOperation', () => expect(getTriggersForOperation(emptyDna, 'X')).toEqual([]))
  it('getRulesForOperation', () => expect(getRulesForOperation(emptyDna, 'X')).toEqual([]))
  it('getActorsForOperation', () => expect(getActorsForOperation(emptyDna, 'X')).toEqual([]))
  it('getMembershipsForRole', () => expect(getMembershipsForRole(emptyDna, 'X')).toEqual([]))
  it('getMembershipsForPerson', () => expect(getMembershipsForPerson(emptyDna, 'X')).toEqual([]))
})

// ── bookshop fixture — per-primitive getters ────────────────────────────────

describe('getResources — bookshop', () => {
  it('returns all resources', () => {
    expect(getResources(bookshop).map(r => r.name)).toEqual(['Book', 'Author'])
  })
  it('found — returns value', () => {
    expect(getResource(bookshop, 'Book')).toMatchObject({ name: 'Book' })
  })
  it('not found — returns null', () => {
    expect(getResource(bookshop, 'Missing')).toBeNull()
  })
})

describe('getPersons — bookshop', () => {
  it('returns all persons', () => {
    expect(getPersons(bookshop).map(p => p.name)).toEqual(['Employee'])
  })
  it('found — returns value', () => {
    expect(getPerson(bookshop, 'Employee')).toMatchObject({ name: 'Employee' })
  })
  it('not found — returns null', () => {
    expect(getPerson(bookshop, 'Missing')).toBeNull()
  })
})

describe('getRoles — bookshop', () => {
  it('returns all roles', () => {
    expect(getRoles(bookshop).map(r => r.name)).toEqual(['Editor'])
  })
  it('found — returns value', () => {
    expect(getRole(bookshop, 'Editor')).toMatchObject({ name: 'Editor', scope: 'Shop' })
  })
  it('not found — returns null', () => {
    expect(getRole(bookshop, 'Missing')).toBeNull()
  })
})

describe('getGroups — bookshop', () => {
  it('returns all groups', () => {
    expect(getGroups(bookshop).map(g => g.name)).toEqual(['Shop'])
  })
  it('found — returns value', () => {
    expect(getGroup(bookshop, 'Shop')).toMatchObject({ name: 'Shop' })
  })
  it('not found — returns null', () => {
    expect(getGroup(bookshop, 'Missing')).toBeNull()
  })
})

describe('getMemberships — bookshop', () => {
  it('returns all memberships', () => {
    expect(getMemberships(bookshop).map(m => m.name)).toEqual(['EmployeeEditor'])
  })
  it('found — returns value', () => {
    expect(getMembership(bookshop, 'EmployeeEditor')).toMatchObject({ person: 'Employee', role: 'Editor' })
  })
  it('not found — returns null', () => {
    expect(getMembership(bookshop, 'Missing')).toBeNull()
  })
})

describe('getOperations — bookshop', () => {
  it('returns all operations', () => {
    const names = getOperations(bookshop).map(o => o.name)
    expect(names).toContain('Book.Publish')
    expect(names).toContain('Book.Retire')
  })
  it('found — returns value', () => {
    expect(getOperation(bookshop, 'Book.Publish')).toMatchObject({ target: 'Book', action: 'Publish' })
  })
  it('not found — returns null', () => {
    expect(getOperation(bookshop, 'Missing')).toBeNull()
  })
})

describe('getProcesses — bookshop', () => {
  it('returns all processes', () => {
    expect(getProcesses(bookshop).map(p => p.name)).toEqual(['PublishFlow'])
  })
  it('found — returns value', () => {
    expect(getProcess(bookshop, 'PublishFlow')).toMatchObject({ name: 'PublishFlow' })
  })
  it('not found — returns null', () => {
    expect(getProcess(bookshop, 'Missing')).toBeNull()
  })
})

describe('getTasks — bookshop', () => {
  it('returns all tasks', () => {
    const names = getTasks(bookshop).map(t => t.name)
    expect(names).toContain('review-book')
    expect(names).toContain('approve-book')
  })
  it('found — returns value', () => {
    expect(getTask(bookshop, 'review-book')).toMatchObject({ actor: 'Editor', operation: 'Book.Publish' })
  })
  it('not found — returns null', () => {
    expect(getTask(bookshop, 'missing')).toBeNull()
  })
})

describe('getTriggers — bookshop', () => {
  it('returns all triggers', () => {
    expect(getTriggers(bookshop).length).toBeGreaterThan(0)
  })
})

describe('getRules — bookshop', () => {
  it('returns all rules', () => {
    expect(getRules(bookshop).length).toBeGreaterThan(0)
  })
  it('found by name — returns value', () => {
    expect(getRule(bookshop, 'BookIsDraft')).toMatchObject({ subtype: 'condition', operation: 'Book.Publish' })
  })
  it('not found — returns null', () => {
    expect(getRule(bookshop, 'Missing')).toBeNull()
  })
})

// ── cross-reference resolvers — canonical domain fixtures ───────────────────

describe('getRulesForOperation — lending', () => {
  it('returns rules for a known operation', () => {
    const rules = getRulesForOperation(lending, 'Loan.Approve')
    expect(rules.length).toBeGreaterThan(0)
    rules.forEach(r => expect(r.operation).toBe('Loan.Approve'))
  })
  it('empty match returns []', () => {
    expect(getRulesForOperation(lending, 'NonExistent.Op')).toEqual([])
  })
})

describe('getTriggersForOperation — bookshop', () => {
  it('returns triggers targeting an operation', () => {
    const triggers = getTriggersForOperation(bookshop, 'Book.Publish')
    expect(triggers.length).toBeGreaterThan(0)
    triggers.forEach(t => expect(t.operation).toBe('Book.Publish'))
  })
  it('empty match returns []', () => {
    expect(getTriggersForOperation(bookshop, 'Missing.Op')).toEqual([])
  })
})

describe('getTriggersForProcess — healthcare', () => {
  it('returns triggers targeting a process', () => {
    const triggers = getTriggersForProcess(healthcare, 'MedicationOrderFlow')
    expect(triggers.length).toBeGreaterThan(0)
    triggers.forEach(t => expect(t.process).toBe('MedicationOrderFlow'))
  })
  it('empty match returns []', () => {
    expect(getTriggersForProcess(healthcare, 'MissingProcess')).toEqual([])
  })
})

describe('getOperationsForResource — lending', () => {
  it('returns operations targeting a resource', () => {
    const ops = getOperationsForResource(lending, 'Loan')
    expect(ops.length).toBeGreaterThan(0)
    ops.forEach(o => expect(o.target).toBe('Loan'))
  })
  it('empty match returns []', () => {
    expect(getOperationsForResource(lending, 'MissingResource')).toEqual([])
  })
})

describe('getTasksForOperation — bookshop', () => {
  it('returns tasks for a known operation', () => {
    const tasks = getTasksForOperation(bookshop, 'Book.Publish')
    expect(tasks.length).toBeGreaterThan(0)
    tasks.forEach(t => expect(t.operation).toBe('Book.Publish'))
  })
  it('empty match returns []', () => {
    expect(getTasksForOperation(bookshop, 'Missing.Op')).toEqual([])
  })
})

describe('getMembershipsForRole — lending', () => {
  it('returns memberships for a role', () => {
    const ms = getMembershipsForRole(lending, 'Underwriter')
    expect(ms.length).toBeGreaterThan(0)
    ms.forEach(m => expect(m.role).toBe('Underwriter'))
  })
  it('empty match returns []', () => {
    expect(getMembershipsForRole(lending, 'MissingRole')).toEqual([])
  })
})

describe('getMembershipsForPerson — lending', () => {
  it('returns memberships for a person', () => {
    const ms = getMembershipsForPerson(lending, 'Employee')
    expect(ms.length).toBeGreaterThan(0)
    ms.forEach(m => expect(m.person).toBe('Employee'))
  })
  it('empty match returns []', () => {
    expect(getMembershipsForPerson(lending, 'MissingPerson')).toEqual([])
  })
})

// ── getActorsForOperation ───────────────────────────────────────────────────

describe('getActorsForOperation — lending', () => {
  it('resolves human Role actors', () => {
    const actors = getActorsForOperation(lending, 'Loan.Approve')
    expect(actors.length).toBeGreaterThan(0)
    const names = actors.map(a => a.name)
    expect(names).toContain('Underwriter')
  })

  it('resolves Person actors when allow.role names a Person', () => {
    const actors = getActorsForOperation(lending, 'Loan.Apply')
    const names = actors.map(a => a.name)
    expect(names).toContain('Borrower')
  })

  it('dangling reference is silently omitted', () => {
    const dnaWithDangling: OperationalDNA = {
      domain: { name: 'test', roles: [], persons: [] },
      rules: [{ operation: 'Thing.Do', subtype: 'access', allow: [{ role: 'GhostRole' }] }],
    }
    expect(getActorsForOperation(dnaWithDangling, 'Thing.Do')).toEqual([])
  })

  it('empty match returns []', () => {
    expect(getActorsForOperation(lending, 'NonExistent.Op')).toEqual([])
  })
})

describe('getActorsForOperation — manufacturing (system Roles)', () => {
  it('includes system Roles when present in access Rules', () => {
    const actors = getActorsForOperation(manufacturing, 'WorkOrder.Cut')
    const names = actors.map(a => a.name)
    expect(names).toContain('CncMachine')
  })

  it('returned system Role has system: true', () => {
    const actors = getActorsForOperation(manufacturing, 'WorkOrder.Cut')
    const cnc = actors.find(a => a.name === 'CncMachine') as any
    expect(cnc?.system).toBe(true)
  })
})

// ── null/undefined semantics ────────────────────────────────────────────────

describe('return type semantics', () => {
  it('single getters return null (not undefined) when not found', () => {
    expect(getResource(emptyDna, 'X')).toBeNull()
    expect(getPerson(emptyDna, 'X')).toBeNull()
    expect(getRole(emptyDna, 'X')).toBeNull()
    expect(getGroup(emptyDna, 'X')).toBeNull()
    expect(getMembership(emptyDna, 'X')).toBeNull()
    expect(getOperation(emptyDna, 'X')).toBeNull()
    expect(getProcess(emptyDna, 'X')).toBeNull()
    expect(getTask(emptyDna, 'X')).toBeNull()
    expect(getRule(emptyDna, 'X')).toBeNull()
  })

  it('list getters return arrays (not null/undefined) when empty', () => {
    expect(Array.isArray(getResources(emptyDna))).toBe(true)
    expect(Array.isArray(getPersons(emptyDna))).toBe(true)
    expect(Array.isArray(getRoles(emptyDna))).toBe(true)
    expect(Array.isArray(getGroups(emptyDna))).toBe(true)
    expect(Array.isArray(getMemberships(emptyDna))).toBe(true)
    expect(Array.isArray(getOperations(emptyDna))).toBe(true)
    expect(Array.isArray(getProcesses(emptyDna))).toBe(true)
    expect(Array.isArray(getTasks(emptyDna))).toBe(true)
    expect(Array.isArray(getTriggers(emptyDna))).toBe(true)
    expect(Array.isArray(getRules(emptyDna))).toBe(true)
  })
})

describe('query getters surface base contract fields', () => {
  // Loaded examples and the bookshop fixture all carry stamped base fields;
  // queries return whatever the underlying primitive holds — verify each
  // getter doesn't strip those fields on the way out.
  it('getResource returns id, type, version, name on a known Resource', () => {
    const loan = getResource(lending, 'Loan') as any
    expect(loan).toBeTruthy()
    expect(typeof loan.id).toBe('string')
    expect(loan.type).toBe('resource')
    expect(typeof loan.version).toBe('string')
    expect(loan.name).toBe('Loan')
  })

  it('getOperation preserves base fields', () => {
    const op = getOperation(lending, 'Loan.Approve') as any
    expect(op).toBeTruthy()
    expect(op.type).toBe('operation')
    expect(typeof op.id).toBe('string')
    expect(typeof op.version).toBe('string')
  })

  it('getTask preserves base fields', () => {
    const tasks = getTasks(lending)
    expect(tasks.length).toBeGreaterThan(0)
    expect(typeof (tasks[0] as any).id).toBe('string')
    expect((tasks[0] as any).type).toBe('task')
  })
})
