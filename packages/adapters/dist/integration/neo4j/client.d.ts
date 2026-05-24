/**
 * Neo4j-backed `DnaDataStore` implementation, registry-native edition.
 *
 * Storage shape:
 *   :ResourceType            metadata nodes for runtime type system
 *   :RelationshipType        metadata nodes for runtime relationship types
 *   :ResourceTypeVersion     append-only history → :ResourceType via [:VERSION_OF]
 *   :RelationshipTypeVersion append-only history → :RelationshipType
 *   :<TypeName>              labeled Instance nodes (e.g. :Loan, :Borrower)
 *   [:LINK]                  edges between Instance nodes, with `_id`, `role`,
 *                            `attributes` (JSON-stringified), `_schemaVersion`
 *   :SeedMarker              singleton sentinel written by seedFromDna
 *
 * Cypher snippets live in `./cypher.ts` and are unit-testable in
 * isolation. The client composes them with the driver.
 */
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
import type { Neo4jClientOptions } from './types';
export declare function createClient(opts: Neo4jClientOptions, _dna?: OperationalDNA): DnaDataStore;
//# sourceMappingURL=client.d.ts.map