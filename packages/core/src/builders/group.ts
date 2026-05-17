import type { OperationalDNA } from '../types/merge'
import type { Group, PrimitiveInput } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Group template to the DNA's `domain.groups`. Same-name composes via
 * merge rules.
 */
export function addGroup(
  dna: OperationalDNA,
  group: PrimitiveInput<Group>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, group, 'groups', 'operational/group', opts)
}
