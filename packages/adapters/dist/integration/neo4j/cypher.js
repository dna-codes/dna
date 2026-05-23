"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE_LINK_CYPHER = exports.MERGE_RELDEF_CYPHER = exports.MERGE_TYPEDEF_CYPHER = exports.METADATA_SCHEMA_CYPHER = void 0;
exports.validateLabel = validateLabel;
exports.labelSchemaCypher = labelSchemaCypher;
exports.createInstanceCypher = createInstanceCypher;
exports.getInstanceCypher = getInstanceCypher;
exports.updateInstanceCypher = updateInstanceCypher;
exports.deleteInstanceCypher = deleteInstanceCypher;
exports.listInstanceCypher = listInstanceCypher;
exports.createLinkCypher = createLinkCypher;
exports.buildLinkListCypher = buildLinkListCypher;
/**
 * Permitted identifier pattern for Cypher node labels. Matches the DNA
 * Resource/Person/Role/Group `name` pattern (`^[A-Z][a-zA-Z0-9]*$`). This
 * is the only safe character set to interpolate into Cypher.
 */
const SAFE_LABEL = /^[A-Z][a-zA-Z0-9]*$/;
/**
 * Throw if `label` is not a safe Cypher identifier. The adapter's public
 * API surface MUST call this before interpolating any caller-provided
 * `typeName` into a Cypher statement.
 */
function validateLabel(label) {
    if (typeof label !== 'string' || !SAFE_LABEL.test(label)) {
        throw new Error(`integration/neo4j: invalid typeName "${label}" — must match /^[A-Z][a-zA-Z0-9]*$/ (the DNA noun-primitive naming convention)`);
    }
}
/** Constraint and index Cypher for the metadata labels (TypeDefinition, RelationshipDef). */
exports.METADATA_SCHEMA_CYPHER = [
    'CREATE CONSTRAINT typedef_name_unique IF NOT EXISTS FOR (n:TypeDefinition) REQUIRE n.name IS UNIQUE',
    'CREATE CONSTRAINT reldef_name_unique IF NOT EXISTS FOR (n:RelationshipDef) REQUIRE n.name IS UNIQUE',
    'CREATE INDEX link_id_index IF NOT EXISTS FOR ()-[r:LINK]-() ON (r._id)',
];
/** Per-noun-primitive-label constraint + index Cypher. `label` MUST be validated. */
function labelSchemaCypher(label) {
    validateLabel(label);
    // Constraint name needs a unique, safe identifier per label.
    const safeName = label.toLowerCase();
    return [
        `CREATE CONSTRAINT ${safeName}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n._id IS UNIQUE`,
        `CREATE INDEX ${safeName}_typename_index IF NOT EXISTS FOR (n:${label}) ON (n._typeName)`,
    ];
}
/** Cypher to MERGE a TypeDefinition node. Properties passed via `$props`. */
exports.MERGE_TYPEDEF_CYPHER = 'MERGE (n:TypeDefinition {name: $name}) SET n += $props';
/** Cypher to MERGE a RelationshipDef node. Properties passed via `$props`. */
exports.MERGE_RELDEF_CYPHER = 'MERGE (n:RelationshipDef {name: $name}) SET n += $props';
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