import type { OperationalDNA } from '../types/merge'
import type { Position } from '../types/operational'

function list(dna: OperationalDNA): Position[] {
  return (dna.positions ?? []) as Position[]
}

export function getPositions(dna: OperationalDNA): Position[] {
  return list(dna)
}

export function getPosition(dna: OperationalDNA, name: string): Position | null {
  return list(dna).find(r => r.name === name) ?? null
}
