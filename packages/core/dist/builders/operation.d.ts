import type { OperationalDNA } from '../types/merge';
import type { Operation, PrimitiveInput } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add an Operation to the DNA's top-level `operations`. Identity is by
 * `name` if provided, otherwise derived from `Target.Action`.
 */
export declare function addOperation(dna: OperationalDNA, operation: PrimitiveInput<Operation>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=operation.d.ts.map