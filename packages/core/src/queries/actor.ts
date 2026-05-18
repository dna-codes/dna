import type { OperationalDNA } from '../types/merge'
import type { Person, Role, Rule, RuleAllowEntry } from '../types/operational'

function rules(dna: OperationalDNA): Rule[] {
  return (dna.rules ?? []) as Rule[]
}

function roles(dna: OperationalDNA): Role[] {
  return (dna.domain.roles ?? []) as Role[]
}

function persons(dna: OperationalDNA): Person[] {
  return (dna.domain.persons ?? []) as Person[]
}

export function getActorsForOperation(dna: OperationalDNA, opName: string): Array<Role | Person> {
  const accessRules = rules(dna).filter(r => r.operation === opName && r.rule_type === 'access')
  const allRoles = roles(dna)
  const allPersons = persons(dna)
  const result: Array<Role | Person> = []
  const seen = new Set<string>()

  for (const rule of accessRules) {
    for (const entry of (rule.allow ?? []) as RuleAllowEntry[]) {
      const actorName = entry.role
      if (!actorName || seen.has(actorName)) continue
      const role = allRoles.find(r => r.name === actorName)
      if (role) { seen.add(actorName); result.push(role); continue }
      const person = allPersons.find(p => p.name === actorName)
      if (person) { seen.add(actorName); result.push(person) }
    }
  }

  return result
}
