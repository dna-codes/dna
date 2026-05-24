/**
 * Compiled-ajv-validator cache keyed by `(resourceTypeId, version)`.
 *
 * Validation runs on every `create<Type>` and `update<Type>` mutation;
 * compiling ajv on every call would be wasteful. The cache compiles
 * once per (type, version) pair and reuses the validator. Updates to a
 * `ResourceType` bump the version so the new schema gets a fresh cache
 * entry on the first write.
 *
 * Memory grows with the number of distinct (type, version) pairs ever
 * touched — bounded in practice by tenant size. An LRU bound is left
 * for a follow-on if a benchmark says it matters.
 */
import { type ValidateFunction } from 'ajv';
import type { AttributeSchema } from '@dna-codes/dna-core';
export declare class ValidatorCache {
    private ajv;
    private byTypeId;
    constructor();
    /**
     * Compile (or return cached) a validator for `(typeId, version)` against
     * the supplied schema. If a newer version is supplied for the same
     * typeId, the previous entry is replaced.
     */
    getOrCompile(typeId: string, version: number, schema: AttributeSchema): ValidateFunction;
    /** Drop any cached entry for a typeId — used when a ResourceType is deleted. */
    invalidate(typeId: string): void;
    /** Drop all cached entries. */
    clear(): void;
}
/**
 * Convert ajv errors into a single human-readable string suitable for
 * surfacing as a GraphQL error message.
 */
export declare function formatAjvErrors(validate: ValidateFunction): string;
//# sourceMappingURL=validator-cache.d.ts.map