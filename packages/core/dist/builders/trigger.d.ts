import type { OperationalDNA } from '../types/merge';
import type { PrimitiveInput, Trigger } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Trigger to the DNA's top-level `triggers`. Triggers have no `name`;
 * identity is derived from `(operation || process)` plus `source` and
 * `after`.
 */
export declare function addTrigger(dna: OperationalDNA, trigger: PrimitiveInput<Trigger>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=trigger.d.ts.map