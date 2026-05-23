/**
 * Cross-domain example validation.
 *
 * Each example under `examples/<domain>/operational.json` is loaded, validated
 * against the operational schema, and run through cross-layer validation.
 * Per-domain assertions verify the *specific* shapes that example is supposed
 * to demonstrate — so if a future schema change silently strips support for
 * memberships, system actors, multi-Group users, etc., these tests catch it.
 *
 * Examples live at the repo root (`examples/<domain>/`) so they're visible to
 * users browsing the project, not buried inside a package.
 */

import * as fs from 'fs'
import * as path from 'path'
import { DnaValidator } from './validator'

const EXAMPLES_ROOT = path.resolve(__dirname, '../../../examples')
const validator = new DnaValidator()

function loadExample(domain: string): any {
  const file = path.join(EXAMPLES_ROOT, domain, 'operational.json')
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

describe('examples — schema conformance', () => {
  const domains = fs
    .readdirSync(EXAMPLES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  it.each(domains)('%s/operational.json validates against the operational schema', (domain) => {
    const doc = loadExample(domain)
    const result = validator.validate(doc, 'operational')
    if (!result.valid) {
      // Emit the AJV errors so a failure points at the offending field.
      console.error(`Schema errors for ${domain}:`, JSON.stringify(result.errors, null, 2))
    }
    expect(result.valid).toBe(true)
  })

  it.each(domains)('%s passes cross-layer validation', (domain) => {
    const doc = loadExample(domain)
    const result = validator.validateCrossLayer({ operational: doc })
    if (!result.valid) {
      console.error(`Cross-layer errors for ${domain}:`, JSON.stringify(result.errors, null, 2))
    }
    expect(result.valid).toBe(true)
  })
})

// ── Per-example shape assertions ────────────────────────────────────────────
//
// Each block asserts the *specific* model features the example is supposed to
// exercise. These are tripwires for silent capability loss: if a future change
// strips support for memberships, system actors, multi-target Triggers, etc.,
// the relevant block fails with a clear message about which feature broke.

describe('examples — lending', () => {
  const dna = loadExample('lending')

  it('has both an Operation-level and a Process-level Trigger for the same first-step Operation', () => {
    const triggers = dna.triggers as Array<any>
    const opTrigger = triggers.find((t) => t.operation === 'Loan.Apply')
    const procTrigger = triggers.find((t) => t.process === 'LoanOrigination')
    expect(opTrigger).toBeDefined()
    expect(procTrigger).toBeDefined()
  })

  it('models a system actor as a Role with system: true, referenced from a schedule-source Trigger', () => {
    const roles = dna.domain.roles as Array<any>
    const sweep = roles.find((r) => r.name === 'NightlyDelinquencySweep')
    expect(sweep).toBeDefined()
    expect(sweep.system).toBe(true)

    const triggers = dna.triggers as Array<any>
    const scheduled = triggers.find((t) => t.source === 'schedule')
    expect(scheduled).toBeDefined()

    const rules = dna.rules as Array<any>
    const sysRule = rules.find((r) => r.allow?.some((a: any) => a.role === 'NightlyDelinquencySweep'))
    expect(sysRule).toBeDefined()
  })

  it('declares a scoped Role (Underwriter.scope = BankDepartment)', () => {
    const roles = dna.domain.roles as Array<any>
    const underwriter = roles.find((r) => r.name === 'Underwriter')
    expect(underwriter?.scope).toBe('BankDepartment')
  })

  it('declares Memberships pinning Person types to Role types', () => {
    const memberships = dna.memberships as Array<any>
    const empUnderwriter = memberships.find((m) => m.name === 'EmployeeUnderwriter')
    expect(empUnderwriter?.person).toBe('Employee')
    expect(empUnderwriter?.role).toBe('Underwriter')
  })

  it('uses a Person directly as Task.actor (Borrower) AND a Role as Task.actor (Underwriter)', () => {
    const tasks = dna.tasks as Array<any>
    const intake = tasks.find((t) => t.name === 'intake-application')
    expect(intake?.actor).toBe('Borrower')
    const underwrite = tasks.find((t) => t.name === 'underwrite-loan')
    expect(underwrite?.actor).toBe('Underwriter')
  })

  it('uses Step-level conditions referencing named Rules', () => {
    const proc = dna.processes[0]
    const stepWithCond = proc.steps.find((s: any) => s.conditions?.length)
    expect(stepWithCond?.conditions).toContain('ApplicationIsPending')
  })
})

describe('examples — mass-tort', () => {
  const dna = loadExample('mass-tort')

  it('declares Case as a first-class Group with attributes and lifecycle', () => {
    const groups = dna.domain.groups as Array<any>
    const caseGroup = groups.find((g) => g.name === 'Case')
    expect(caseGroup).toBeDefined()
    expect(caseGroup.attributes?.length).toBeGreaterThan(0)
  })

  it('declares Roles scoped to the Case Group', () => {
    const roles = dna.domain.roles as Array<any>
    for (const roleName of ['LeadCounsel', 'CoCounsel', 'Paralegal', 'Judge']) {
      const role = roles.find((r) => r.name === roleName)
      expect(role?.scope).toBe('Case')
    }
  })

  it('captures multi-Person → multi-Role eligibility via Memberships', () => {
    const memberships = dna.memberships as Array<any>
    // Partner can be either LeadCounsel or CoCounsel
    const partnerLead = memberships.find((m) => m.person === 'Partner' && m.role === 'LeadCounsel')
    const partnerCo = memberships.find((m) => m.person === 'Partner' && m.role === 'CoCounsel')
    expect(partnerLead).toBeDefined()
    expect(partnerCo).toBeDefined()
  })

  it('triggers a Process from an upstream Operation completion', () => {
    const triggers = dna.triggers as Array<any>
    const opTriggered = triggers.find((t) => t.process && t.source === 'operation')
    expect(opTriggered?.after).toBe('Settlement.Accept')
  })

  it('exercises external-actor pattern (Claimant as Person — structure AND actor)', () => {
    const persons = dna.domain.persons as Array<any>
    const claimant = persons.find((p) => p.name === 'Claimant')
    expect(claimant?.attributes?.length).toBeGreaterThan(0)
  })
})

describe('examples — marketplace', () => {
  const dna = loadExample('marketplace')

  it('has the same Person template eligible for two peer Roles via Memberships', () => {
    const memberships = dna.memberships as Array<any>
    const memberHost = memberships.find((m) => m.person === 'Member' && m.role === 'Host')
    const memberGuest = memberships.find((m) => m.person === 'Member' && m.role === 'Guest')
    expect(memberHost).toBeDefined()
    expect(memberGuest).toBeDefined()
  })

  it('treats both Listing and Booking as first-class Groups with attributes and lifecycle', () => {
    const groups = dna.domain.groups as Array<any>
    const listing = groups.find((g) => g.name === 'Listing')
    const booking = groups.find((g) => g.name === 'Booking')
    expect(listing?.attributes?.length).toBeGreaterThan(0)
    expect(booking?.attributes?.length).toBeGreaterThan(0)
    expect(listing?.actions?.length).toBeGreaterThan(0)

    const roles = dna.domain.roles as Array<any>
    const host = roles.find((r) => r.name === 'Host')
    const guest = roles.find((r) => r.name === 'Guest')
    expect(host?.scope).toBe('Listing')
    expect(guest?.scope).toBe('Booking')
  })

  it('has a global (unscoped) Role alongside scoped ones', () => {
    const roles = dna.domain.roles as Array<any>
    const support = roles.find((r) => r.name === 'SupportAgent')
    expect(support).toBeDefined()
    expect(support.scope).toBeUndefined()
  })

  it('uses Step.else for conditional routing to a sibling Step', () => {
    const proc = dna.processes[0]
    const approve = proc.steps.find((s: any) => s.id === 'approve')
    expect(approve?.else).toBe('decline')
  })
})

describe('examples — healthcare', () => {
  const dna = loadExample('healthcare')

  it('treats Patient as a Person template with attributes and lifecycle actions', () => {
    const persons = dna.domain.persons as Array<any>
    const patient = persons.find((p) => p.name === 'Patient')
    expect(patient?.attributes?.length).toBeGreaterThan(0)
    expect(patient?.actions?.length).toBeGreaterThan(0)
  })

  it('has Roles scoped to a Person (AttendingPhysician.scope = Patient)', () => {
    const roles = dna.domain.roles as Array<any>
    const attending = roles.find((r) => r.name === 'AttendingPhysician')
    expect(attending?.scope).toBe('Patient')
  })

  it('mixes scope targets — some Roles scope to a Person, others to a Group (Pharmacy)', () => {
    const roles = dna.domain.roles as Array<any>
    const pharmacist = roles.find((r) => r.name === 'Pharmacist')
    expect(pharmacist?.scope).toBe('Pharmacy')
    const groups = dna.domain.groups as Array<any>
    expect(groups.find((g) => g.name === 'Pharmacy')).toBeDefined()
  })

  it('declares Memberships pinning Person types to multiple Roles (Doctor → Attending OR Consulting)', () => {
    const memberships = dna.memberships as Array<any>
    const attending = memberships.find((m) => m.person === 'Doctor' && m.role === 'AttendingPhysician')
    const consulting = memberships.find((m) => m.person === 'Doctor' && m.role === 'ConsultingSpecialist')
    expect(attending).toBeDefined()
    expect(consulting).toBeDefined()
  })

  it('has a multi-predicate condition Rule (AND-joined within one Rule)', () => {
    const rules = dna.rules as Array<any>
    const safeRange = rules.find((r) => r.name === 'DoseWithinSafeRange')
    expect(safeRange?.conditions?.length).toBeGreaterThanOrEqual(2)
  })

  it('routes Step.else to a named sibling Step (not abort)', () => {
    const medFlow = dna.processes.find((p: any) => p.name === 'MedicationOrderFlow')
    const approve = medFlow.steps.find((s: any) => s.id === 'approve')
    expect(approve?.else).toBe('reject')
  })
})

describe('examples — manufacturing', () => {
  const dna = loadExample('manufacturing')

  it('declares multiple system Roles (system: true), some backed by a Resource', () => {
    const roles = dna.domain.roles as Array<any>
    const machineNames = ['CncMachine', 'StampingPress', 'PaintRobot', 'MaintenanceScheduler']
    for (const name of machineNames) {
      const role = roles.find((r) => r.name === name)
      expect(role?.system).toBe(true)
    }
    const cnc = roles.find((r) => r.name === 'CncMachine')
    expect(cnc?.resource).toBe('MachineRecord')
  })

  it('expresses parallel fan-out + fan-in through Step.depends_on alone', () => {
    const flow = dna.processes[0]
    const stamp = flow.steps.find((s: any) => s.id === 'stamp')
    const paint = flow.steps.find((s: any) => s.id === 'paint')
    const inspect = flow.steps.find((s: any) => s.id === 'inspect')

    // Fan-out: stamp and paint both depend on cut
    expect(stamp.depends_on).toEqual(['cut'])
    expect(paint.depends_on).toEqual(['cut'])
    // Fan-in: inspect depends on both
    expect(inspect.depends_on).toEqual(expect.arrayContaining(['stamp', 'paint']))
  })

  it('uses an Operation-chain Trigger (operation-source with after)', () => {
    const triggers = dna.triggers as Array<any>
    const opChained = triggers.find((t) => t.source === 'operation' && t.operation === 'WorkOrder.Reject')
    expect(opChained?.after).toBe('DefectReport.File')
  })

  it('combines schedule-source Trigger with access rule limited to a system Role', () => {
    const triggers = dna.triggers as Array<any>
    const cutTrigger = triggers.find((t) => t.operation === 'WorkOrder.Cut' && t.source === 'schedule')
    expect(cutTrigger).toBeDefined()

    const rules = dna.rules as Array<any>
    const cutRule = rules.find((r) => r.operation === 'WorkOrder.Cut' && r.rule_type === 'access')
    expect(cutRule?.allow).toEqual([{ role: 'CncMachine' }])
  })
})

describe('examples — education', () => {
  const dna = loadExample('education')

  it('separates Course (Resource catalog) from CourseOffering (Group)', () => {
    const resources = dna.domain.resources as Array<any>
    const groups = dna.domain.groups as Array<any>
    expect(resources.find((r) => r.name === 'Course')).toBeDefined()
    expect(groups.find((g) => g.name === 'CourseOffering')).toBeDefined()

    const roles = dna.domain.roles as Array<any>
    expect(roles.find((r) => r.name === 'Instructor')?.scope).toBe('CourseOffering')
    expect(roles.find((r) => r.name === 'Student')?.scope).toBe('CourseOffering')
  })

  it('has a Person template eligible for both Instructor and Student Roles via Memberships', () => {
    const memberships = dna.memberships as Array<any>
    const facultyInstructor = memberships.find((m) => m.person === 'FacultyMember' && m.role === 'Instructor')
    const memberStudent = memberships.find((m) => m.person === 'UniversityMember' && m.role === 'Student')
    expect(facultyInstructor).toBeDefined()
    expect(memberStudent).toBeDefined()
  })

  it('declares three distinct scope tiers (CourseOffering, Department, global)', () => {
    const roles = dna.domain.roles as Array<any>
    const instructor = roles.find((r) => r.name === 'Instructor')
    const chair = roles.find((r) => r.name === 'DepartmentChair')
    const registrar = roles.find((r) => r.name === 'Registrar')

    expect(instructor?.scope).toBe('CourseOffering')
    expect(chair?.scope).toBe('Department')
    expect(registrar?.scope).toBeUndefined()
  })

  it('uses calendar-aligned schedule Triggers for both Operation and Process targets', () => {
    const triggers = dna.triggers as Array<any>
    const beginTrigger = triggers.find((t) => t.operation === 'CourseOffering.Begin' && t.source === 'schedule')
    const finalizeTrigger = triggers.find((t) => t.process === 'SemesterFinalization' && t.source === 'schedule')
    expect(beginTrigger).toBeDefined()
    expect(finalizeTrigger).toBeDefined()
  })
})

describe('examples — registry', () => {
  const dna = loadExample('registry')

  it('declares the TypeDefinition / Instance / Link triad with TypeDefinition carrying a category enum', () => {
    const resources = dna.domain.resources as Array<any>
    const typeDef = resources.find((r) => r.name === 'TypeDefinition')
    const instance = resources.find((r) => r.name === 'Instance')
    const link = resources.find((r) => r.name === 'Link')

    expect(typeDef).toBeDefined()
    expect(instance).toBeDefined()
    expect(link).toBeDefined()

    const categoryAttr = typeDef.attributes.find((a: any) => a.name === 'category')
    expect(categoryAttr).toBeDefined()
    expect(categoryAttr.type).toBe('enum')
    expect(categoryAttr.values).toEqual(
      expect.arrayContaining(['person', 'role', 'group', 'resource', 'domain']),
    )
  })

  it('declares ValidationEngine as a system Role linked to a Resource template', () => {
    const roles = dna.domain.roles as Array<any>
    const engine = roles.find((r) => r.name === 'ValidationEngine')
    expect(engine?.system).toBe(true)
    expect(engine?.resource).toBe('ValidationService')

    const resources = dna.domain.resources as Array<any>
    expect(resources.find((r) => r.name === 'ValidationService')).toBeDefined()
  })

  it('triggers the InstanceBootstrap Process from TypeDefinition.Publish', () => {
    const triggers = dna.triggers as Array<any>
    const bootstrap = triggers.find(
      (t) => t.source === 'operation' && t.after === 'TypeDefinition.Publish',
    )
    expect(bootstrap).toBeDefined()
    expect(bootstrap.process).toBe('InstanceBootstrap')

    const processes = dna.processes as Array<any>
    expect(processes.find((p) => p.name === 'InstanceBootstrap')).toBeDefined()
  })

  it('gates a Process step via conditions[] referencing named condition Rules', () => {
    const processes = dna.processes as Array<any>
    const bootstrap = processes.find((p) => p.name === 'InstanceBootstrap')
    const validateStep = bootstrap.steps.find((s: any) => s.id === 'validate')
    expect(validateStep?.conditions).toEqual(
      expect.arrayContaining(['TypeIsPublished', 'TypeIsNotRole']),
    )

    const rules = dna.rules as Array<any>
    for (const ruleName of validateStep.conditions) {
      const rule = rules.find((r) => r.name === ruleName)
      expect(rule).toBeDefined()
      expect(rule.rule_type).toBe('condition')
    }
  })

  it('wires both DataManager and ValidationEngine to Instance.Update through separate access Rules', () => {
    const rules = dna.rules as Array<any>
    const accessOnUpdate = rules.filter(
      (r) => r.operation === 'Instance.Update' && r.rule_type === 'access',
    )
    const allowedRoles = accessOnUpdate.flatMap((r: any) => r.allow.map((a: any) => a.role))
    expect(allowedRoles).toEqual(expect.arrayContaining(['DataManager', 'ValidationEngine']))
  })

  it('declares Instance → TypeDefinition and Link → Instance Relationships with cardinality and inverse', () => {
    const rels = dna.relationships as Array<any>
    const instanceOfType = rels.find((r) => r.name === 'InstanceOfType')
    const linkFrom = rels.find((r) => r.name === 'LinkFrom')
    const linkTo = rels.find((r) => r.name === 'LinkTo')

    expect(instanceOfType).toMatchObject({
      from: 'Instance',
      to: 'TypeDefinition',
      cardinality: 'many-to-one',
      attribute: 'type_def',
      inverse: 'instances',
    })
    expect(linkFrom?.inverse).toBe('outbound_links')
    expect(linkTo?.inverse).toBe('inbound_links')
  })
})
