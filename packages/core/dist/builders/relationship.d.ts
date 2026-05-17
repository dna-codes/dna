import type { OperationalDNA } from '../types/merge';
import type { PrimitiveInput, Relationship } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Relationship to the DNA's top-level `relationships`. Identity is by
 * `name`. Used by `input-json`'s walker to emit relationship records
 * without rolling its own dedup.
 */
export declare function addRelationship(dna: OperationalDNA, relationship: PrimitiveInput<Relationship>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=relationship.d.ts.map