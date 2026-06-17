import type { OperationalDNA } from '../types/merge'
import type { Group } from '../types/operational'

function list(dna: OperationalDNA): Group[] {
  return (dna.groups ?? []) as Group[]
}

export function getGroups(dna: OperationalDNA): Group[] {
  return list(dna)
}

export function getGroup(dna: OperationalDNA, name: string): Group | null {
  return list(dna).find(g => g.name === name) ?? null
}
