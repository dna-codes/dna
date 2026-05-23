/**
 * @dna-codes/dna-adapters/integration/neo4j
 *
 * Neo4j-backed `DnaDataStore` implementation. Storage shape: Instances as
 * labeled nodes (label = Resource/Person/Role/Group name), Links as
 * `[:LINK]` edges with properties. Metadata (TypeDefinition,
 * RelationshipDef) is seeded by `migrate()`.
 *
 * Deliberately DNA-aware (takes an `OperationalDNA` at construction) —
 * see `AGENTS.md` for the rationale and the contrast with external-system
 * integrations that remain pure I/O.
 */
export { createClient } from './client';
export type { Neo4jClientOptions } from './types';
export { runCli } from './cli';
//# sourceMappingURL=index.d.ts.map