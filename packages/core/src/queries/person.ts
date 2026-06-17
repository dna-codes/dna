import type { OperationalDNA } from '../types/merge'
import type { Person } from '../types/operational'

function list(dna: OperationalDNA): Person[] {
  return (dna.persons ?? []) as Person[]
}

export function getPersons(dna: OperationalDNA): Person[] {
  return list(dna)
}

export function getPerson(dna: OperationalDNA, name: string): Person | null {
  return list(dna).find(p => p.name === name) ?? null
}
