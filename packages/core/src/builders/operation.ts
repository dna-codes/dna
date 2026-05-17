import type { OperationalDNA } from '../types/merge'
import type { Operation, PrimitiveInput } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add an Operation to the DNA's top-level `operations`. Identity is by
 * `name` if provided, otherwise derived from `Target.Action`.
 */
export function addOperation(
  dna: OperationalDNA,
  operation: PrimitiveInput<Operation>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, operation, 'operations', 'operational/operation', opts)
}
