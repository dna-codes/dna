/**
 * Tests for the runtime lens evaluator and lens-definition validation, using a
 * lightweight in-memory DnaDataStore fake (core cannot depend on the adapters
 * package — that would be circular).
 */

import type { DnaDataStore, InstanceRecord, LinkRecord, InstanceRef, ResourceType, RelationshipType } from '../types/data-store'
import type { LensDefinition, LensDataResult, LensSchemaResult } from './types'
import { evaluateLens } from './evaluate'
import { validateLensDefinition } from './validate-def'
import { lenses } from '../index'

// ── In-memory store fake ────────────────────────────────────────────────────
class FakeStore {
  private instances = new Map<string, InstanceRecord[]>()
  private links: LinkRecord[] = []
  private rts: ResourceType[] = []
  private rels: RelationshipType[] = []
  private linkSeq = 0

  addType(name: string): this {
    this.rts.push({ id: `rt-${name}`, name, category: 'resource', attribute_schema: [], current_version: 1, stability: 'stable', is_seed: false })
    return this
  }
  addRelType(name: string, from: string, to: string): this {
    this.rels.push({ id: `rel-${name}`, name, from, to, cardinality: 'many-to-many', current_version: 1, stability: 'stable', is_seed: false } as RelationshipType)
    return this
  }
  addInstance(typeName: string, rec: InstanceRecord): this {
    const list = this.instances.get(typeName) ?? []
    list.push(rec)
    this.instances.set(typeName, list)
    return this
  }
  addLink(from: InstanceRef, to: InstanceRef, role: string): this {
    this.links.push({ id: `lk-${this.linkSeq++}`, from, to, role })
    return this
  }

  get store(): DnaDataStore {
    const self = this
    return {
      instance: {
        list: async (tn: string) => self.instances.get(tn) ?? [],
        get: async (tn: string, id: string) => (self.instances.get(tn) ?? []).find(r => r.id === id) ?? null,
      },
      link: {
        list: async (filter?: { from?: InstanceRef; to?: InstanceRef; role?: string }) =>
          self.links.filter(l =>
            (!filter?.from || (l.from.typeName === filter.from.typeName && l.from.id === filter.from.id)) &&
            (!filter?.to || (l.to.typeName === filter.to.typeName && l.to.id === filter.to.id)) &&
            (!filter?.role || l.role === filter.role),
          ),
      },
      resourceType: { list: async () => self.rts },
      relationshipType: { list: async () => self.rels },
    } as unknown as DnaDataStore
  }
}

// Graph: CEO ← CTO ← {Eng1, Eng2} via reports_to (from=subordinate, to=manager).
// Alice (person) fills CEO.
function orgStore(): DnaDataStore {
  const f = new FakeStore()
    .addType('position').addType('person')
    .addRelType('reports_to', 'position', 'position').addRelType('fills', 'person', 'position')
  f.addInstance('position', { id: 'p1', name: 'CEO' })
    .addInstance('position', { id: 'p2', name: 'CTO' })
    .addInstance('position', { id: 'p3', name: 'Eng1' })
    .addInstance('position', { id: 'p4', name: 'Eng2' })
    .addInstance('person', { id: 'a1', name: 'Alice' })
  f.addLink({ typeName: 'position', id: 'p2' }, { typeName: 'position', id: 'p1' }, 'reports_to')
   .addLink({ typeName: 'position', id: 'p3' }, { typeName: 'position', id: 'p2' }, 'reports_to')
   .addLink({ typeName: 'position', id: 'p4' }, { typeName: 'position', id: 'p2' }, 'reports_to')
   .addLink({ typeName: 'person', id: 'a1' }, { typeName: 'position', id: 'p1' }, 'fills')
  return f.store
}

const ids = (r: LensDataResult) => r.nodes.map(n => n.id).sort()

describe('evaluateLens — data lens', () => {
  it('free-only lens matches every instance of the slot types and declared edges', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'positions', target: 'data',
      nodes: [{ slot: 'position', type: 'position' }],
      edges: [{ from: 'position', to: 'position', via: 'reports_to' }],
    }
    const r = await evaluateLens(def, orgStore()) as LensDataResult
    expect(ids(r)).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(r.links).toHaveLength(3)
    expect(r.links.every(l => l.role === 'reports_to')).toBe(true)
  })

  it('pinned anchor by id seeds and scope expands transitively', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'chain', target: 'data',
      nodes: [{ slot: 'anchor', type: 'position', ref: { id: 'p1' } }],
      scope: [{ from: 'anchor', via: ['reports_to'], direction: 'in', depth: 'transitive' }],
    }
    const r = await evaluateLens(def, orgStore()) as LensDataResult
    expect(ids(r)).toEqual(['p1', 'p2', 'p3', 'p4'])
  })

  it('pinned anchor by select resolves without an id dependency', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'chain', target: 'data',
      nodes: [{ slot: 'anchor', type: 'position', ref: { select: { name: 'CEO' } } }],
      scope: [{ from: 'anchor', via: ['reports_to'], direction: 'in', depth: 'transitive' }],
    }
    const r = await evaluateLens(def, orgStore()) as LensDataResult
    expect(ids(r)).toContain('p1')
    expect(ids(r)).toEqual(['p1', 'p2', 'p3', 'p4'])
  })

  it('depth limits expansion', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'chain', target: 'data',
      nodes: [{ slot: 'anchor', type: 'position', ref: { id: 'p1' } }],
      scope: [{ from: 'anchor', via: ['reports_to'], direction: 'in', depth: 1 }],
    }
    const r = await evaluateLens(def, orgStore()) as LensDataResult
    expect(ids(r)).toEqual(['p1', 'p2']) // CEO + direct report CTO only
  })

  it('nodeTypes filters membership but still traverses through', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'chain', target: 'data',
      nodes: [{ slot: 'anchor', type: 'position', ref: { id: 'p1' } }],
      scope: [{ from: 'anchor', via: ['reports_to', 'fills'], direction: 'in', depth: 'transitive', nodeTypes: ['position'] }],
    }
    const r = await evaluateLens(def, orgStore()) as LensDataResult
    // Alice (person, a1) is reached via fills but excluded by nodeTypes.
    expect(ids(r)).toEqual(['p1', 'p2', 'p3', 'p4'])
  })

  it('terminates on cycles, each node once', async () => {
    const f = new FakeStore().addType('position').addRelType('reports_to', 'position', 'position')
    f.addInstance('position', { id: 'p1', name: 'A' }).addInstance('position', { id: 'p2', name: 'B' })
    f.addLink({ typeName: 'position', id: 'p1' }, { typeName: 'position', id: 'p2' }, 'reports_to')
     .addLink({ typeName: 'position', id: 'p2' }, { typeName: 'position', id: 'p1' }, 'reports_to')
    const def: LensDefinition = {
      $id: 'x', name: 'cyc', target: 'data',
      nodes: [{ slot: 'anchor', type: 'position', ref: { id: 'p1' } }],
      scope: [{ from: 'anchor', via: ['reports_to'], direction: 'both', depth: 'transitive' }],
    }
    const r = await evaluateLens(def, f.store) as LensDataResult
    expect(ids(r)).toEqual(['p1', 'p2'])
  })
})

describe('evaluateLens — schema lens', () => {
  it('returns the matched type graph', async () => {
    const def: LensDefinition = {
      $id: 'x', name: 'schema', target: 'schema',
      nodes: [{ slot: 'position', type: 'position' }],
      edges: [{ from: 'position', to: 'position', via: 'reports_to' }],
    }
    const r = await evaluateLens(def, orgStore()) as LensSchemaResult
    expect(r.resourceTypes.map(t => t.name)).toEqual(['position'])
    expect(r.relationshipTypes.map(t => t.name)).toEqual(['reports_to'])
  })
})

describe('validateLensDefinition', () => {
  it('accepts a valid free data lens', () => {
    const r = validateLensDefinition({ $id: 'x', name: 'ok', nodes: [{ slot: 'p', type: 'position' }] })
    expect(r.valid).toBe(true)
  })

  it('rejects pinning on a schema lens', () => {
    const r = validateLensDefinition({
      $id: 'x', name: 'bad', target: 'schema',
      nodes: [{ slot: 'a', type: 'position', ref: { id: 'p1' } }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/pinned/)
  })

  it('rejects a scope.from that is not a pinned slot', () => {
    const r = validateLensDefinition({
      $id: 'x', name: 'bad', target: 'data',
      nodes: [{ slot: 'free', type: 'position' }],
      scope: [{ from: 'free', via: ['reports_to'], direction: 'in', depth: 'transitive' }],
    })
    expect(r.valid).toBe(false)
    expect(r.errors.join(' ')).toMatch(/does not reference a pinned slot/)
  })
})

describe('existing lens definitions remain valid', () => {
  it('every bundled lens validates as a (default data) lens', () => {
    for (const lens of Object.values(lenses)) {
      const r = validateLensDefinition(lens as unknown as LensDefinition)
      expect({ name: (lens as { name: string }).name, ...r }).toMatchObject({ valid: true })
    }
  })
})
