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

import { createHash, randomUUID } from 'crypto'

import neo4j, { Driver, Session } from 'neo4j-driver'

import type {
  AttributeSchema,
  DnaDataStore,
  InstanceCreateInput,
  InstanceRecord,
  InstanceRef,
  LinkCreateOptions,
  LinkListFilter,
  LinkRecord,
  NounCategory,
  OperationalDNA,
  RelationshipType,
  RelationshipTypeInput,
  RelationshipTypeUpdate,
  RelationshipTypeVersion,
  ResourceType,
  ResourceTypeInput,
  ResourceTypeUpdate,
  ResourceTypeVersion,
  SeedReport,
  Stability,
  TypeDeleteOptions,
} from '@dna-codes/dna-core'

import { defaultStabilityForType, TypeInUseError } from '@dna-codes/dna-core'

import {
  CLEAR_GRAPH_CYPHER,
  CREATE_RELATIONSHIP_TYPE_CYPHER,
  CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER,
  CREATE_RESOURCE_TYPE_CYPHER,
  CREATE_RESOURCE_TYPE_VERSION_CYPHER,
  COUNT_INSTANCES_OF_TYPE_CYPHER,
  COUNT_LINKS_OF_ROLE_CYPHER,
  DELETE_LINK_CYPHER,
  DELETE_LINKS_OF_ROLE_CYPHER,
  DELETE_RELATIONSHIP_TYPE_CYPHER,
  DELETE_RESOURCE_TYPE_CYPHER,
  GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER,
  GET_RELATIONSHIP_TYPE_CYPHER,
  GET_RESOURCE_TYPE_BY_NAME_CYPHER,
  GET_RESOURCE_TYPE_CYPHER,
  HAS_SEED_MARKER_CYPHER,
  LIST_RELATIONSHIP_TYPES_CYPHER,
  LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER,
  LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER,
  LIST_RESOURCE_TYPES_CYPHER,
  LIST_RESOURCE_TYPE_VERSIONS_CYPHER,
  METADATA_SCHEMA_CYPHER,
  SET_RELATIONSHIP_TYPE_STABILITY_CYPHER,
  SET_RESOURCE_TYPE_STABILITY_CYPHER,
  UPDATE_RELATIONSHIP_TYPE_CYPHER,
  UPDATE_RESOURCE_TYPE_CYPHER,
  WRITE_SEED_MARKER_CYPHER,
  buildLinkListCypher,
  createInstanceCypher,
  createLinkCypher,
  deleteInstanceCypher,
  dropLabelSchemaCypher,
  getInstanceCypher,
  labelSchemaCypher,
  listInstanceCypher,
  updateInstanceCypher,
  validateLabel,
} from './cypher'
import type { Neo4jClientOptions, Neo4jStore } from './types'

const RESERVED_PROPS = new Set(['_id', '_typeName', '_createdAt', '_updatedAt', '_schemaVersion'])

const FOUNDATIONAL: Array<{ name: string; category: NounCategory }> = [
  { name: 'Person', category: 'person' },
  { name: 'Position', category: 'position' },
  { name: 'Group', category: 'group' },
  { name: 'Resource', category: 'resource' },
]

const NOUN_KEYS: Array<{ key: 'resources' | 'persons' | 'positions' | 'groups'; category: NounCategory }> = [
  { key: 'resources', category: 'resource' },
  { key: 'persons', category: 'person' },
  { key: 'positions', category: 'position' },
  { key: 'groups', category: 'group' },
]

function toAttributeSchema(raw: unknown): AttributeSchema {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (e): e is { name: string; type: string } =>
      !!e && typeof e === 'object' && typeof (e as Record<string, unknown>).name === 'string',
  ) as AttributeSchema
}

const STABILITY_VALUES: readonly string[] = ['experimental', 'beta', 'stable', 'deprecated']

/** Narrow an authored/stored `stability` field to a valid `Stability`, or `undefined`. */
function asStability(raw: unknown): Stability | undefined {
  return typeof raw === 'string' && STABILITY_VALUES.includes(raw) ? (raw as Stability) : undefined
}

function stripReservedAndId(node: Record<string, unknown>): InstanceRecord {
  const id = String(node._id)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(node)) {
    if (k === '_id') continue
    if (k === '_schemaVersion') {
      out._schemaVersion = typeof v === 'number' ? v : Number(v)
      continue
    }
    if (RESERVED_PROPS.has(k)) continue
    out[k] = v
  }
  return { id, ...out }
}

function nodePropsFor(
  id: string,
  data: InstanceCreateInput,
  now: string,
  schemaVersion: number | undefined,
): Record<string, unknown> {
  const { id: _stripped, ...rest } = data
  void _stripped
  return {
    _id: id,
    _createdAt: now,
    _updatedAt: now,
    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
    ...rest,
  }
}

function resourceTypeFromNode(node: Record<string, unknown>): ResourceType {
  const name = String(node.name)
  return {
    id: String(node.id),
    name,
    category: node.category as NounCategory,
    attribute_schema: parseAttributeSchema(node.attribute_schema),
    current_version:
      typeof node.current_version === 'number' ? node.current_version : Number(node.current_version),
    // Legacy records predating the field default by identity (foundational → stable, else → experimental).
    stability: asStability(node.stability) ?? defaultStabilityForType(name),
    is_seed: Boolean(node.is_seed),
    ...(typeof node.description === 'string' ? { description: node.description } : {}),
  }
}

function relationshipTypeFromNode(node: Record<string, unknown>): RelationshipType {
  const name = String(node.name)
  return {
    id: String(node.id),
    name,
    from: String(node.from),
    to: String(node.to),
    cardinality: node.cardinality as RelationshipType['cardinality'],
    attribute: String(node.attribute),
    current_version:
      typeof node.current_version === 'number' ? node.current_version : Number(node.current_version),
    stability: asStability(node.stability) ?? defaultStabilityForType(name),
    is_seed: Boolean(node.is_seed),
    ...(typeof node.inverse === 'string' ? { inverse: node.inverse } : {}),
    ...(typeof node.description === 'string' ? { description: node.description } : {}),
    ...(node.attribute_schema !== undefined
      ? { attribute_schema: parseAttributeSchema(node.attribute_schema) }
      : {}),
  }
}

function resourceTypeVersionFromNode(node: Record<string, unknown>): ResourceTypeVersion {
  return {
    id: String(node.id),
    resource_type_id: String(node.resource_type_id),
    version: typeof node.version === 'number' ? node.version : Number(node.version),
    attribute_schema: parseAttributeSchema(node.attribute_schema),
    // Version nodes carry no name; legacy snapshots without stability default to experimental.
    stability: asStability(node.stability) ?? 'experimental',
    created_at: String(node.created_at),
  }
}

function relationshipTypeVersionFromNode(node: Record<string, unknown>): RelationshipTypeVersion {
  return {
    id: String(node.id),
    relationship_type_id: String(node.relationship_type_id),
    version: typeof node.version === 'number' ? node.version : Number(node.version),
    attribute_schema: node.attribute_schema !== undefined
      ? parseAttributeSchema(node.attribute_schema)
      : undefined,
    stability: asStability(node.stability) ?? 'experimental',
    created_at: String(node.created_at),
  }
}

function parseAttributeSchema(raw: unknown): AttributeSchema {
  if (Array.isArray(raw)) return raw as AttributeSchema
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as AttributeSchema) : []
    } catch {
      return []
    }
  }
  return []
}

function serializeAttributeSchema(schema: AttributeSchema | undefined): string {
  return JSON.stringify(schema ?? [])
}

export function createClient(opts: Neo4jClientOptions, _dna?: OperationalDNA): Neo4jStore {
  // Constructor DNA is no longer used internally — seedFromDna takes it
  // explicitly. The positional argument stays for API compatibility with
  // older callers.
  const driver: Driver = neo4j.driver(
    opts.uri,
    neo4j.auth.basic(opts.username, opts.password),
    { disableLosslessIntegers: true },
  )

  function session(): Session {
    return opts.database ? driver.session({ database: opts.database }) : driver.session()
  }

  async function getResourceTypeByName(name: string): Promise<ResourceType | null> {
    const s = session()
    try {
      const result = await s.run(GET_RESOURCE_TYPE_BY_NAME_CYPHER, { name })
      if (result.records.length === 0) return null
      return resourceTypeFromNode(result.records[0].get('rt').properties)
    } finally {
      await s.close()
    }
  }

  async function getRelationshipTypeByName(name: string): Promise<RelationshipType | null> {
    const s = session()
    try {
      const result = await s.run(GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER, { name })
      if (result.records.length === 0) return null
      return relationshipTypeFromNode(result.records[0].get('rt').properties)
    } finally {
      await s.close()
    }
  }

  async function ensurePerTypeConstraints(label: string): Promise<void> {
    const s = session()
    try {
      for (const stmt of labelSchemaCypher(label)) {
        await s.run(stmt)
      }
    } finally {
      await s.close()
    }
  }

  async function dropPerTypeConstraints(label: string): Promise<void> {
    const s = session()
    try {
      for (const stmt of dropLabelSchemaCypher(label)) {
        await s.run(stmt)
      }
    } finally {
      await s.close()
    }
  }

  return {
    async migrate(): Promise<void> {
      const s = session()
      try {
        for (const stmt of METADATA_SCHEMA_CYPHER) {
          await s.run(stmt)
        }
      } finally {
        await s.close()
      }
    },

    async clear(): Promise<void> {
      const s = session()
      try {
        await s.run(CLEAR_GRAPH_CYPHER)
      } finally {
        await s.close()
      }
    },

    async seedFromDna(dna: OperationalDNA): Promise<SeedReport> {
      const report: SeedReport = {
        resourceTypesCreated: 0,
        resourceTypesSkipped: 0,
        relationshipTypesCreated: 0,
        relationshipTypesSkipped: 0,
      }

      // 1. Foundational types.
      for (const f of FOUNDATIONAL) {
        const existing = await getResourceTypeByName(f.name)
        if (existing) {
          report.resourceTypesSkipped += 1
          continue
        }
        await this.resourceType.create(
          { name: f.name, category: f.category, attribute_schema: [] },
          /* internal-seed flag passed via wrapper below */
        )
        // Re-fetch and mark as seed
        const fetched = await getResourceTypeByName(f.name)
        if (fetched) {
          const s = session()
          try {
            await s.run('MATCH (rt:ResourceType {id: $id}) SET rt.is_seed = true', { id: fetched.id })
          } finally {
            await s.close()
          }
        }
        report.resourceTypesCreated += 1
      }

      // 2. Tenant ResourceTypes from the document's top-level noun collections
      //    (home-edge model — nouns no longer live under `dna.domain`).
      for (const { key, category } of NOUN_KEYS) {
        const list = Array.isArray(dna[key])
          ? (dna[key] as Array<{ name?: unknown; attributes?: unknown; description?: unknown; stability?: unknown }>)
          : []
        for (const entry of list) {
          if (typeof entry?.name !== 'string') continue
          const existing = await getResourceTypeByName(entry.name)
          if (existing) {
            report.resourceTypesSkipped += 1
            continue
          }
          await this.resourceType.create({
            name: entry.name,
            category,
            attribute_schema: toAttributeSchema(entry.attributes),
            ...(asStability(entry.stability) ? { stability: asStability(entry.stability)! } : {}),
            ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
          })
          const fetched = await getResourceTypeByName(entry.name)
          if (fetched) {
            const s = session()
            try {
              await s.run('MATCH (rt:ResourceType {id: $id}) SET rt.is_seed = true', { id: fetched.id })
            } finally {
              await s.close()
            }
          }
          report.resourceTypesCreated += 1
        }
      }

      // 3. RelationshipTypes.
      const rels = Array.isArray(dna.relationships)
        ? (dna.relationships as Array<Record<string, unknown>>)
        : []
      for (const rel of rels) {
        if (
          typeof rel?.name !== 'string' ||
          typeof rel?.from !== 'string' ||
          typeof rel?.to !== 'string' ||
          typeof rel?.cardinality !== 'string' ||
          typeof rel?.attribute !== 'string'
        ) {
          continue
        }
        const existing = await getRelationshipTypeByName(rel.name)
        if (existing) {
          report.relationshipTypesSkipped += 1
          continue
        }
        await this.relationshipType.create({
          name: rel.name,
          from: rel.from,
          to: rel.to,
          cardinality: rel.cardinality as RelationshipType['cardinality'],
          attribute: rel.attribute,
          ...(typeof rel.inverse === 'string' ? { inverse: rel.inverse } : {}),
          ...(asStability(rel.stability) ? { stability: asStability(rel.stability)! } : {}),
        })
        const fetched = await getRelationshipTypeByName(rel.name)
        if (fetched) {
          const s = session()
          try {
            await s.run('MATCH (rt:RelationshipType {id: $id}) SET rt.is_seed = true', {
              id: fetched.id,
            })
          } finally {
            await s.close()
          }
        }
        report.relationshipTypesCreated += 1
      }

      // 4. Write seed marker with DNA hash for drift detection.
      const dnaHash = createHash('sha256').update(JSON.stringify(dna)).digest('hex')
      const s = session()
      try {
        await s.run(WRITE_SEED_MARKER_CYPHER, {
          createdAt: new Date().toISOString(),
          dnaHash,
        })
      } finally {
        await s.close()
      }

      return report
    },

    async hasBeenSeeded(): Promise<boolean> {
      const s = session()
      try {
        const result = await s.run(HAS_SEED_MARKER_CYPHER)
        return result.records.length > 0
      } finally {
        await s.close()
      }
    },

    resourceType: {
      async create(input: ResourceTypeInput): Promise<{ id: string }> {
        validateLabel(input.name)
        const id = input.id && input.id.length > 0 ? input.id : randomUUID()
        const now = new Date().toISOString()
        const stability = input.stability ?? defaultStabilityForType(input.name)
        const props: Record<string, unknown> = {
          id,
          name: input.name,
          category: input.category,
          attribute_schema: serializeAttributeSchema(input.attribute_schema),
          current_version: 1,
          stability,
          is_seed: false,
          created_at: now,
          ...(input.description !== undefined ? { description: input.description } : {}),
        }
        const s = session()
        try {
          await s.run(CREATE_RESOURCE_TYPE_CYPHER, { props })
          await s.run(CREATE_RESOURCE_TYPE_VERSION_CYPHER, {
            resourceTypeId: id,
            versionProps: {
              id: randomUUID(),
              resource_type_id: id,
              version: 1,
              attribute_schema: serializeAttributeSchema(input.attribute_schema),
              stability,
              created_at: now,
            },
          })
        } finally {
          await s.close()
        }
        await ensurePerTypeConstraints(input.name)
        return { id }
      },

      async get(id: string): Promise<ResourceType | null> {
        const s = session()
        try {
          const result = await s.run(GET_RESOURCE_TYPE_CYPHER, { id })
          if (result.records.length === 0) return null
          return resourceTypeFromNode(result.records[0].get('rt').properties)
        } finally {
          await s.close()
        }
      },

      async list(filter?: { category?: NounCategory }): Promise<ResourceType[]> {
        const s = session()
        try {
          const result = filter?.category
            ? await s.run(LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER, { category: filter.category })
            : await s.run(LIST_RESOURCE_TYPES_CYPHER)
          return result.records.map((rec) => resourceTypeFromNode(rec.get('rt').properties))
        } finally {
          await s.close()
        }
      },

      async update(id: string, patch: ResourceTypeUpdate): Promise<void> {
        const s = session()
        try {
          const current = await s.run(GET_RESOURCE_TYPE_CYPHER, { id })
          if (current.records.length === 0) {
            throw new Error(`integration/neo4j: ResourceType ${id} not found`)
          }
          const existing = resourceTypeFromNode(current.records[0].get('rt').properties)
          const newVersion = existing.current_version + 1
          const nextSchema = patch.attribute_schema ?? existing.attribute_schema
          const nextStability = patch.stability ?? existing.stability
          const updatePatch: Record<string, unknown> = {}
          if (patch.attribute_schema !== undefined) {
            updatePatch.attribute_schema = serializeAttributeSchema(patch.attribute_schema)
          }
          if (patch.stability !== undefined) {
            updatePatch.stability = patch.stability
          }
          if (patch.description !== undefined) {
            updatePatch.description = patch.description
          }
          await s.run(UPDATE_RESOURCE_TYPE_CYPHER, { id, patch: updatePatch, newVersion })
          await s.run(CREATE_RESOURCE_TYPE_VERSION_CYPHER, {
            resourceTypeId: id,
            versionProps: {
              id: randomUUID(),
              resource_type_id: id,
              version: newVersion,
              attribute_schema: serializeAttributeSchema(nextSchema),
              stability: nextStability,
              created_at: new Date().toISOString(),
            },
          })
        } finally {
          await s.close()
        }
      },

      async setStability(id: string, stability: Stability): Promise<void> {
        const s = session()
        try {
          const result = await s.run(SET_RESOURCE_TYPE_STABILITY_CYPHER, { id, stability })
          if (result.records.length === 0) {
            throw new Error(`integration/neo4j: ResourceType ${id} not found`)
          }
        } finally {
          await s.close()
        }
      },

      async delete(id: string, deleteOpts?: TypeDeleteOptions): Promise<void> {
        const s = session()
        let existingName: string | null = null
        try {
          const current = await s.run(GET_RESOURCE_TYPE_CYPHER, { id })
          if (current.records.length === 0) return
          const existing = resourceTypeFromNode(current.records[0].get('rt').properties)
          existingName = existing.name
          validateLabel(existing.name)
          const count = await s.run(COUNT_INSTANCES_OF_TYPE_CYPHER(existing.name))
          const inUse = Number(count.records[0]?.get('count') ?? 0)
          if (inUse > 0 && !deleteOpts?.cascade) {
            throw new TypeInUseError(existing.name, inUse)
          }
          if (inUse > 0 && deleteOpts?.cascade) {
            await s.run(`MATCH (n:${existing.name}) DETACH DELETE n`)
          }
          await s.run(DELETE_RESOURCE_TYPE_CYPHER, { id })
        } finally {
          await s.close()
        }
        if (existingName) {
          await dropPerTypeConstraints(existingName)
        }
      },

      async versions(id: string): Promise<ResourceTypeVersion[]> {
        const s = session()
        try {
          const result = await s.run(LIST_RESOURCE_TYPE_VERSIONS_CYPHER, { id })
          return result.records.map((rec) => resourceTypeVersionFromNode(rec.get('v').properties))
        } finally {
          await s.close()
        }
      },
    },

    relationshipType: {
      async create(input: RelationshipTypeInput): Promise<{ id: string }> {
        const id = input.id && input.id.length > 0 ? input.id : randomUUID()
        const now = new Date().toISOString()
        const stability = input.stability ?? defaultStabilityForType(input.name)
        const props: Record<string, unknown> = {
          id,
          name: input.name,
          from: input.from,
          to: input.to,
          cardinality: input.cardinality,
          attribute: input.attribute,
          current_version: 1,
          stability,
          is_seed: false,
          created_at: now,
          ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
          ...(input.attribute_schema !== undefined
            ? { attribute_schema: serializeAttributeSchema(input.attribute_schema) }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        }
        const s = session()
        try {
          await s.run(CREATE_RELATIONSHIP_TYPE_CYPHER, { props })
          await s.run(CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER, {
            relationshipTypeId: id,
            versionProps: {
              id: randomUUID(),
              relationship_type_id: id,
              version: 1,
              attribute_schema: serializeAttributeSchema(input.attribute_schema),
              stability,
              created_at: now,
            },
          })
        } finally {
          await s.close()
        }
        return { id }
      },

      async get(id: string): Promise<RelationshipType | null> {
        const s = session()
        try {
          const result = await s.run(GET_RELATIONSHIP_TYPE_CYPHER, { id })
          if (result.records.length === 0) return null
          return relationshipTypeFromNode(result.records[0].get('rt').properties)
        } finally {
          await s.close()
        }
      },

      async list(): Promise<RelationshipType[]> {
        const s = session()
        try {
          const result = await s.run(LIST_RELATIONSHIP_TYPES_CYPHER)
          return result.records.map((rec) => relationshipTypeFromNode(rec.get('rt').properties))
        } finally {
          await s.close()
        }
      },

      async update(id: string, patch: RelationshipTypeUpdate): Promise<void> {
        const s = session()
        try {
          const current = await s.run(GET_RELATIONSHIP_TYPE_CYPHER, { id })
          if (current.records.length === 0) {
            throw new Error(`integration/neo4j: RelationshipType ${id} not found`)
          }
          const existing = relationshipTypeFromNode(current.records[0].get('rt').properties)
          const newVersion = existing.current_version + 1
          const nextSchema = patch.attribute_schema ?? existing.attribute_schema ?? []
          const nextStability = patch.stability ?? existing.stability
          const updatePatch: Record<string, unknown> = {}
          if (patch.cardinality !== undefined) updatePatch.cardinality = patch.cardinality
          if (patch.attribute !== undefined) updatePatch.attribute = patch.attribute
          if (patch.inverse !== undefined) updatePatch.inverse = patch.inverse
          if (patch.attribute_schema !== undefined) {
            updatePatch.attribute_schema = serializeAttributeSchema(patch.attribute_schema)
          }
          if (patch.stability !== undefined) updatePatch.stability = patch.stability
          if (patch.description !== undefined) updatePatch.description = patch.description
          await s.run(UPDATE_RELATIONSHIP_TYPE_CYPHER, { id, patch: updatePatch, newVersion })
          await s.run(CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER, {
            relationshipTypeId: id,
            versionProps: {
              id: randomUUID(),
              relationship_type_id: id,
              version: newVersion,
              attribute_schema: serializeAttributeSchema(nextSchema),
              stability: nextStability,
              created_at: new Date().toISOString(),
            },
          })
        } finally {
          await s.close()
        }
      },

      async setStability(id: string, stability: Stability): Promise<void> {
        const s = session()
        try {
          const result = await s.run(SET_RELATIONSHIP_TYPE_STABILITY_CYPHER, { id, stability })
          if (result.records.length === 0) {
            throw new Error(`integration/neo4j: RelationshipType ${id} not found`)
          }
        } finally {
          await s.close()
        }
      },

      async delete(id: string, deleteOpts?: TypeDeleteOptions): Promise<void> {
        const s = session()
        try {
          const current = await s.run(GET_RELATIONSHIP_TYPE_CYPHER, { id })
          if (current.records.length === 0) return
          const existing = relationshipTypeFromNode(current.records[0].get('rt').properties)
          const countResult = await s.run(COUNT_LINKS_OF_ROLE_CYPHER, { role: existing.name })
          const inUse = Number(countResult.records[0]?.get('count') ?? 0)
          if (inUse > 0 && !deleteOpts?.cascade) {
            throw new TypeInUseError(existing.name, inUse)
          }
          if (inUse > 0 && deleteOpts?.cascade) {
            await s.run(DELETE_LINKS_OF_ROLE_CYPHER, { role: existing.name })
          }
          await s.run(DELETE_RELATIONSHIP_TYPE_CYPHER, { id })
        } finally {
          await s.close()
        }
      },

      async versions(id: string): Promise<RelationshipTypeVersion[]> {
        const s = session()
        try {
          const result = await s.run(LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER, { id })
          return result.records.map((rec) => relationshipTypeVersionFromNode(rec.get('v').properties))
        } finally {
          await s.close()
        }
      },
    },

    instance: {
      async create(typeName: string, data: InstanceCreateInput): Promise<{ id: string }> {
        validateLabel(typeName)
        const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : randomUUID()
        const now = new Date().toISOString()
        const rt = await getResourceTypeByName(typeName)
        const schemaVersion = rt?.current_version
        const props = {
          ...nodePropsFor(id, data, now, schemaVersion),
          _typeName: typeName,
        }
        const s = session()
        try {
          await s.run(createInstanceCypher(typeName), { props })
          return { id }
        } catch (err) {
          const code = (err as { code?: string }).code
          if (code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw new Error(`integration/neo4j: ${typeName} instance with id "${id}" already exists`)
          }
          throw err
        } finally {
          await s.close()
        }
      },

      async get(typeName: string, id: string): Promise<InstanceRecord | null> {
        validateLabel(typeName)
        const s = session()
        try {
          const result = await s.run(getInstanceCypher(typeName), { id })
          if (result.records.length === 0) return null
          const node = result.records[0].get('n')
          return stripReservedAndId(node.properties)
        } finally {
          await s.close()
        }
      },

      async update(typeName: string, id: string, patch: Record<string, unknown>): Promise<void> {
        validateLabel(typeName)
        const { id: _id, _schemaVersion: _v, ...rest } = patch
        void _id
        void _v
        const rt = await getResourceTypeByName(typeName)
        const schemaVersion = rt?.current_version
        const fullPatch: Record<string, unknown> = {
          ...rest,
          ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
        }
        const s = session()
        try {
          const result = await s.run(updateInstanceCypher(typeName), {
            id,
            patch: fullPatch,
            updatedAt: new Date().toISOString(),
          })
          if (result.records.length === 0) {
            throw new Error(`integration/neo4j: ${typeName} instance with id "${id}" not found`)
          }
        } finally {
          await s.close()
        }
      },

      async delete(typeName: string, id: string): Promise<void> {
        validateLabel(typeName)
        const s = session()
        try {
          await s.run(deleteInstanceCypher(typeName), { id })
        } finally {
          await s.close()
        }
      },

      async list(typeName: string): Promise<InstanceRecord[]> {
        validateLabel(typeName)
        const s = session()
        try {
          const result = await s.run(listInstanceCypher(typeName))
          return result.records.map((rec) => stripReservedAndId(rec.get('n').properties))
        } finally {
          await s.close()
        }
      },
    },

    link: {
      async create(
        from: InstanceRef,
        to: InstanceRef,
        linkOpts: LinkCreateOptions = {},
      ): Promise<{ id: string }> {
        validateLabel(from.typeName)
        validateLabel(to.typeName)
        const id =
          typeof linkOpts.id === 'string' && linkOpts.id.length > 0 ? linkOpts.id : randomUUID()
        const rrt =
          linkOpts.role !== undefined ? await getRelationshipTypeByName(linkOpts.role) : null
        const schemaVersion = rrt?.current_version
        const props: Record<string, unknown> = {
          _id: id,
          createdAt: new Date().toISOString(),
          ...(linkOpts.role !== undefined ? { role: linkOpts.role } : {}),
          ...(linkOpts.attributes !== undefined
            ? { attributes: JSON.stringify(linkOpts.attributes) }
            : {}),
          ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
        }
        const s = session()
        try {
          const result = await s.run(createLinkCypher(from.typeName, to.typeName), {
            fromId: from.id,
            toId: to.id,
            props,
          })
          if (result.records.length === 0) {
            throw new Error(
              `integration/neo4j: cannot create link — ${from.typeName} "${from.id}" or ${to.typeName} "${to.id}" not found`,
            )
          }
          return { id }
        } catch (err) {
          const code = (err as { code?: string }).code
          if (code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
            throw new Error(`integration/neo4j: link with id "${id}" already exists`)
          }
          throw err
        } finally {
          await s.close()
        }
      },

      async delete(linkId: string): Promise<void> {
        const s = session()
        try {
          await s.run(DELETE_LINK_CYPHER, { linkId })
        } finally {
          await s.close()
        }
      },

      async list(filter: LinkListFilter = {}): Promise<LinkRecord[]> {
        const { cypher, params } = buildLinkListCypher(filter)
        const s = session()
        try {
          const result = await s.run(cypher, params)
          return result.records.map((rec) => {
            const r = rec.get('r')
            const fromLabels = rec.get('fromLabels') as string[]
            const toLabels = rec.get('toLabels') as string[]
            const fromId = String(rec.get('fromId'))
            const toId = String(rec.get('toId'))
            const props = r.properties as Record<string, unknown>
            const out: LinkRecord = {
              id: String(props._id),
              from: { typeName: pickPrimitiveLabel(fromLabels), id: fromId },
              to: { typeName: pickPrimitiveLabel(toLabels), id: toId },
            }
            if (typeof props.role === 'string') out.role = props.role
            if (typeof props.attributes === 'string') {
              try {
                out.attributes = JSON.parse(props.attributes) as Record<string, unknown>
              } catch {
                out.attributes = { raw: props.attributes }
              }
            }
            if (typeof props._schemaVersion === 'number') {
              out._schemaVersion = props._schemaVersion
            } else if (typeof props._schemaVersion === 'string') {
              out._schemaVersion = Number(props._schemaVersion)
            }
            return out
          })
        } finally {
          await s.close()
        }
      },
    },

    async close(): Promise<void> {
      await driver.close()
    },
  }
}

/**
 * Pick the noun-primitive label from a node's label list. Neo4j returns
 * all labels on a node; for Instance nodes there should be exactly one
 * meaningful label (the typeName).
 */
function pickPrimitiveLabel(labels: string[]): string {
  for (const label of labels) {
    if (label && label !== 'ResourceType' && label !== 'RelationshipType' && label !== 'SeedMarker') {
      return label
    }
  }
  return labels[0] ?? ''
}
