import type { OperationalDNA } from '../types/merge'
import type { PrimitiveInput, Role } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Role template to the DNA's `domain.roles`. Same-name composes via
 * merge rules.
 */
export function addRole(
  dna: OperationalDNA,
  role: PrimitiveInput<Role>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, role, 'roles', 'operational/role', opts)
}
