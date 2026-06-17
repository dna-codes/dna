/**
 * Product-app-preview lens — the Operate-mode view of the Product-UI graph.
 *
 * Two render paths, picked automatically:
 *
 *   1. **Materialized** (authored) — when the store holds product instances
 *      (`App`/`Module`/`Workflow`/`Page`/`Section`/`Component`), the tree is read
 *      directly from those instances and their `contains` edges. Components
 *      expose their UI `type`, Pages their `layout`, and a Component's `resource`
 *      binding drives the page's record table.
 *   2. **Derived** (fallback) — when nothing is materialized, the pure
 *      business→product projection (`project`) is run to produce the
 *      `App → Module → Page` tree, exactly as before.
 *
 * Either way the two-grain gate inputs are returned: a coarse access snapshot
 * (`grants` from `can_access` edges + `contains`), the operations each surface
 * exposes (`surfaceOperations`), and the access-rule allow-entries for the fine
 * `<Operation>` gate (`operationAllows`). Read-only: building the view model
 * never creates, updates, or deletes any instance or link.
 */

import type {
  DnaDataStore,
  InstanceRef,
  LensDataResult,
  ProductLevel,
  ProductNode,
} from '@dna-codes/dna-core'
import { project, PRODUCT_LEVEL_TYPE_NAME } from '@dna-codes/dna-core'

export interface PreviewNode {
  /** Stable surface id the gate resolves against (`_projectionKey` when present, else instance id). */
  id: string
  name: string
  level: ProductLevel
  planned: boolean
  /** For a Component: its UI `type` (the `@dna/ui-library` binding, e.g. `button`/`table`). */
  uiType?: string
  /** For a Page: the name of the Layout that wraps it, when referenced. */
  layout?: string
  children: PreviewNode[]
}

export interface AccessGrant {
  subject: string
  surface: string
}

export interface ContainsEdge {
  parent: string
  child: string
}

export interface SurfaceOperation {
  surface: string
  operation: string
}

export interface OperationAllow {
  operation: string
  role: string
}

/**
 * The business records a Page renders as a table. A Page operates on a resource
 * type when one of its Component operations declares that type in its `changes`
 * array (e.g. an Orders page whose `update-status` operation `changes: ["order"]`
 * surfaces the order instances). One entry per (page, resource type).
 */
export interface SurfaceRecords {
  /** Projected page surface key. */
  surface: string
  /** Resource type the page operates on. */
  resourceType: string
  /** Column keys present across the rows, `name` first. */
  columns: string[]
  /** Instance rows, business attributes only (internal `_`-prefixed keys stripped). */
  rows: Record<string, unknown>[]
}

export interface ProductAppPreviewViewModel {
  lens: 'product-app-preview'
  /** App-level surfaces; each nests its contained Modules/Workflows/Pages/Sections. */
  roots: PreviewNode[]
  access: { grants: AccessGrant[]; contains: ContainsEdge[] }
  surfaceOperations: SurfaceOperation[]
  operationAllows: OperationAllow[]
  /** Per-page record tables, keyed by the resource type the page operates on. */
  surfaceRecords: SurfaceRecords[]
  /** Distinct role names present in `grants` — the preview-as control's options. */
  subjects: string[]
}

/** UI surface levels that form the derived tree (API + component levels excluded). */
const SURFACE_LEVELS: ReadonlySet<ProductLevel> = new Set(['app', 'module', 'workflow', 'page', 'section'])

/** UI levels that form the authored/materialized tree (Components included; Layout is referenced, not nested). */
const MATERIALIZED_TREE_LEVELS: ReadonlySet<ProductLevel> = new Set(['app', 'module', 'workflow', 'page', 'section', 'component'])

/** Product resource-type name → projection level (inverse of `PRODUCT_LEVEL_TYPE_NAME`). */
const LEVEL_BY_TYPE_NAME: Record<string, ProductLevel> = Object.fromEntries(
  (Object.entries(PRODUCT_LEVEL_TYPE_NAME) as [ProductLevel, string][]).map(([level, name]) => [name, level]),
)

export async function buildProductAppPreview(store: DnaDataStore): Promise<ProductAppPreviewViewModel> {
  // Prefer the authored/materialized product graph; fall back to the derivation.
  const materialized = await buildMaterializedView(store)
  if (materialized) return materialized
  return buildDerivedView(store)
}

/**
 * Render the authored product-UI graph from materialized product instances and
 * their `contains` edges. Returns `null` when no `App` instance exists, so the
 * caller falls back to the pure projection. Nodes are keyed by `_projectionKey`
 * when present (so `applyProjection`-materialized graphs overlay by projection
 * key as before) and otherwise by instance id (authored graphs).
 */
async function buildMaterializedView(store: DnaDataStore): Promise<ProductAppPreviewViewModel | null> {
  const registered = new Set((await store.resourceType.list()).map((r) => r.name))
  if (!registered.has(PRODUCT_LEVEL_TYPE_NAME.app)) return null
  const productTypeNames = [...new Set(Object.values(PRODUCT_LEVEL_TYPE_NAME))].filter((n) => registered.has(n))

  const nodeById = new Map<string, PreviewNode>()
  const keyOf = new Map<string, string>() // instance id → surface key (_projectionKey ?? id)
  const resourceByComponent = new Map<string, string>() // surface key → bound resource type
  const operationByComponent = new Map<string, string>() // surface key → operation name
  let appCount = 0

  for (const typeName of productTypeNames) {
    const level = LEVEL_BY_TYPE_NAME[typeName]
    for (const inst of await store.instance.list(typeName)) {
      const rec = inst as Record<string, unknown>
      const surfaceKey = typeof rec._projectionKey === 'string' ? rec._projectionKey : inst.id
      keyOf.set(inst.id, surfaceKey)
      if (level === 'app') appCount++
      if (!MATERIALIZED_TREE_LEVELS.has(level)) continue
      const node: PreviewNode = { id: surfaceKey, name: String(rec.name ?? inst.id), level, planned: rec.planned === true, children: [] }
      if (level === 'component' && typeof rec.type === 'string') node.uiType = rec.type
      if (level === 'page' && typeof rec.layout === 'string') node.layout = rec.layout
      nodeById.set(surfaceKey, node)
      if (level === 'component' && typeof rec.resource === 'string') resourceByComponent.set(surfaceKey, rec.resource)
      if (level === 'component' && typeof rec.operation === 'string') operationByComponent.set(surfaceKey, rec.operation)
    }
  }
  if (appCount === 0) return null

  const links = await store.link.list()
  const parentOf = new Map<string, string>()
  const contains: ContainsEdge[] = []
  for (const link of links) {
    if (link.role !== 'contains') continue
    const pk = keyOf.get(link.from.id)
    const ck = keyOf.get(link.to.id)
    if (pk === undefined || ck === undefined) continue
    const parent = nodeById.get(pk)
    const child = nodeById.get(ck)
    if (!parent || !child) continue
    parent.children.push(child)
    parentOf.set(ck, pk)
    contains.push({ parent: pk, child: ck })
  }
  const roots = [...nodeById.values()].filter((n) => n.level === 'app')

  // surfaceRecords: each bound Component → instances of its resource type, keyed by the component surface.
  const rowsByType = groupRowsByType(await readBusinessGraph(store))
  const surfaceRecords: SurfaceRecords[] = []
  for (const [surface, resourceType] of resourceByComponent) {
    const rows = rowsByType.get(resourceType) ?? []
    if (rows.length === 0) continue
    surfaceRecords.push({ surface, resourceType, columns: columnsOf(rows), rows })
  }

  // surfaceOperations: a Component's `operation` exposed on its parent surface.
  const surfaceOperations: SurfaceOperation[] = []
  for (const [surface, operation] of operationByComponent) {
    surfaceOperations.push({ surface: parentOf.get(surface) ?? surface, operation })
  }

  // can_access grants keyed by the same surface keys.
  const grants: AccessGrant[] = []
  for (const link of links) {
    if (link.role !== 'can_access') continue
    const surface = keyOf.get(link.to.id)
    if (surface === undefined) continue
    grants.push({ subject: await subjectName(store, link.from), surface })
  }
  const subjects = [...new Set(grants.map((g) => g.subject))].sort()
  const operationAllows = await readOperationAllows(store)

  return { lens: 'product-app-preview', roots, access: { grants, contains }, surfaceOperations, operationAllows, surfaceRecords, subjects }
}

async function buildDerivedView(store: DnaDataStore): Promise<ProductAppPreviewViewModel> {
  // 1. Read the business graph and run the pure projection (writes nothing).
  const business = await readBusinessGraph(store)
  const subgraph = project(business)

  // 2. Build the surface tree from projected nodes + their parentKey.
  const nodes = new Map<string, PreviewNode>()
  for (const n of subgraph.nodes) {
    if (SURFACE_LEVELS.has(n.level)) {
      nodes.set(n.key, { id: n.key, name: n.name, level: n.level, planned: n.planned, children: [] })
    }
  }
  const roots: PreviewNode[] = []
  for (const n of subgraph.nodes) {
    if (!SURFACE_LEVELS.has(n.level)) continue
    const node = nodes.get(n.key)!
    const parent = n.parentKey ? nodes.get(n.parentKey) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  // 3. contains snapshot (surface→surface) from the projection's contains edges.
  const contains: ContainsEdge[] = subgraph.edges
    .filter((e) => e.via === 'contains' && nodes.has(e.from) && nodes.has(e.to))
    .map((e) => ({ parent: e.from, child: e.to }))

  // 4. surfaceOperations: each Component realizes an operation; its parent
  //    surface exposes that operation (by the operation's name).
  const surfaceOperations: SurfaceOperation[] = []
  for (const n of subgraph.nodes) {
    if (n.level === 'component' && n.parentKey && nodes.has(n.parentKey)) {
      surfaceOperations.push({ surface: n.parentKey, operation: n.name })
    }
  }

  // 5. surfaceRecords: a Page operates on the resource type(s) its Component
  //    operations declare in `changes`; surface the matching instances as rows.
  const surfaceRecords = buildSurfaceRecords(business, subgraph, nodes)

  // 6. Overlay persisted can_access onto projected nodes by stable key, and read
  //    access-rule allow-entries for the fine gate. Both read-only.
  const grants = await readGrants(store)
  const operationAllows = await readOperationAllows(store)
  const subjects = [...new Set(grants.map((g) => g.subject))].sort()

  return {
    lens: 'product-app-preview',
    roots,
    access: { grants, contains },
    surfaceOperations,
    operationAllows,
    surfaceRecords,
    subjects,
  }
}

/** resource type → its instance rows (business attributes only, `_`-prefixed/`changes` stripped). */
function groupRowsByType(business: LensDataResult): Map<string, Record<string, unknown>[]> {
  const rowsByType = new Map<string, Record<string, unknown>[]>()
  for (const n of business.nodes) {
    const rec = n as Record<string, unknown>
    const typeName = String(rec._typeName ?? '')
    const row: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(rec)) {
      if (k.startsWith('_') || k === 'changes') continue
      row[k] = v
    }
    const list = rowsByType.get(typeName) ?? []
    list.push(row)
    rowsByType.set(typeName, list)
  }
  return rowsByType
}

/** Display columns across rows: `name` first, `id` and `_`-prefixed keys excluded. */
function columnsOf(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>()
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k)
  return ['name', ...[...keys].filter((k) => k !== 'name' && k !== 'id').sort()].filter((k) => keys.has(k))
}

/** Map each Page surface to the instances of the resource type(s) it operates on (derived path). */
function buildSurfaceRecords(
  business: LensDataResult,
  subgraph: { nodes: ProductNode[] },
  pages: Map<string, PreviewNode>,
): SurfaceRecords[] {
  // business operation id → resource types it changes.
  const changesById = new Map<string, string[]>()
  for (const n of business.nodes) {
    const rec = n as Record<string, unknown>
    if (Array.isArray(rec.changes)) changesById.set(String(rec.id), (rec.changes as unknown[]).map(String))
  }
  const rowsByType = groupRowsByType(business)

  // page surface key → set of resource types its components change.
  const typesByPage = new Map<string, Set<string>>()
  for (const c of subgraph.nodes) {
    if (c.level !== 'component' || !c.parentKey || !pages.has(c.parentKey)) continue
    for (const t of changesById.get(c.realizes) ?? []) {
      const set = typesByPage.get(c.parentKey) ?? new Set<string>()
      set.add(t)
      typesByPage.set(c.parentKey, set)
    }
  }

  const out: SurfaceRecords[] = []
  for (const [surface, types] of typesByPage) {
    for (const resourceType of [...types].sort()) {
      const rows = rowsByType.get(resourceType) ?? []
      if (rows.length === 0) continue
      out.push({ surface, resourceType, columns: columnsOf(rows), rows })
    }
  }
  return out
}

// ── Helpers (all read-only) ───────────────────────────────────────────────────

/** Every instance across every resource type, stamped with `_typeName`, plus all links. */
async function readBusinessGraph(store: DnaDataStore): Promise<LensDataResult> {
  const resourceTypes = await store.resourceType.list()
  const nodes: LensDataResult['nodes'] = []
  for (const rt of resourceTypes) {
    for (const inst of await store.instance.list(rt.name)) {
      nodes.push({ ...inst, _typeName: rt.name } as LensDataResult['nodes'][number])
    }
  }
  const links = await store.link.list()
  return { nodes, links }
}

/** can_access grants keyed by projected surface, overlaid from persisted product nodes. */
async function readGrants(store: DnaDataStore): Promise<AccessGrant[]> {
  const registered = new Set((await store.resourceType.list()).map((r) => r.name))
  const productTypeNames = [...new Set(Object.values(PRODUCT_LEVEL_TYPE_NAME))].filter((n) => registered.has(n))

  // Persisted product instance id → its stable projection key.
  const keyByInstanceId = new Map<string, string>()
  for (const typeName of productTypeNames) {
    for (const inst of await store.instance.list(typeName)) {
      const key = (inst as Record<string, unknown>)._projectionKey
      if (typeof key === 'string') keyByInstanceId.set(inst.id, key)
    }
  }
  if (keyByInstanceId.size === 0) return []

  const grants: AccessGrant[] = []
  for (const link of await store.link.list()) {
    if (link.role !== 'can_access') continue
    const surface = keyByInstanceId.get(link.to.id)
    if (!surface) continue
    grants.push({ subject: await subjectName(store, link.from), surface })
  }
  return grants
}

/** The display subject for a grant source — a Role's/User's `name`, falling back to its id. */
async function subjectName(store: DnaDataStore, ref: InstanceRef): Promise<string> {
  const rec = await store.instance.get(ref.typeName, ref.id)
  const name = rec && (rec as Record<string, unknown>).name
  return typeof name === 'string' ? name : ref.id
}

/**
 * Access-rule allow-entries for the fine gate, best-effort: any instance of a
 * `rule`-named type with `rule_type === 'access'`, an `operation`, and an
 * `allow` array of `{ role }`. Absent rules ⇒ empty ⇒ operations open (the
 * `<Operation>` default).
 */
async function readOperationAllows(store: DnaDataStore): Promise<OperationAllow[]> {
  const ruleType = (await store.resourceType.list()).find((r) => r.name.toLowerCase() === 'rule')
  if (!ruleType) return []

  const out: OperationAllow[] = []
  for (const rec of await store.instance.list(ruleType.name)) {
    const r = rec as Record<string, unknown>
    if (r.rule_type !== 'access' || typeof r.operation !== 'string' || !Array.isArray(r.allow)) continue
    for (const entry of r.allow as Array<{ role?: unknown }>) {
      if (entry && typeof entry.role === 'string') out.push({ operation: r.operation, role: entry.role })
    }
  }
  return out
}
