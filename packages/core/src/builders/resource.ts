import type { OperationalDNA } from '../types/merge'
import type { PrimitiveInput, Resource } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Resource to the DNA's `domain.resources`.
 *
 * If a Resource with the same `name` already exists in the DNA, the new
 * Resource is composed into the existing one using the `merge()` rules:
 * list-shaped children union by name; scalar disagreements emit `Conflict`
 * entries via the v1 recommendation policy. Returns the new DNA plus any
 * conflicts produced.
 */
export function addResource(
  dna: OperationalDNA,
  resource: PrimitiveInput<Resource>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, resource, 'resources', 'operational/resource', opts)
}
