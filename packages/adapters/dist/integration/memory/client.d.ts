/**
 * In-memory `DnaDataStore` implementation, registry-native edition. Zero
 * dependencies; the recommended test double for any package that depends
 * on `DnaDataStore`.
 *
 * Storage shape mirrors the Neo4j adapter so tests written against this
 * adapter exercise the same behaviors the Neo4j adapter promises (modulo
 * network and persistence):
 *
 *   - `ResourceType` and `RelationshipType` records live in their own
 *     in-memory maps with versioned history.
 *   - `Instance` records are keyed by `(typeName, id)` and stamped with
 *     `_schemaVersion` from the relevant ResourceType.current_version at
 *     write time.
 *   - `Link` records carry their own unique IDs plus optional `role` and
 *     `attributes`, and a `_schemaVersion` from the RelationshipType.
 *   - `seedFromDna` writes seed records once; `hasBeenSeeded()` reflects
 *     the marker.
 */
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
export declare function createClient(_dna?: OperationalDNA): DnaDataStore;
//# sourceMappingURL=client.d.ts.map