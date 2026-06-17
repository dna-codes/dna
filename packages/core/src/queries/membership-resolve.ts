import type { OperationalDNA } from '../types/merge'
import type { Membership } from '../types/operational'

function list(dna: OperationalDNA): Membership[] {
  return (dna.memberships ?? []) as Membership[]
}

export function getMembershipsForPosition(dna: OperationalDNA, positionName: string): Membership[] {
  return list(dna).filter(m => m.position === positionName)
}

export function getMembershipsForPerson(dna: OperationalDNA, personName: string): Membership[] {
  return list(dna).filter(m => m.person === personName)
}
