/**
 * Neo4j-backed `DnaDataStore` implementation.
 *
 * Storage shape: Instances are labeled nodes (label = Resource/Person/
 * Role/Group name). Links are `[:LINK]` edges with `_id`, optional `role`,
 * optional `attributes` (serialized JSON) properties. TypeDefinition and
 * RelationshipDef metadata are seeded by `migrate()` as `:TypeDefinition`
 * and `:RelationshipDef` nodes.
 *
 * Cypher snippets live in `./cypher.ts` and are unit-testable in
 * isolation. The client composes them with the driver.
 */
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
import type { Neo4jClientOptions } from './types';
export declare function createClient(opts: Neo4jClientOptions, dna: OperationalDNA): DnaDataStore;
//# sourceMappingURL=client.d.ts.map