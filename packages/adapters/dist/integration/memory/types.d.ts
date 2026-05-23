/**
 * Types for the in-memory `DnaDataStore` adapter.
 *
 * The adapter exports no surface beyond the shared `DnaDataStore` interface
 * from `@dna-codes/dna-core` plus the `MemoryClient` alias. Internal record
 * shapes are not exported — callers depend on the contract, not the
 * implementation.
 */
import type { DnaDataStore } from '@dna-codes/dna-core';
/**
 * The memory adapter's public client type. Today this is an alias of
 * `DnaDataStore`; if the memory adapter ever grows non-interface methods
 * (e.g. a `snapshot()` test helper) they would land here without breaking
 * the shared contract.
 */
export type MemoryClient = DnaDataStore;
//# sourceMappingURL=types.d.ts.map