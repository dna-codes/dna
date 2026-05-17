import type { OperationalDNA } from '../types/merge';
import type { Membership, PrimitiveInput } from '../types/operational';
import { type BuilderOptions, type BuilderResult } from './shared';
/**
 * Add a Membership to the DNA's top-level `memberships`. Same-name composes
 * via merge rules.
 */
export declare function addMembership(dna: OperationalDNA, membership: PrimitiveInput<Membership>, opts?: BuilderOptions): BuilderResult;
//# sourceMappingURL=membership.d.ts.map