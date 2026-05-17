import type { OperationalDNA } from '../types/merge'
import type { Membership, PrimitiveInput } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Membership to the DNA's top-level `memberships`. Same-name composes
 * via merge rules.
 */
export function addMembership(
  dna: OperationalDNA,
  membership: PrimitiveInput<Membership>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, membership, 'memberships', 'operational/membership', opts)
}
