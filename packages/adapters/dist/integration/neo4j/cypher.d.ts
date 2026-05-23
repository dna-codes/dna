/**
 * Cypher snippet builders for the Neo4j `DnaDataStore` adapter.
 *
 * Neo4j does NOT parameterize node labels or relationship types in
 * Cypher — they have to be string-interpolated. To stay safe, every
 * caller-provided label MUST flow through `validateLabel()` first.
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
/** Constraint and index Cypher for the metadata labels (TypeDefinition, RelationshipDef). */
export declare const METADATA_SCHEMA_CYPHER: readonly string[];
/** Per-noun-primitive-label constraint + index Cypher. `label` MUST be validated. */
export declare function labelSchemaCypher(label: string): readonly string[];
/** Cypher to MERGE a TypeDefinition node. Properties passed via `$props`. */
export declare const MERGE_TYPEDEF_CYPHER = "MERGE (n:TypeDefinition {name: $name}) SET n += $props";
/** Cypher to MERGE a RelationshipDef node. Properties passed via `$props`. */
export declare const MERGE_RELDEF_CYPHER = "MERGE (n:RelationshipDef {name: $name}) SET n += $props";
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