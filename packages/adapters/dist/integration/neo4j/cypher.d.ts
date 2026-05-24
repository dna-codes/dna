/**
 * Cypher snippet builders for the Neo4j `DnaDataStore` adapter,
 * registry-native edition.
 *
 * Neo4j does NOT parameterize node labels or relationship types in
 * Cypher — they have to be string-interpolated. To stay safe, every
 * caller-provided label MUST flow through `validateLabel()` first.
 *
 * Storage labels (registry-native):
 *   :ResourceType            metadata (was :TypeDefinition in v0.1.0)
 *   :RelationshipType        metadata (was :RelationshipDef)
 *   :ResourceTypeVersion     append-only version history for :ResourceType
 *   :RelationshipTypeVersion same for :RelationshipType
 *   :<TypeName>              per-typename Instance labels (e.g. :Loan)
 *   [:LINK]                  edge between Instance nodes
 *   [:VERSION_OF]            edge from version node back to its live type
 *   :SeedMarker              singleton sentinel after seedFromDna
 *
 * Functions in this file are pure (no I/O). They are unit-testable in
 * isolation, and the runtime adapter (`client.ts`) imports them by name.
 */
/**
 * Throw if `label` is not a safe Cypher identifier. The adapter's public
 * API surface MUST call this before interpolating any caller-provided
 * `typeName` into a Cypher statement.
 */
export declare function validateLabel(label: string): void;
/**
 * Static constraint + index Cypher created on every `migrate()` call.
 *
 * Per-typename Instance constraints (`(:Loan) REQUIRE _id IS UNIQUE`) are
 * NOT created here — they're created on-demand when `resourceType.create`
 * runs for a new typename. This matches the registry-native flow where
 * the type system is dynamic.
 */
export declare const METADATA_SCHEMA_CYPHER: readonly string[];
/**
 * Per-typename constraint Cypher, created on-demand when a new
 * `ResourceType` is registered. Idempotent via `IF NOT EXISTS`.
 */
export declare function labelSchemaCypher(label: string): readonly string[];
/** Cypher to drop the per-typename constraint+index. Called by `resourceType.delete`. */
export declare function dropLabelSchemaCypher(label: string): readonly string[];
export declare const CREATE_RESOURCE_TYPE_CYPHER = "CREATE (rt:ResourceType $props) RETURN rt.id AS id";
export declare const CREATE_RESOURCE_TYPE_VERSION_CYPHER = "MATCH (rt:ResourceType {id: $resourceTypeId})\nCREATE (v:ResourceTypeVersion $versionProps)\nCREATE (v)-[:VERSION_OF]->(rt)\nRETURN v.id AS id";
export declare const GET_RESOURCE_TYPE_CYPHER = "MATCH (rt:ResourceType {id: $id}) RETURN rt";
export declare const GET_RESOURCE_TYPE_BY_NAME_CYPHER = "MATCH (rt:ResourceType {name: $name}) RETURN rt";
export declare const LIST_RESOURCE_TYPES_CYPHER = "MATCH (rt:ResourceType) RETURN rt ORDER BY rt.name";
export declare const LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER = "MATCH (rt:ResourceType {category: $category}) RETURN rt ORDER BY rt.name";
export declare const UPDATE_RESOURCE_TYPE_CYPHER = "MATCH (rt:ResourceType {id: $id})\nSET rt += $patch, rt.current_version = $newVersion\nRETURN rt";
export declare const DELETE_RESOURCE_TYPE_CYPHER = "MATCH (rt:ResourceType {id: $id})\nOPTIONAL MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt)\nDETACH DELETE v, rt";
export declare const LIST_RESOURCE_TYPE_VERSIONS_CYPHER = "MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt:ResourceType {id: $id})\nRETURN v ORDER BY v.version DESC";
export declare const COUNT_INSTANCES_OF_TYPE_CYPHER: (label: string) => string;
export declare const CREATE_RELATIONSHIP_TYPE_CYPHER = "CREATE (rt:RelationshipType $props) RETURN rt.id AS id";
export declare const CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER = "MATCH (rt:RelationshipType {id: $relationshipTypeId})\nCREATE (v:RelationshipTypeVersion $versionProps)\nCREATE (v)-[:VERSION_OF]->(rt)\nRETURN v.id AS id";
export declare const GET_RELATIONSHIP_TYPE_CYPHER = "MATCH (rt:RelationshipType {id: $id}) RETURN rt";
export declare const GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER = "MATCH (rt:RelationshipType {name: $name}) RETURN rt";
export declare const LIST_RELATIONSHIP_TYPES_CYPHER = "MATCH (rt:RelationshipType) RETURN rt ORDER BY rt.name";
export declare const UPDATE_RELATIONSHIP_TYPE_CYPHER = "MATCH (rt:RelationshipType {id: $id})\nSET rt += $patch, rt.current_version = $newVersion\nRETURN rt";
export declare const DELETE_RELATIONSHIP_TYPE_CYPHER = "MATCH (rt:RelationshipType {id: $id})\nOPTIONAL MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt)\nDETACH DELETE v, rt";
export declare const LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER = "MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt:RelationshipType {id: $id})\nRETURN v ORDER BY v.version DESC";
export declare const COUNT_LINKS_OF_ROLE_CYPHER = "MATCH ()-[r:LINK {role: $role}]->() RETURN count(r) AS count";
export declare const DELETE_LINKS_OF_ROLE_CYPHER = "MATCH ()-[r:LINK {role: $role}]->() DELETE r";
export declare const HAS_SEED_MARKER_CYPHER = "MATCH (m:SeedMarker) RETURN m LIMIT 1";
export declare const WRITE_SEED_MARKER_CYPHER = "MERGE (m:SeedMarker) SET m.createdAt = $createdAt, m.dnaHash = $dnaHash RETURN m";
/** Cypher for `instance.create` — caller MUST validate the `label`. */
export declare function createInstanceCypher(label: string): string;
/** Cypher for `instance.get` — caller MUST validate the `label`. */
export declare function getInstanceCypher(label: string): string;
/** Cypher for `instance.update` — caller MUST validate the `label`. */
export declare function updateInstanceCypher(label: string): string;
/** Cypher for `instance.delete` — caller MUST validate the `label`. */
export declare function deleteInstanceCypher(label: string): string;
/** Cypher for `instance.list` — caller MUST validate the `label`. */
export declare function listInstanceCypher(label: string): string;
/** Cypher for `link.create` — caller MUST validate both labels. */
export declare function createLinkCypher(fromLabel: string, toLabel: string): string;
/** Cypher to delete a Link by its `_id`. Labels not required. */
export declare const DELETE_LINK_CYPHER = "MATCH ()-[r:LINK {_id: $linkId}]->() DELETE r";
/**
 * Build a Cypher query for `link.list(filter?)`. Returns the Cypher string
 * and a parameter map. Labels in the filter MUST be valid identifiers.
 */
export declare function buildLinkListCypher(filter: {
    from?: {
        typeName: string;
        id: string;
    };
    to?: {
        typeName: string;
        id: string;
    };
    role?: string;
}): {
    cypher: string;
    params: Record<string, unknown>;
};
//# sourceMappingURL=cypher.d.ts.map