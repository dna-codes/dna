/**
 * Types for the business→product projection. A projection takes an evaluated
 * business subgraph and derives the product (UI + API) nodes the business
 * implies, with stable identity and a `planned` state where the business graph
 * is incomplete. Pure data — persistence is a separate (deferred) concern.
 */
export type ProductLevel = 'app' | 'module' | 'workflow' | 'page' | 'layout' | 'section' | 'component' | 'namespace' | 'endpoint';
export interface ProductNode {
    /** Stable identity: derived from (realizes, level, parent). */
    key: string;
    level: ProductLevel;
    name: string;
    /** The id of the business node this product node surfaces. */
    realizes: string;
    /** The key of the containing product node, if any. */
    parentKey?: string;
    /** True when the node's forward business backing is missing. Derived, never authored. */
    planned: boolean;
}
export interface ProductEdge {
    from: string;
    to: string;
    via: 'contains' | 'realized_as' | 'exposes';
}
export interface ProductSubgraph {
    nodes: ProductNode[];
    edges: ProductEdge[];
}
export interface ProjectOptions {
    /** Per business-node-id override of the product level (else the type default applies). */
    levelOverrides?: Record<string, ProductLevel>;
}
/**
 * A reified product authorization derived from an operational Membership +
 * access Rules. The product-layer parallel to a Membership. Identity is the
 * `{principal, role, scope}` tuple, captured in `key`.
 */
export interface PermissionNode {
    /** Stable identity: `${principal}::${role}::${scope}`. */
    key: string;
    /** The product User this Permission is granted to (Cedar principal). */
    principal: string;
    /** The product Role (capacity) exercised. */
    role: string;
    /** The Resource slot — a namespaced entity reference. Empty string when unresolved. */
    scope: string;
    /** True when the backing scope could not be resolved (e.g. a multi-scope Position with no disambiguating Group). No `grants` edge is emitted for a planned Permission. */
    planned: boolean;
    /** The name of the operational Membership that backs this Permission, if any. */
    backingMembership?: string;
}
/** A `grants` edge: an operational Membership grants a product Permission. */
export interface GrantEdge {
    /** The operational Membership name. */
    from: string;
    /** The Permission key it grants. */
    to: string;
    via: 'grants';
}
export interface PermissionProjection {
    permissions: PermissionNode[];
    grants: GrantEdge[];
}
//# sourceMappingURL=types.d.ts.map