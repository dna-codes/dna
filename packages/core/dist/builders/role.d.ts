import type { OperationalDNA } from '../types/merge';
import type { PrimitiveInput, Role } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Role template to the DNA's `domain.roles`. Same-name composes via
 * merge rules.
 */
export declare function addRole(dna: OperationalDNA, role: PrimitiveInput<Role>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=role.d.ts.map