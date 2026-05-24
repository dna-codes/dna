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
 * Permitted identifier pattern for Cypher node labels. Matches the DNA
 * Resource/Person/Role/Group `name` pattern (`^[A-Z][a-zA-Z0-9]*$`). This
 * is the only safe character set to interpolate into Cypher.
 */
const SAFE_LABEL = /^[A-Z][a-zA-Z0-9]*$/

/**
 * Throw if `label` is not a safe Cypher identifier. The adapter's public
 * API surface MUST call this before interpolating any caller-provided
 * `typeName` into a Cypher statement.
 */
export function validateLabel(label: string): void {
  if (typeof label !== 'string' || !SAFE_LABEL.test(label)) {
    throw new Error(
      `integration/neo4j: invalid typeName "${label}" — must match /^[A-Z][a-zA-Z0-9]*$/ (the DNA noun-primitive naming convention)`,
    )
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
export const METADATA_SCHEMA_CYPHER: readonly string[] = [
  'CREATE CONSTRAINT resource_type_name_unique IF NOT EXISTS FOR (n:ResourceType) REQUIRE n.name IS UNIQUE',
  'CREATE CONSTRAINT relationship_type_name_unique IF NOT EXISTS FOR (n:RelationshipType) REQUIRE n.name IS UNIQUE',
  'CREATE CONSTRAINT resource_type_id_unique IF NOT EXISTS FOR (n:ResourceType) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT relationship_type_id_unique IF NOT EXISTS FOR (n:RelationshipType) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT resource_type_version_id_unique IF NOT EXISTS FOR (n:ResourceTypeVersion) REQUIRE n.id IS UNIQUE',
  'CREATE CONSTRAINT relationship_type_version_id_unique IF NOT EXISTS FOR (n:RelationshipTypeVersion) REQUIRE n.id IS UNIQUE',
  'CREATE INDEX link_id_index IF NOT EXISTS FOR ()-[r:LINK]-() ON (r._id)',
]

/**
 * Per-typename constraint Cypher, created on-demand when a new
 * `ResourceType` is registered. Idempotent via `IF NOT EXISTS`.
 */
export function labelSchemaCypher(label: string): readonly string[] {
  validateLabel(label)
  const safeName = label.toLowerCase()
  return [
    `CREATE CONSTRAINT ${safeName}_id_unique IF NOT EXISTS FOR (n:${label}) REQUIRE n._id IS UNIQUE`,
    `CREATE INDEX ${safeName}_typename_index IF NOT EXISTS FOR (n:${label}) ON (n._typeName)`,
  ]
}

/** Cypher to drop the per-typename constraint+index. Called by `resourceType.delete`. */
export function dropLabelSchemaCypher(label: string): readonly string[] {
  validateLabel(label)
  const safeName = label.toLowerCase()
  return [
    `DROP CONSTRAINT ${safeName}_id_unique IF EXISTS`,
    `DROP INDEX ${safeName}_typename_index IF EXISTS`,
  ]
}

// ── ResourceType / RelationshipType CRUD Cypher ────────────────────────────

export const CREATE_RESOURCE_TYPE_CYPHER =
  'CREATE (rt:ResourceType $props) RETURN rt.id AS id'

export const CREATE_RESOURCE_TYPE_VERSION_CYPHER = `MATCH (rt:ResourceType {id: $resourceTypeId})
CREATE (v:ResourceTypeVersion $versionProps)
CREATE (v)-[:VERSION_OF]->(rt)
RETURN v.id AS id`

export const GET_RESOURCE_TYPE_CYPHER =
  'MATCH (rt:ResourceType {id: $id}) RETURN rt'

export const GET_RESOURCE_TYPE_BY_NAME_CYPHER =
  'MATCH (rt:ResourceType {name: $name}) RETURN rt'

export const LIST_RESOURCE_TYPES_CYPHER =
  'MATCH (rt:ResourceType) RETURN rt ORDER BY rt.name'

export const LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER =
  'MATCH (rt:ResourceType {category: $category}) RETURN rt ORDER BY rt.name'

export const UPDATE_RESOURCE_TYPE_CYPHER = `MATCH (rt:ResourceType {id: $id})
SET rt += $patch, rt.current_version = $newVersion
RETURN rt`

export const DELETE_RESOURCE_TYPE_CYPHER = `MATCH (rt:ResourceType {id: $id})
OPTIONAL MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt)
DETACH DELETE v, rt`

export const LIST_RESOURCE_TYPE_VERSIONS_CYPHER = `MATCH (v:ResourceTypeVersion)-[:VERSION_OF]->(rt:ResourceType {id: $id})
RETURN v ORDER BY v.version DESC`

export const COUNT_INSTANCES_OF_TYPE_CYPHER = (label: string): string => {
  validateLabel(label)
  return `MATCH (n:${label}) RETURN count(n) AS count`
}

export const CREATE_RELATIONSHIP_TYPE_CYPHER =
  'CREATE (rt:RelationshipType $props) RETURN rt.id AS id'

export const CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER = `MATCH (rt:RelationshipType {id: $relationshipTypeId})
CREATE (v:RelationshipTypeVersion $versionProps)
CREATE (v)-[:VERSION_OF]->(rt)
RETURN v.id AS id`

export const GET_RELATIONSHIP_TYPE_CYPHER =
  'MATCH (rt:RelationshipType {id: $id}) RETURN rt'

export const GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER =
  'MATCH (rt:RelationshipType {name: $name}) RETURN rt'

export const LIST_RELATIONSHIP_TYPES_CYPHER =
  'MATCH (rt:RelationshipType) RETURN rt ORDER BY rt.name'

export const UPDATE_RELATIONSHIP_TYPE_CYPHER = `MATCH (rt:RelationshipType {id: $id})
SET rt += $patch, rt.current_version = $newVersion
RETURN rt`

export const DELETE_RELATIONSHIP_TYPE_CYPHER = `MATCH (rt:RelationshipType {id: $id})
OPTIONAL MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt)
DETACH DELETE v, rt`

export const LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER = `MATCH (v:RelationshipTypeVersion)-[:VERSION_OF]->(rt:RelationshipType {id: $id})
RETURN v ORDER BY v.version DESC`

export const COUNT_LINKS_OF_ROLE_CYPHER =
  'MATCH ()-[r:LINK {role: $role}]->() RETURN count(r) AS count'

export const DELETE_LINKS_OF_ROLE_CYPHER =
  'MATCH ()-[r:LINK {role: $role}]->() DELETE r'

// ── Seed marker ────────────────────────────────────────────────────────────

export const HAS_SEED_MARKER_CYPHER =
  'MATCH (m:SeedMarker) RETURN m LIMIT 1'

export const WRITE_SEED_MARKER_CYPHER =
  'MERGE (m:SeedMarker) SET m.createdAt = $createdAt, m.dnaHash = $dnaHash RETURN m'

// ── Instance / Link CRUD (existing snippets, retained) ─────────────────────

/** Cypher for `instance.create` — caller MUST validate the `label`. */
export function createInstanceCypher(label: string): string {
  validateLabel(label)
  return `CREATE (n:${label}) SET n = $props RETURN n._id AS id`
}

/** Cypher for `instance.get` — caller MUST validate the `label`. */
export function getInstanceCypher(label: string): string {
  validateLabel(label)
  return `MATCH (n:${label} {_id: $id}) RETURN n`
}

/** Cypher for `instance.update` — caller MUST validate the `label`. */
export function updateInstanceCypher(label: string): string {
  validateLabel(label)
  return `MATCH (n:${label} {_id: $id}) SET n += $patch, n._updatedAt = $updatedAt RETURN n._id AS id`
}

/** Cypher for `instance.delete` — caller MUST validate the `label`. */
export function deleteInstanceCypher(label: string): string {
  validateLabel(label)
  return `MATCH (n:${label} {_id: $id}) DETACH DELETE n`
}

/** Cypher for `instance.list` — caller MUST validate the `label`. */
export function listInstanceCypher(label: string): string {
  validateLabel(label)
  return `MATCH (n:${label}) RETURN n`
}

/** Cypher for `link.create` — caller MUST validate both labels. */
export function createLinkCypher(fromLabel: string, toLabel: string): string {
  validateLabel(fromLabel)
  validateLabel(toLabel)
  return `MATCH (a:${fromLabel} {_id: $fromId}), (b:${toLabel} {_id: $toId})
          CREATE (a)-[r:LINK]->(b)
          SET r = $props
          RETURN r._id AS id`
}

/** Cypher to delete a Link by its `_id`. Labels not required. */
export const DELETE_LINK_CYPHER = 'MATCH ()-[r:LINK {_id: $linkId}]->() DELETE r'

/**
 * Build a Cypher query for `link.list(filter?)`. Returns the Cypher string
 * and a parameter map. Labels in the filter MUST be valid identifiers.
 */
export function buildLinkListCypher(filter: {
  from?: { typeName: string; id: string }
  to?: { typeName: string; id: string }
  role?: string
}): { cypher: string; params: Record<string, unknown> } {
  const fromLabel = filter.from?.typeName
  const toLabel = filter.to?.typeName
  if (fromLabel) validateLabel(fromLabel)
  if (toLabel) validateLabel(toLabel)

  const fromPart = fromLabel ? `(a:${fromLabel} {_id: $fromId})` : '(a)'
  const toPart = toLabel ? `(b:${toLabel} {_id: $toId})` : '(b)'
  const whereClauses: string[] = []
  const params: Record<string, unknown> = {}
  if (filter.from) params.fromId = filter.from.id
  if (filter.to) params.toId = filter.to.id
  if (filter.role !== undefined) {
    whereClauses.push('r.role = $role')
    params.role = filter.role
  }
  const where = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : ''
  const cypher =
    `MATCH ${fromPart}-[r:LINK]->${toPart}${where} ` +
    'RETURN r, labels(a) AS fromLabels, a._id AS fromId, labels(b) AS toLabels, b._id AS toId'
  return { cypher, params }
}
