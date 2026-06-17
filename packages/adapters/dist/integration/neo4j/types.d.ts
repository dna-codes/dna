/**
 * Types for the Neo4j `DnaDataStore` adapter.
 *
 * The adapter is deliberately DNA-aware (it takes an `OperationalDNA` at
 * construction so `migrate()` can seed TypeDefinition metadata) — a known
 * exception to the integration pure-I/O rule, mirroring the rationale
 * documented for `integration/memory`. See `AGENTS.md`.
 */
import type { DnaDataStore } from '@dna-codes/dna-core';
/**
 * The Neo4j store: the full `DnaDataStore` plus a `clear()` that wipes the
 * entire graph (used by the MCP server's reset flow). `createClient` returns
 * this; callers that only need the contract can keep typing it as `DnaDataStore`.
 */
export interface Neo4jStore extends DnaDataStore {
    /** Delete every node and relationship. Constraints survive; re-`migrate()` is idempotent. */
    clear(): Promise<void>;
}
export interface Neo4jClientOptions {
    /** Bolt URI — e.g. `bolt://localhost:7687` or `neo4j+s://<host>:7687`. */
    uri: string;
    /** Username for basic auth. */
    username: string;
    /** Password for basic auth. */
    password: string;
    /** Optional database name. Defaults to the driver's configured default. */
    database?: string;
}
//# sourceMappingURL=types.d.ts.map