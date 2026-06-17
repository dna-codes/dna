import type { OperationalDNA } from '../types/merge'
import type { Person, Position, Rule, RuleAllowEntry } from '../types/operational'

function rules(dna: OperationalDNA): Rule[] {
  return (dna.rules ?? []) as Rule[]
}

function positions(dna: OperationalDNA): Position[] {
  return (dna.positions ?? []) as Position[]
}

function persons(dna: OperationalDNA): Person[] {
  return (dna.persons ?? []) as Person[]
}

export function getActorsForOperation(dna: OperationalDNA, opName: string): Array<Position | Person> {
  const accessRules = rules(dna).filter(r => r.operation === opName && r.rule_type === 'access')
  const allPositions = positions(dna)
  const allPersons = persons(dna)
  const result: Array<Position | Person> = []
  const seen = new Set<string>()

  for (const rule of accessRules) {
    for (const entry of (rule.allow ?? []) as RuleAllowEntry[]) {
      const actorName = entry.role
      if (!actorName || seen.has(actorName)) continue
      const position = allPositions.find(r => r.name === actorName)
      if (position) { seen.add(actorName); result.push(position); continue }
      const person = allPersons.find(p => p.name === actorName)
      if (person) { seen.add(actorName); result.push(person) }
    }
  }

  return result
}
