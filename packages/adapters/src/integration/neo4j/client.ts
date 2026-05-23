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

import { randomUUID } from 'crypto'

import neo4j, { Driver, Session } from 'neo4j-driver'

import type {
  DnaDataStore,
  InstanceCreateInput,
  InstanceRecord,
  InstanceRef,
  LinkCreateOptions,
  LinkListFilter,
  LinkRecord,
  OperationalDNA,
} from '@dna-codes/dna-core'

import {
  buildLinkListCypher,
  createInstanceCypher,
  createLinkCypher,
  DELETE_LINK_CYPHER,
  deleteInstanceCypher,
  getInstanceCypher,
  labelSchemaCypher,
  listInstanceCypher,
  MERGE_RELDEF_CYPHER,
  MERGE_TYPEDEF_CYPHER,
  METADATA_SCHEMA_CYPHER,
  updateInstanceCypher,
  validateLabel,
} from './cypher'
import type { Neo4jClientOptions } from './types'

const NOUN_KEYS: Array<{
  key: 'resources' | 'persons' | 'roles' | 'groups'
  category: 'resource' | 'person' | 'role' | 'group'
}> = [
  { key: 'resources', category: 'resource' },
  { key: 'persons', category: 'person' },
  { key: 'roles', category: 'role' },
  { key: 'groups', category: 'group' },
]

const RESERVED_PROPS = new Set(['_id', '_typeName', '_createdAt', '_updatedAt'])

function nounLabels(dna: OperationalDNA): string[] {
  const labels: string[] = []
  const domain = dna.domain ?? {}
  for (const { key } of NOUN_KEYS) {
    const list = Array.isArray(domain[key]) ? (domain[key] as Array<{ name?: unknown }>) : []
    for (const entry of list) {
      if (typeof entry?.name === 'string') labels.push(entry.name)
    }
  }
  // De-dupe while preserving order; future-proof against the DNA listing
  // the same name twice in different categories (which is itself invalid
  // but should not crash this loop).
  return [...new Set(labels)]
}

function stripReservedAndId(node: Record<string, unknown>): InstanceRecord {
  const id = String(node._id)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(node)) {
    if (!RESERVED_PROPS.has(k)) out[k] = v
  }
  return { id, ...out }
}

function nodePropsFor(id: string, data: InstanceCreateInput, now: string): Record<string, unknown> {
  // Strip `id` from caller-payload; we set it as `_id` separately.
  const { id: _stripped, ...rest } = data
  void _stripped
  const props: Record<string, unknown> = {
    _id: id,
    _createdAt: now,
    _updatedAt: now,
    ...rest,
  }
  return props
}

export function createClient(opts: Neo4jClientOptions, dna: OperationalDNA): DnaDataStore {
  const driver: Driver = neo4j.driver(
    opts.uri,
    neo4j.auth.basic(opts.username, opts.password),
    { disableLosslessIntegers: true },
  )

  function session(): Session {
    return opts.database ? driver.session({ database: opts.database }) : driver.session()
  }

  return {
    async migrate(): Promise<void> {
      const labels = nounLabels(dna)
      const s = session()
      try {
        for (const stmt of METADATA_SCHEMA_CYPHER) {
          await s.run(stmt)
        }
        for (const label of labels) {
          for (const stmt of labelSchemaCypher(label)) {
            await s.run(stmt)
          }
        }
        // Seed TypeDefinition nodes.
        const now = new Date().toISOString()
        const domain = dna.domain ?? {}
        for (const { key, category } of NOUN_KEYS) {
          const list = Array.isArray(domain[key]) ? (domain[key] as Array<Record<string, unknown>>) : []
          for (const entry of list) {
            if (typeof entry?.name !== 'string') continue
            const attributes = Array.isArray(entry.attributes) ? entry.attributes : []
            await s.run(MERGE_TYPEDEF_CYPHER, {
              name: entry.name,
              props: {
                name: entry.name,
                category,
                attributes: JSON.stringify(attributes),
                createdAt: now,
              },
            })
          }
        }
        // Seed RelationshipDef nodes.
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
          const props: Record<string, unknown> = {
            name: rel.name,
            from: rel.from,
            to: rel.to,
            cardinality: rel.cardinality,
            attribute: rel.attribute,
            createdAt: now,
          }
          if (typeof rel.inverse === 'string') props.inverse = rel.inverse
          await s.run(MERGE_RELDEF_CYPHER, { name: rel.name, props })
        }
      } finally {
        await s.close()
      }
    },

    instance: {
      async create(typeName: string, data: InstanceCreateInput): Promise<{ id: string }> {
        validateLabel(typeName)
        const id =
          typeof data.id === 'string' && data.id.length > 0 ? data.id : randomUUID()
        const now = new Date().toISOString()
        const props = { ...nodePropsFor(id, data, now), _typeName: typeName }
        const s = session()
        try {
          await s.run(createInstanceCypher(typeName), { props })
          return { id }
        } catch (err) {
          // Neo4j unique-constraint violation surfaces as a code we can match.
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
        // Strip `id` from patch — IDs are immutable.
        const { id: _stripped, ...rest } = patch
        void _stripped
        const s = session()
        try {
          const result = await s.run(updateInstanceCypher(typeName), {
            id,
            patch: rest,
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
        const props: Record<string, unknown> = {
          _id: id,
          createdAt: new Date().toISOString(),
        }
        if (linkOpts.role !== undefined) props.role = linkOpts.role
        if (linkOpts.attributes !== undefined) props.attributes = JSON.stringify(linkOpts.attributes)

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
                // If a caller stored a non-JSON string as attributes via raw
                // Cypher, surface it as-is rather than throwing.
                out.attributes = { raw: props.attributes }
              }
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
 * meaningful label (the typeName). If multiple, pick the first non-empty.
 */
function pickPrimitiveLabel(labels: string[]): string {
  for (const label of labels) {
    if (label && label !== 'TypeDefinition' && label !== 'RelationshipDef') return label
  }
  return labels[0] ?? ''
}
