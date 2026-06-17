import type { OperationalDNA } from '../types/merge';
import type { PrimitiveInput, Position } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Position template to the DNA's `domain.positions`. Same-name composes via
 * merge rules.
 */
export declare function addPosition(dna: OperationalDNA, position: PrimitiveInput<Position>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=position.d.ts.map