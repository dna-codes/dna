/**
 * Coarse structural-access resolution — the *coarse* grain of the two-grain
 * product-UI gate doctrine (see `openspec/specs/product-ui-governance`).
 *
 * `can_access` edges grant a Role or User access to a structural product
 * surface (App/Module/Workflow/Page). Access **cascades down** the `contains`
 * hierarchy: a grant on an App reaches its contained Modules/Pages, and a more
 * specific `can_access` on a contained node *overrides* the inherited grant
 * (widening or narrowing). The default is deny — a surface with no grant
 * anywhere up its containment chain is hidden.
 *
 * This module is pure (no graph store, no `fs`), so it is the canonical
 * statement of the doctrine and runs in any context. The browser-side gate in
 * `@dna-codes/dna-react` mirrors this logic inline to stay bundle-light.
 */
/** A snapshot of the governance + containment edges the resolver walks. */
export interface StructuralAccessGraph {
    /** `can_access` edges: a subject (Role name or User id) → a surface id. */
    grants: ReadonlyArray<{
        subject: string;
        surface: string;
    }>;
    /** `contains` edges: a parent surface id → a child surface id. */
    contains: ReadonlyArray<{
        parent: string;
        child: string;
    }>;
}
/**
 * True iff `surfaceId` is reachable for any of `subjects` (the current user id
 * plus their role names).
 *
 * A surface that carries its own `can_access` grants is decided solely by those
 * grants — an explicit grant set overrides inheritance, so a nested node can
 * widen *or* narrow what it inherits. A surface with no grants of its own
 * inherits its nearest ancestor's decision via `contains`. A surface with no
 * grant anywhere up its chain is denied.
 */
export declare function resolveStructuralAccess(graph: StructuralAccessGraph, surfaceId: string, subjects: readonly string[]): boolean;
/** Inputs for {@link lintEmptySurfaces}. */
export interface EmptySurfaceLintInput {
    /** Role-based `can_access` grants to check: a role name → a surface id. */
    grants: ReadonlyArray<{
        subject: string;
        surface: string;
    }>;
    /** Operations a surface exposes directly: a surface id → an operation name. */
    surfaceOperations: ReadonlyArray<{
        surface: string;
        operation: string;
    }>;
    /**
     * Operation-level access allow-entries: an operation → a role permitted to
     * perform it. An operation with no entries is performable by everyone (this
     * mirrors the operation gate: no access rule ⇒ permitted).
     */
    operationAllows: ReadonlyArray<{
        operation: string;
        role: string;
    }>;
    /** `contains` edges, so a surface's operations roll up from contained nodes. */
    contains?: ReadonlyArray<{
        parent: string;
        child: string;
    }>;
}
/** A flagged grant: a role can reach a surface but can perform none of its operations. */
export interface EmptySurfaceWarning {
    subject: string;
    surface: string;
    message: string;
}
/**
 * Flag every role-based `can_access` grant to a surface that exposes at least
 * one operation the role can never perform *all of* — i.e. the role is granted
 * a surface with no usable actions (a "coarse access, no fine access"
 * contradiction). Surfaces that expose no operations at all are not flagged
 * (they may be deliberately `planned`/empty). Pure.
 */
export declare function lintEmptySurfaces(input: EmptySurfaceLintInput): EmptySurfaceWarning[];
//# sourceMappingURL=structural-access.d.ts.map