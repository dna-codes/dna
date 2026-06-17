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
import type { DnaDataStore } from '../types/data-store';
import type { PermissionProjection, ProductLevel, ProductSubgraph } from './types';
/**
 * Register the product UI/API resource types and the structural relationship
 * types in `store`, derived from the registered `product/*` schemas. Idempotent:
 * skips any type whose name already exists, mirroring `seedPack`.
 */
export declare function seedProductTypes(store: DnaDataStore): Promise<void>;
/** Maps a projection level to the resource-type name registered by `seedProductTypes`. */
export declare const PRODUCT_LEVEL_TYPE_NAME: Record<ProductLevel, string>;
/** What a single `applyProjection` run wrote. */
export interface ApplyReport {
    instancesCreated: number;
    linksCreated: number;
    orphaned: number;
}
/**
 * Persist `subgraph` into `store`. See the module header for the full contract.
 * Returns a per-run tally of what changed.
 */
export declare function applyProjection(subgraph: ProductSubgraph, store: DnaDataStore): Promise<ApplyReport>;
/** The resource-type name `Permission` instances are stored under. */
export declare const PERMISSION_TYPE_NAME = "Permission";
/** What a single `applyPermissions` run wrote. */
export interface ApplyPermissionsReport {
    permissionsCreated: number;
    grantsCreated: number;
}
/**
 * Persist a {@link PermissionProjection} into `store`. Upserts each Permission
 * by its `{principal, role, scope}` identity — so a derived Permission
 * reconciles onto a matching hand-authored one rather than duplicating it — and
 * creates the `grants` edge from the backing operational Membership instance
 * when that instance is resolvable. `grants` edges are never duplicated.
 * Requires the `Permission` type to be registered (see {@link seedProductTypes}).
 */
export declare function applyPermissions(proj: PermissionProjection, store: DnaDataStore): Promise<ApplyPermissionsReport>;
//# sourceMappingURL=apply.d.ts.map