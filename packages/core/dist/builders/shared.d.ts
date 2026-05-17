import type { Conflict, OperationalDNA } from '../types/merge';
import { type OperationalPrimitiveType } from '../version';
/** Generates a UUID v4. Wrapped here so builder tests can stub identity. */
export declare function generateId(): string;
/**
 * Stamp the universal base contract (`id`, `type`, `version`) onto a
 * primitive when not already supplied. Caller values win; idempotent.
 */
export declare function stampBaseFields<T extends object>(primitive: T, type: OperationalPrimitiveType): T & {
    id: string;
    type: OperationalPrimitiveType;
    version: string;
};
export interface BuilderOptions {
    /**
     * Validate the primitive against `@dna-codes/dna-schemas` before composing.
     * Default `true`. Hot paths (e.g. `merge()`'s emit loop) opt out via
     * `{ validate: false }` when inputs are already known to validate.
     */
    validate?: boolean;
}
export interface BuilderResult {
    dna: OperationalDNA;
    conflicts: Conflict[];
}
type NounCollection = 'resources' | 'persons' | 'roles' | 'groups';
type ActivityCollection = 'memberships' | 'operations' | 'triggers' | 'rules' | 'tasks' | 'processes' | 'relationships';
export type BuilderCollection = NounCollection | ActivityCollection;
export declare function composeInto(dna: OperationalDNA, primitive: unknown, collection: BuilderCollection, schemaId: string, opts?: BuilderOptions): BuilderResult;
export {};
//# sourceMappingURL=shared.d.ts.map