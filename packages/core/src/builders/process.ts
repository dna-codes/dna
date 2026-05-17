import type { OperationalDNA } from '../types/merge'
import type { PrimitiveInput, Process } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Process to the DNA's top-level `processes`. Same-name composes via
 * merge rules; `steps[]` union by `id`.
 */
export function addProcess(
  dna: OperationalDNA,
  process: PrimitiveInput<Process>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, process, 'processes', 'operational/process', opts)
}
