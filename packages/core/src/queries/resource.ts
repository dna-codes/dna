import type { OperationalDNA } from '../types/merge'
import type { Resource } from '../types/operational'

function list(dna: OperationalDNA): Resource[] {
  return (dna.resources ?? []) as Resource[]
}

export function getResources(dna: OperationalDNA): Resource[] {
  return list(dna)
}

export function getResource(dna: OperationalDNA, name: string): Resource | null {
  return list(dna).find(r => r.name === name) ?? null
}
