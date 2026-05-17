import type { OperationalDNA } from '../types/merge';
import type { Group, PrimitiveInput } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Group template to the DNA's `domain.groups`. Same-name composes via
 * merge rules.
 */
export declare function addGroup(dna: OperationalDNA, group: PrimitiveInput<Group>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=group.d.ts.map