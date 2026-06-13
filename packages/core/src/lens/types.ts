/**
 * Canonical lens-definition and lens-result types.
 *
 * A lens definition is declarative JSON (`packages/core/lenses/*.json`) validated
 * against the `meta/lens` JSON Schema. The {@link evaluateLens} runtime turns a
 * definition + a `DnaDataStore` into a matched subgraph (data lens) or type-graph
 * slice (schema lens). These types are a backward-compatible superset of the
 * original `{ $id, name, nodes, edges?, sentence? }` shape — every new field is
 * optional and `target` defaults to `'data'`, so existing all-free lens files
 * validate and load unchanged.
 */

import type { InstanceRecord, LinkRecord, ResourceType, RelationshipType } from '../types/data-store'

/** Whether a lens reads the instance graph (`data`) or the type graph (`schema`). */
export type LensTarget = 'schema' | 'data'

/**
 * A pinned binding: either a concrete instance id, or a predicate that selects
 * anchors at evaluation time (keeping a grouping tenant-portable, not id-coupled).
 */
export type LensRef =
  | { id: string }
  | { select: { name?: string; pathPrefix?: string; attribute?: { name: string; value: unknown } } }

/** A slot binds a name to a node type; an optional `ref` pins it (data lenses only). */
export type LensNodeSlot = {
  slot?: string
  type: string
  /** Present iff the slot is pinned. Only valid on `target: 'data'` lenses. */
  ref?: LensRef
}

/** A free edge: links of relationship type `via` between the `from` and `to` slots. */
export type LensEdge = {
  from: string
  to: string
  via: string
}

/** How a grouping expands from a pinned anchor slot. */
export type LensScope = {
  /** The name of a pinned slot this scope expands from. */
  from: string
  /** Relationship type names to traverse. */
  via: string[]
  direction: 'out' | 'in' | 'both'
  /** A fixed hop count, or `'transitive'` for unbounded (cycle-safe) expansion. */
  depth: number | 'transitive'
  /** When present, only nodes of these types are returned as members. */
  nodeTypes?: string[]
}

export type LensDefinition = {
  $id: string
  name: string
  /** Defaults to `'data'` when omitted. */
  target?: LensTarget
  nodes: LensNodeSlot[]
  edges?: LensEdge[]
  scope?: LensScope[]
  sentence?: string
  [key: string]: unknown
}

/** Result of a `target: 'data'` lens — an instance subgraph. */
export interface LensDataResult {
  nodes: InstanceRecord[]
  links: LinkRecord[]
}

/** Result of a `target: 'schema'` lens — a slice of the type graph. */
export interface LensSchemaResult {
  resourceTypes: ResourceType[]
  relationshipTypes: RelationshipType[]
}

export type LensResult = LensDataResult | LensSchemaResult

export function isSchemaResult(r: LensResult): r is LensSchemaResult {
  return (r as LensSchemaResult).resourceTypes !== undefined
}
