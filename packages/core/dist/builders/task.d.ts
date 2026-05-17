import type { OperationalDNA } from '../types/merge';
import type { PrimitiveInput, Task } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Task to the DNA's top-level `tasks`. Same-name composes via merge
 * rules.
 */
export declare function addTask(dna: OperationalDNA, task: PrimitiveInput<Task>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=task.d.ts.map