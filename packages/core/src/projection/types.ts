/**
 * Types for the business→product projection. A projection takes an evaluated
 * business subgraph and derives the product (UI + API) nodes the business
 * implies, with stable identity and a `planned` state where the business graph
 * is incomplete. Pure data — persistence is a separate (deferred) concern.
 */

export type ProductLevel =
  | 'app'
  | 'module'
  | 'workflow'
  | 'page'
  | 'section'
  | 'component'
  | 'namespace'
  | 'endpoint'

export interface ProductNode {
  /** Stable identity: derived from (realizes, level, parent). */
  key: string
  level: ProductLevel
  name: string
  /** The id of the business node this product node surfaces. */
  realizes: string
  /** The key of the containing product node, if any. */
  parentKey?: string
  /** True when the node's forward business backing is missing. Derived, never authored. */
  planned: boolean
}

export interface ProductEdge {
  from: string
  to: string
  via: 'contains' | 'realized_as' | 'exposes'
}

export interface ProductSubgraph {
  nodes: ProductNode[]
  edges: ProductEdge[]
}

export interface ProjectOptions {
  /** Per business-node-id override of the product level (else the type default applies). */
  levelOverrides?: Record<string, ProductLevel>
}
