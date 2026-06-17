/**
 * Persistence for the business→product projection.
 *
 * Two pieces turn the pure `project()` output (see `./project`) into live graph
 * state:
 *
 *   1. `seedProductTypes(store)` — registers the product UI/API **resource types**
 *      (App/Module/Workflow/Page/Section/Component/Element, plus Namespace/Endpoint)
 *      and the structural **relationship types** (`contains`/`realized_as`/`exposes`),
 *      derived from the registered `product/*` schemas. Idempotent; mirrors how
 *      `seedPack` registers types.
 *
 *   2. `applyProjection(subgraph, store)` — upserts each `ProductNode` as an
 *      instance keyed by its stable projection key (`_projectionKey`) and creates
 *      the structural links. Idempotent against re-runs; only structural links are
 *      reconciled. Authored governance edges (`can_access`/`assigned_to`) are never
 *      created or removed here, and a previously-applied node whose backing has
 *      vanished is soft-deleted (marked `_orphaned`) rather than removed when it
 *      carries governance edges, so those edges stay reviewable.
 */

import type {
  DnaDataStore,
  InstanceRef,
  RelationshipTypeInput,
  ResourceTypeInput,
} from '../types/data-store'
import { schemas } from '../index'
import type { PermissionProjection, ProductLevel, ProductSubgraph } from './types'

// ── Type registration ───────────────────────────────────────────────────────

/**
 * The `product/*` schemas whose `title` becomes a product resource-type name.
 * Drawn from the registered schema layer so the runtime registry stays in
 * lock-step with the schemas rather than duplicating a hand-written table.
 * Pulled lazily (inside `seedProductTypes`) to avoid a load-time import cycle
 * with `../index`.
 */
function productResourceSchemas() {
  const ui = schemas.product.ui
  const api = schemas.product.api
  const web = schemas.product.web
  const core = schemas.product.core
  return [ui.app, ui.module, ui.workflow, web.page, web.layout, ui.section, ui.component, ui.element, api.namespace, api.endpoint, core.permission]
}

/**
 * The authored **governance** relationship types — the edge class that gives
 * product surfaces independent access control. Unlike the structural types,
 * these are never derived from the business graph and are never created,
 * removed, or rewritten by `applyProjection`; the projection only *preserves*
 * them (see `GOVERNANCE_ROLES` and the soft-delete in `applyProjection`).
 * `seedProductTypes` registers the **types** so authored edges can be created;
 * the edges themselves are authored by humans or agents.
 *
 * Endpoints (the registry stores `from`/`to` as single strings, so the
 * intended pairs are documented here, matching the `'*'` convention the
 * structural types use):
 *   - `can_access`:  `Role` | `User` → `App` | `Module` | `Workflow` | `Page`
 *   - `assigned_to`: `User` → `App`
 */
const GOVERNANCE_RELATIONSHIP_TYPES: RelationshipTypeInput[] = [
  {
    name: 'can_access',
    from: '*', // Role | User
    to: '*', // App | Module | Workflow | Page
    cardinality: 'many-to-many',
    attribute: 'can_access',
    description:
      'Authored governance grant: a Role (or User, for direct grants) may access a structural product surface (App/Module/Workflow/Page). The coarse, structural-level access grant — distinct from operation-level permission. Never derived; preserved across projection re-runs.',
  },
  {
    name: 'assigned_to',
    from: '*', // User
    to: '*', // App
    cardinality: 'many-to-one',
    attribute: 'assigned_to',
    description:
      'Authored governance edge: a User is provisioned into (homed in) an App. Distinct from can_access — a user may can_access many apps while being assigned_to one. Never derived.',
  },
  {
    name: 'grants',
    from: '*', // Membership (operational)
    to: '*', // Permission (product)
    cardinality: 'one-to-many',
    attribute: 'grants',
    description:
      'The causal bridge: an operational Membership grants a product Permission ("Kyle can approve P&T allocations because he holds the Head position in the P&T group"). Derived from Membership + access Rules, but treated like the authored governance edges — preserved across re-apply, never clobbered; soft-handled when an endpoint vanishes.',
  },
]

/** The structural relationship types the projection persists. */
const STRUCTURAL_RELATIONSHIP_TYPES: RelationshipTypeInput[] = [
  {
    name: 'contains',
    from: '*',
    to: '*',
    cardinality: 'one-to-many',
    attribute: 'contains',
    description: 'A product node structurally contains a child product node.',
  },
  {
    name: 'realized_as',
    from: '*',
    to: '*',
    cardinality: 'many-to-one',
    attribute: 'realized_as',
    description: 'A product node surfaces (is realized as) the business node it derives from.',
  },
  {
    name: 'exposes',
    from: '*',
    to: '*',
    cardinality: 'many-to-one',
    attribute: 'exposes',
    description: 'An API endpoint exposes the business operation it surfaces.',
  },
]

/**
 * Register the product UI/API resource types and the structural relationship
 * types in `store`, derived from the registered `product/*` schemas. Idempotent:
 * skips any type whose name already exists, mirroring `seedPack`.
 */
export async function seedProductTypes(store: DnaDataStore): Promise<void> {
  const resourceTypes: ResourceTypeInput[] = productResourceSchemas().map((schema) => ({
    name: String(schema.title),
    category: 'resource',
    attribute_schema: [],
    description: typeof schema.description === 'string' ? schema.description : undefined,
  }))

  const [existingRt, existingRel] = await Promise.all([store.resourceType.list(), store.relationshipType.list()])
  const existingRtNames = new Set(existingRt.map((r) => r.name))
  const existingRelNames = new Set(existingRel.map((r) => r.name))

  await Promise.all(
    resourceTypes.filter((rt) => !existingRtNames.has(rt.name)).map((rt) => store.resourceType.create(rt)),
  )
  await Promise.all(
    [...STRUCTURAL_RELATIONSHIP_TYPES, ...GOVERNANCE_RELATIONSHIP_TYPES]
      .filter((rt) => !existingRelNames.has(rt.name))
      .map((rt) => store.relationshipType.create(rt)),
  )
}

// ── Apply (persistence) ─────────────────────────────────────────────────────

/** Maps a projection level to the resource-type name registered by `seedProductTypes`. */
export const PRODUCT_LEVEL_TYPE_NAME: Record<ProductLevel, string> = {
  app: 'App',
  module: 'Module',
  workflow: 'Workflow',
  page: 'Page',
  layout: 'Layout',
  section: 'Section',
  component: 'Component',
  namespace: 'Namespace',
  endpoint: 'Endpoint',
}

/** Authored access edges this routine must never create, delete, or disturb. */
const GOVERNANCE_ROLES: readonly string[] = GOVERNANCE_RELATIONSHIP_TYPES.map((rt) => rt.name)

/** What a single `applyProjection` run wrote. */
export interface ApplyReport {
  instancesCreated: number
  linksCreated: number
  orphaned: number
}

/**
 * Persist `subgraph` into `store`. See the module header for the full contract.
 * Returns a per-run tally of what changed.
 */
export async function applyProjection(subgraph: ProductSubgraph, store: DnaDataStore): Promise<ApplyReport> {
  const report: ApplyReport = { instancesCreated: 0, linksCreated: 0, orphaned: 0 }

  // 1. Upsert each node as an instance keyed by its stable projection key.
  const keyToRef = new Map<string, InstanceRef>()
  for (const node of subgraph.nodes) {
    const typeName = PRODUCT_LEVEL_TYPE_NAME[node.level]
    if (!typeName) continue
    const existing = await findByProjectionKey(store, typeName, node.key)
    if (existing) {
      keyToRef.set(node.key, { typeName, id: existing })
      continue
    }
    const { id } = await store.instance.create(typeName, {
      name: node.name,
      _projectionKey: node.key,
      realizes: node.realizes,
      level: node.level,
      planned: node.planned,
    })
    keyToRef.set(node.key, { typeName, id })
    report.instancesCreated++
  }

  // 2. Reconcile structural links only. `contains` joins two product nodes;
  //    `realized_as`/`exposes` join a product node to its (already-persisted)
  //    business node, resolved by id across the registered resource types.
  for (const edge of subgraph.edges) {
    const fromRef = keyToRef.get(edge.from)
    if (!fromRef) continue
    const toRef = edge.via === 'contains' ? keyToRef.get(edge.to) : await resolveBusinessRef(store, edge.to)
    if (!toRef) continue
    if (await ensureLink(store, fromRef, toRef, edge.via)) report.linksCreated++
  }

  // 3. Soft-delete: a previously-applied node absent from this subgraph that
  //    still carries authored governance edges is marked `_orphaned`, never
  //    hard-deleted, so those edges remain reviewable. (Governance edges are
  //    only read here for this check; they are never created or removed.)
  const liveKeys = new Set(subgraph.nodes.map((n) => n.key))
  for (const typeName of new Set(Object.values(PRODUCT_LEVEL_TYPE_NAME))) {
    for (const rec of await store.instance.list(typeName)) {
      const key = rec._projectionKey
      if (typeof key !== 'string' || liveKeys.has(key) || rec._orphaned === true) continue
      if (await hasGovernanceEdge(store, { typeName, id: rec.id })) {
        await store.instance.update(typeName, rec.id, { _orphaned: true })
        report.orphaned++
      }
    }
  }

  return report
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** The id of the instance of `typeName` carrying `key` as its `_projectionKey`, or null. */
async function findByProjectionKey(store: DnaDataStore, typeName: string, key: string): Promise<string | null> {
  const recs = await store.instance.list(typeName)
  const hit = recs.find((r) => r._projectionKey === key)
  return hit ? hit.id : null
}

/** Resolve a business node id to a typed `InstanceRef` by scanning the registered resource types. */
async function resolveBusinessRef(store: DnaDataStore, id: string): Promise<InstanceRef | null> {
  for (const type of await store.resourceType.list()) {
    const rec = await store.instance.get(type.name, id)
    if (rec) return { typeName: type.name, id }
  }
  return null
}

/** Create the `from -[role]-> to` link unless an identical one already exists. Returns true if created. */
async function ensureLink(store: DnaDataStore, from: InstanceRef, to: InstanceRef, role: string): Promise<boolean> {
  const existing = await store.link.list({ from, to, role })
  if (existing.length > 0) return false
  await store.link.create(from, to, { role })
  return true
}

/** True iff `ref` is an endpoint of any authored governance link. */
async function hasGovernanceEdge(store: DnaDataStore, ref: InstanceRef): Promise<boolean> {
  const [outgoing, incoming] = await Promise.all([store.link.list({ from: ref }), store.link.list({ to: ref })])
  return [...outgoing, ...incoming].some((l) => l.role !== undefined && GOVERNANCE_ROLES.includes(l.role))
}

// ── Permission apply (governance) ─────────────────────────────────────────────

/** The resource-type name `Permission` instances are stored under. */
export const PERMISSION_TYPE_NAME = 'Permission'

/** What a single `applyPermissions` run wrote. */
export interface ApplyPermissionsReport {
  permissionsCreated: number
  grantsCreated: number
}

/**
 * Persist a {@link PermissionProjection} into `store`. Upserts each Permission
 * by its `{principal, role, scope}` identity — so a derived Permission
 * reconciles onto a matching hand-authored one rather than duplicating it — and
 * creates the `grants` edge from the backing operational Membership instance
 * when that instance is resolvable. `grants` edges are never duplicated.
 * Requires the `Permission` type to be registered (see {@link seedProductTypes}).
 */
export async function applyPermissions(
  proj: PermissionProjection,
  store: DnaDataStore,
): Promise<ApplyPermissionsReport> {
  const report: ApplyPermissionsReport = { permissionsCreated: 0, grantsCreated: 0 }
  const keyToRef = new Map<string, InstanceRef>()

  // 1. Upsert Permissions by {principal, role, scope} identity.
  const existing = await store.instance.list(PERMISSION_TYPE_NAME)
  const identityOf = (r: Record<string, unknown>) =>
    `${String(r.principal ?? '')}::${String(r.role ?? '')}::${String(r.scope ?? '')}`
  const byIdentity = new Map(existing.map((r) => [identityOf(r as Record<string, unknown>), r] as const))

  for (const p of proj.permissions) {
    const hit = byIdentity.get(p.key)
    if (hit) {
      keyToRef.set(p.key, { typeName: PERMISSION_TYPE_NAME, id: hit.id })
      continue
    }
    const { id } = await store.instance.create(PERMISSION_TYPE_NAME, {
      name: p.key,
      principal: p.principal,
      role: p.role,
      scope: p.scope,
      planned: p.planned,
      _projectionKey: p.key,
    })
    keyToRef.set(p.key, { typeName: PERMISSION_TYPE_NAME, id })
    report.permissionsCreated++
  }

  // 2. Create `grants` edges (Membership → Permission), preserved/de-duped.
  for (const g of proj.grants) {
    const permRef = keyToRef.get(g.to)
    if (!permRef) continue
    const memRef = await resolveMembershipRef(store, g.from)
    if (!memRef) continue
    if (await ensureLink(store, memRef, permRef, 'grants')) report.grantsCreated++
  }

  return report
}

/**
 * Resolve an operational Membership instance by name. Prefers a `Membership`
 * type; falls back to scanning all registered types for a matching name.
 * Best-effort: returns null when no instance carries the name.
 */
async function resolveMembershipRef(store: DnaDataStore, name: string): Promise<InstanceRef | null> {
  const types = await store.resourceType.list()
  const ordered = [...types].sort((a) => (a.name === 'Membership' ? -1 : 0))
  for (const type of ordered) {
    const hit = (await store.instance.list(type.name)).find((r) => r.name === name)
    if (hit) return { typeName: type.name, id: hit.id }
  }
  return null
}
