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

import { randomUUID } from 'crypto'

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

interface NounPrimitive {
  name?: unknown
  attributes?: unknown
}

interface RelationshipPrimitive {
  name?: unknown
  from?: unknown
  to?: unknown
  cardinality?: unknown
  attribute?: unknown
  inverse?: unknown
}

interface TypeDefinitionRecord {
  name: string
  category: 'resource' | 'person' | 'role' | 'group'
  attributes: unknown[]
}

interface RelationshipDefRecord {
  name: string
  from: string
  to: string
  cardinality: string
  attribute: string
  inverse?: string
}

interface LinkInternal extends LinkRecord {}

const NOUN_KEYS: Array<{ key: 'resources' | 'persons' | 'roles' | 'groups'; category: TypeDefinitionRecord['category'] }> = [
  { key: 'resources', category: 'resource' },
  { key: 'persons', category: 'person' },
  { key: 'roles', category: 'role' },
  { key: 'groups', category: 'group' },
]

export function createClient(dna: OperationalDNA): DnaDataStore {
  const instances = new Map<string, Map<string, Record<string, unknown>>>()
  const links: LinkInternal[] = []
  const typeDefs = new Map<string, TypeDefinitionRecord>()
  const relationshipDefs = new Map<string, RelationshipDefRecord>()

  function bucket(typeName: string): Map<string, Record<string, unknown>> {
    let b = instances.get(typeName)
    if (!b) {
      b = new Map()
      instances.set(typeName, b)
    }
    return b
  }

  function refEquals(a: InstanceRef, b: InstanceRef): boolean {
    return a.typeName === b.typeName && a.id === b.id
  }

  return {
    async migrate(): Promise<void> {
      typeDefs.clear()
      relationshipDefs.clear()

      const domain = dna.domain ?? {}
      for (const { key, category } of NOUN_KEYS) {
        const list = Array.isArray(domain[key]) ? (domain[key] as NounPrimitive[]) : []
        for (const entry of list) {
          if (typeof entry?.name !== 'string') continue
          typeDefs.set(entry.name, {
            name: entry.name,
            category,
            attributes: Array.isArray(entry.attributes) ? entry.attributes : [],
          })
        }
      }

      const rels = Array.isArray(dna.relationships) ? (dna.relationships as RelationshipPrimitive[]) : []
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
        const record: RelationshipDefRecord = {
          name: rel.name,
          from: rel.from,
          to: rel.to,
          cardinality: rel.cardinality,
          attribute: rel.attribute,
          ...(typeof rel.inverse === 'string' ? { inverse: rel.inverse } : {}),
        }
        relationshipDefs.set(record.name, record)
      }
    },

    instance: {
      async create(typeName: string, data: InstanceCreateInput): Promise<{ id: string }> {
        const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : randomUUID()
        const b = bucket(typeName)
        if (b.has(id)) {
          throw new Error(`integration/memory: ${typeName} instance with id "${id}" already exists`)
        }
        // Strip `id` from the payload — it's a control field, not a stored attribute.
        const { id: _stripped, ...rest } = data
        void _stripped
        b.set(id, { ...rest })
        return { id }
      },

      async get(typeName: string, id: string): Promise<InstanceRecord | null> {
        const record = bucket(typeName).get(id)
        if (!record) return null
        return { id, ...record }
      },

      async update(typeName: string, id: string, patch: Record<string, unknown>): Promise<void> {
        const b = bucket(typeName)
        const existing = b.get(id)
        if (!existing) {
          throw new Error(`integration/memory: ${typeName} instance with id "${id}" not found`)
        }
        // Strip `id` from patch — IDs are immutable.
        const { id: _stripped, ...rest } = patch
        void _stripped
        b.set(id, { ...existing, ...rest })
      },

      async delete(typeName: string, id: string): Promise<void> {
        bucket(typeName).delete(id)
      },

      async list(typeName: string): Promise<InstanceRecord[]> {
        const b = bucket(typeName)
        return [...b.entries()].map(([id, data]) => ({ id, ...data }))
      },
    },

    link: {
      async create(
        from: InstanceRef,
        to: InstanceRef,
        opts: LinkCreateOptions = {},
      ): Promise<{ id: string }> {
        const id = typeof opts.id === 'string' && opts.id.length > 0 ? opts.id : randomUUID()
        if (links.some((l) => l.id === id)) {
          throw new Error(`integration/memory: link with id "${id}" already exists`)
        }
        const record: LinkInternal = {
          id,
          from: { ...from },
          to: { ...to },
          ...(opts.role !== undefined ? { role: opts.role } : {}),
          ...(opts.attributes !== undefined ? { attributes: { ...opts.attributes } } : {}),
        }
        links.push(record)
        return { id }
      },

      async delete(linkId: string): Promise<void> {
        const idx = links.findIndex((l) => l.id === linkId)
        if (idx >= 0) links.splice(idx, 1)
      },

      async list(filter: LinkListFilter = {}): Promise<LinkRecord[]> {
        return links
          .filter((l) => (filter.from ? refEquals(l.from, filter.from) : true))
          .filter((l) => (filter.to ? refEquals(l.to, filter.to) : true))
          .filter((l) => (filter.role !== undefined ? l.role === filter.role : true))
          .map((l) => ({
            id: l.id,
            from: { ...l.from },
            to: { ...l.to },
            ...(l.role !== undefined ? { role: l.role } : {}),
            ...(l.attributes !== undefined ? { attributes: { ...l.attributes } } : {}),
          }))
      },
    },

    async close(): Promise<void> {
      // no-op
    },
  }
}
