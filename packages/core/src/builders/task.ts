import type { OperationalDNA } from '../types/merge'
import type { PrimitiveInput, Task } from '../types/operational'
import { composeInto, type BuilderOptions, type BuilderResult } from './shared'

/**
 * Add a Task to the DNA's top-level `tasks`. Same-name composes via merge
 * rules.
 */
export function addTask(
  dna: OperationalDNA,
  task: PrimitiveInput<Task>,
  opts?: BuilderOptions,
): BuilderResult {
  return composeInto(dna, task, 'tasks', 'operational/task', opts)
}
