"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE_LINK_CYPHER = exports.CLEAR_GRAPH_CYPHER = exports.WRITE_SEED_MARKER_CYPHER = exports.HAS_SEED_MARKER_CYPHER = exports.DELETE_LINKS_OF_ROLE_CYPHER = exports.COUNT_LINKS_OF_ROLE_CYPHER = exports.LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER = exports.DELETE_RELATIONSHIP_TYPE_CYPHER = exports.SET_RELATIONSHIP_TYPE_STABILITY_CYPHER = exports.UPDATE_RELATIONSHIP_TYPE_CYPHER = exports.LIST_RELATIONSHIP_TYPES_CYPHER = exports.GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER = exports.GET_RELATIONSHIP_TYPE_CYPHER = exports.CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER = exports.CREATE_RELATIONSHIP_TYPE_CYPHER = exports.COUNT_INSTANCES_OF_TYPE_CYPHER = exports.LIST_RESOURCE_TYPE_VERSIONS_CYPHER = exports.DELETE_RESOURCE_TYPE_CYPHER = exports.SET_RESOURCE_TYPE_STABILITY_CYPHER = exports.UPDATE_RESOURCE_TYPE_CYPHER = exports.LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER = exports.LIST_RESOURCE_TYPES_CYPHER = exports.GET_RESOURCE_TYPE_BY_NAME_CYPHER = exports.GET_RESOURCE_TYPE_CYPHER = exports.CREATE_RESOURCE_TYPE_VERSION_CYPHER = exports.CREATE_RESOURCE_TYPE_CYPHER = exports.METADATA_SCHEMA_CYPHER = void 0;
exports.validateLabel = validateLabel;
exports.labelSchemaCypher = labelSchemaCypher;
exports.dropLabelSchemaCypher = dropLabelSchemaCypher;
exports.createInstanceCypher = createInstanceCypher;
exports.getInstanceCypher = getInstanceCypher;
exports.updateInstanceCypher = updateInstanceCypher;
exports.deleteInstanceCypher = deleteInstanceCypher;
exports.listInstanceCypher = listInstanceCypher;
exports.createLinkCypher = createLinkCypher;
exports.buildLinkListCypher = buildLinkListCypher;
/**
 * Permitted identifier pattern for Cypher node labels. The sole job of this
 * guard is injection safety: a label is interpolated into Cypher, so it must be
 * a bare identifier (letter/underscore start, then letters/digits/underscores).
 * It deliberately allows a lowercase first letter — Neo4j accepts such labels,
 * and the in-memory adapter imposes no case rule, so the dna-agent packs
 * (`person`, `process`, …) must seed identically into either backend. PascalCase
 * remains the DNA noun-primitive *convention*, but it is not enforced here.
 */
const SAFE_LABEL = /^[A-Za-z_][A-Za-z0-9_]*$/;
/**
 * Throw if `label` is not a safe Cypher identifier. The adapter's public
 * API surface MUST call this before interpolating any caller-provided
 * `typeName` into a Cypher statement.
 */
function validateLabel(label) {
    if (typeof label !== 'string' || !SAFE_LABEL.test(label)) {
        throw new Error(`integration/neo4j: invalid typeName "${label}" — must match /^[A-Za-z_][A-Za-z0-9_]*$/ (a safe Cypher label identifier)`);
    }
}
/**
 * Static constraint + index Cypher created on every `migrate()` call.
 *
 * Per-typename Instance constraints (`(:Loan) REQUIRE _id IS UNIQUE`) are
 * NOT created here — they're created on-demand when `resourceType.create`
 * runs for a new typename. This matches the registry-native flow where
 * the type system is dynamic.
 */
exports.METADATA_SCHEMA_CYPHER = [
    'CREATE CONSTRAINT resource_type_name_unique IF NOT EXISTS FOR (n:ResourceType) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT relationship_type_name_unique IF NOT EXISTS FOR (n:RelationshipType) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT resource_type_id_unique IF NOT EXISTS FOR (n:ResourceType) REQUIRE n.id IS UNIQUE',
    'CREATE CONSTRAINT relationship_type_id_unique IF NOT EXISTS FOR (n:RelationshipType) REQUIRE n.id IS UNIQUE',
    'CREATE CONSTRAINT resource_type_version_id_unique IF NOT EXISTS FOR (n:ResourceTypeVersion) REQUIRE n.id IS UNIQUE',
    'CREATE CONSTRAINT relationship_type_version_id_unique IF NOT EXISTS FOR (n:RelationshipTypeVersion) REQUIRE n.id IS UNIQUE',
    'CREATE INDEX link_id_index IF NOT EXISTS FOR ()-[r:LINK]-() ON (r._id)',
];
/**
 * Per-typename constraint Cypher, created on-demand when a new
 * `ResourceType` is registered. Idempotent via `IF NOT EXISTS`.
 */
function labelSchemaCypher(label) {
    validateLabel(label);
    const safeName = label.toLowerCase();
    return [
        `CREATE CONSTRAINT ${safeName}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n._id IS UNIQUE`,
        `CREATE INDEX ${safeName}_typename_index IF NOT EXISTS FOR (n:${label}) ON (n._typeName)`,
    ];
}
/** Cypher to drop the per-typename constraint+index. Called by `resourceType.delete`. */
function dropLabelSchemaCypher(label) {
    validateLabel(label);
    const safeName = label.toLowerCase();
    return [
        `DROP CONSTRAINT ${safeName}_id_unique IF EXISTS`,
        `DROP INDEX ${safeName}_typename_index IF EXISTS`,
    ];
}
// ── ResourceType / RelationshipType CRUD Cypher ────────────────────────────
exports.CREATE_RESOURCE_TYPE_CYPHER = 'CREATE (rt:ResourceType $props) RETURN rt.id AS id';
exports.CREATE_RESOURCE_TYPE_VERSION_CYPHER = `MATCH (rt:ResourceType {id: $resourceTypeId})
CREATE (v:ResourceTypeVersion $versionProps)
CREATE (v)-[:VERSION_OF]->(rt)
RETURN v.id AS id`;
exports.GET_RESOURCE_TYPE_CYPHER = 'MATCH (rt:ResourceType {id: $id}) RETURN rt';
exports.GET_RESOURCE_TYPE_BY_NAME_CYPHER = 'MATCH (rt:ResourceType {name: $name}) RETURN rt';
exports.LIST_RESOURCE_TYPES_CYPHER = 'MATCH (rt:ResourceType) RETURN rt ORDER BY rt.name';
exports.LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER = 'MATCH (rt:ResourceType {category: $category}) RETURN rt ORDER BY rt.name';
exports.UPDATE_RESOURCE_TYPE_CYPHER = `MATCH (rt:ResourceType {id: $id})
SET rt += $patch, rt.current_version = $newVersion
RETURN rt`;
/** Set `stability` only — no `current_version` bump, no version record (orthogonal transition). */
exports.SET_RESOURCE_TYPE_STABILITY_CYPHER = `MATCH (rt:ResourceType {id: $id})
SET rt.stability = $stability
RETURN rt`;
exports.DELETE_RESOURCE_TYPE_CYPHER = `MATCH (rt:ResourceType {id: $id})
OPTIONAL MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt)
DETACH DELETE v, rt`;
exports.LIST_RESOURCE_TYPE_VERSIONS_CYPHER = `MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt:ResourceType {id: $id})
RETURN v ORDER BY v.version DESC`;
const COUNT_INSTANCES_OF_TYPE_CYPHER = (label) => {
    validateLabel(label);
    return `MATCH (n:${label}) RETURN count(n) AS count`;
};
exports.COUNT_INSTANCES_OF_TYPE_CYPHER = COUNT_INSTANCES_OF_TYPE_CYPHER;
exports.CREATE_RELATIONSHIP_TYPE_CYPHER = 'CREATE (rt:RelationshipType $props) RETURN rt.id AS id';
exports.CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER = `MATCH (rt:RelationshipType {id: $relationshipTypeId})
CREATE (v:RelationshipTypeVersion $versionProps)
CREATE (v)-[:VERSION_OF]->(rt)
RETURN v.id AS id`;
exports.GET_RELATIONSHIP_TYPE_CYPHER = 'MATCH (rt:RelationshipType {id: $id}) RETURN rt';
exports.GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER = 'MATCH (rt:RelationshipType {name: $name}) RETURN rt';
exports.LIST_RELATIONSHIP_TYPES_CYPHER = 'MATCH (rt:RelationshipType) RETURN rt ORDER BY rt.name';
exports.UPDATE_RELATIONSHIP_TYPE_CYPHER = `MATCH (rt:RelationshipType {id: $id})
SET rt += $patch, rt.current_version = $newVersion
RETURN rt`;
/** Set `stability` only — no `current_version` bump, no version record (orthogonal transition). */
exports.SET_RELATIONSHIP_TYPE_STABILITY_CYPHER = `MATCH (rt:RelationshipType {id: $id})
SET rt.stability = $stability
RETURN rt`;
exports.DELETE_RELATIONSHIP_TYPE_CYPHER = `MATCH (rt:RelationshipType {id: $id})
OPTIONAL MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt)
DETACH DELETE v, rt`;
exports.LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER = `MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt:RelationshipType {id: $id})
RETURN v ORDER BY v.version DESC`;
exports.COUNT_LINKS_OF_ROLE_CYPHER = 'MATCH ()-[r:LINK {role: $role}]->() RETURN count(r) AS count';
exports.DELETE_LINKS_OF_ROLE_CYPHER = 'MATCH ()-[r:LINK {role: $role}]->() DELETE r';
// ── Seed marker ────────────────────────────────────────────────────────────
exports.HAS_SEED_MARKER_CYPHER = 'MATCH (m:SeedMarker) RETURN m LIMIT 1';
exports.WRITE_SEED_MARKER_CYPHER = 'MERGE (m:SeedMarker) SET m.createdAt = $createdAt, m.dnaHash = $dnaHash RETURN m';
// ── Full-graph clear ───────────────────────────────────────────────────────
/**
 * Delete every node (type-metadata nodes, instance nodes, the SeedMarker) and
 * its relationships. Constraints/indexes are schema, not data, so they survive
 * — a subsequent `migrate()` is idempotent. Used by the reset flow.
 */
exports.CLEAR_GRAPH_CYPHER = 'MATCH (n) DETACH DELETE n';
// ── Instance / Link CRUD (existing snippets, retained) ─────────────────────
/** Cypher for `instance.create` — caller MUST validate the `label`. */
function createInstanceCypher(label) {
    validateLabel(label);
    return `CREATE (n:${label}) SET n = $props RETURN n._id AS id`;
}
/** Cypher for `instance.get` — caller MUST validate the `label`. */
function getInstanceCypher(label) {
    validateLabel(label);
    return `MATCH (n:${label} {_id: $id}) RETURN n`;
}
/** Cypher for `instance.update` — caller MUST validate the `label`. */
function updateInstanceCypher(label) {
    validateLabel(label);
    return `MATCH (n:${label} {_id: $id}) SET n += $patch, n._updatedAt = $updatedAt RETURN n._id AS id`;
}
/** Cypher for `instance.delete` — caller MUST validate the `label`. */
function deleteInstanceCypher(label) {
    validateLabel(label);
    return `MATCH (n:${label} {_id: $id}) DETACH DELETE n`;
}
/** Cypher for `instance.list` — caller MUST validate the `label`. */
function listInstanceCypher(label) {
    validateLabel(label);
    return `MATCH (n:${label}) RETURN n`;
}
/** Cypher for `link.create` — caller MUST validate both labels. */
function createLinkCypher(fromLabel, toLabel) {
    validateLabel(fromLabel);
    validateLabel(toLabel);
    return `MATCH (a:${fromLabel} {_id: $fromId}), (b:${toLabel} {_id: $toId})
          CREATE (a)-[r:LINK]->(b)
          SET r = $props
          RETURN r._id AS id`;
}
/** Cypher to delete a Link by its `_id`. Labels not required. */
exports.DELETE_LINK_CYPHER = 'MATCH ()-[r:LINK {_id: $linkId}]->() DELETE r';
/**
 * Build a Cypher query for `link.list(filter?)`. Returns the Cypher string
 * and a parameter map. Labels in the filter MUST be valid identifiers.
 */
function buildLinkListCypher(filter) {
    const fromLabel = filter.from?.typeName;
    const toLabel = filter.to?.typeName;
    if (fromLabel)
        validateLabel(fromLabel);
    if (toLabel)
        validateLabel(toLabel);
    const fromPart = fromLabel ? `(a:${fromLabel} {_id: $fromId})` : '(a)';
    const toPart = toLabel ? `(b:${toLabel} {_id: $toId})` : '(b)';
    const whereClauses = [];
    const params = {};
    if (filter.from)
        params.fromId = filter.from.id;
    if (filter.to)
        params.toId = filter.to.id;
    if (filter.role !== undefined) {
        whereClauses.push('r.role = $role');
        params.role = filter.role;
    }
    const where = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const cypher = `MATCH ${fromPart}-[r:LINK]->${toPart}${where} ` +
        'RETURN r, labels(a) AS fromLabels, a._id AS fromId, labels(b) AS toLabels, b._id AS toId';
    return { cypher, params };
}
//# sourceMappingURL=cypher.js.map