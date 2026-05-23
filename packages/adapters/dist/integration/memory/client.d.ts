/**
 * In-memory `DnaDataStore` implementation. Zero dependencies; the
 * recommended test double for any package that depends on `DnaDataStore`.
 *
 * Storage shape mirrors the Neo4j adapter's semantics so tests written
 * against this adapter exercise the same behaviors the Neo4j adapter
 * promises (modulo network and persistence):
 *
 *   - Instances are keyed by `(typeName, id)` — same `id` across different
 *     types does not collide.
 *   - Links carry their own unique IDs and store `from`, `to`, optional
 *     `role`, optional `attributes`.
 *   - `migrate()` seeds TypeDefinition and RelationshipDef metadata from
 *     the constructor DNA.
 */
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
export declare function createClient(dna: OperationalDNA): DnaDataStore;
//# sourceMappingURL=client.d.ts.map