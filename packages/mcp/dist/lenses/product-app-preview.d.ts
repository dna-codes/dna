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
import type { DnaDataStore, ProductLevel } from '@dna-codes/dna-core';
export interface PreviewNode {
    /** Stable surface id the gate resolves against (`_projectionKey` when present, else instance id). */
    id: string;
    name: string;
    level: ProductLevel;
    planned: boolean;
    /** For a Component: its UI `type` (the `@dna/ui-library` binding, e.g. `button`/`table`). */
    uiType?: string;
    /** For a Page: the name of the Layout that wraps it, when referenced. */
    layout?: string;
    children: PreviewNode[];
}
export interface AccessGrant {
    subject: string;
    surface: string;
}
export interface ContainsEdge {
    parent: string;
    child: string;
}
export interface SurfaceOperation {
    surface: string;
    operation: string;
}
export interface OperationAllow {
    operation: string;
    role: string;
}
/**
 * The business records a Page renders as a table. A Page operates on a resource
 * type when one of its Component operations declares that type in its `changes`
 * array (e.g. an Orders page whose `update-status` operation `changes: ["order"]`
 * surfaces the order instances). One entry per (page, resource type).
 */
export interface SurfaceRecords {
    /** Projected page surface key. */
    surface: string;
    /** Resource type the page operates on. */
    resourceType: string;
    /** Column keys present across the rows, `name` first. */
    columns: string[];
    /** Instance rows, business attributes only (internal `_`-prefixed keys stripped). */
    rows: Record<string, unknown>[];
}
export interface ProductAppPreviewViewModel {
    lens: 'product-app-preview';
    /** App-level surfaces; each nests its contained Modules/Workflows/Pages/Sections. */
    roots: PreviewNode[];
    access: {
        grants: AccessGrant[];
        contains: ContainsEdge[];
    };
    surfaceOperations: SurfaceOperation[];
    operationAllows: OperationAllow[];
    /** Per-page record tables, keyed by the resource type the page operates on. */
    surfaceRecords: SurfaceRecords[];
    /** Distinct role names present in `grants` — the preview-as control's options. */
    subjects: string[];
}
export declare function buildProductAppPreview(store: DnaDataStore): Promise<ProductAppPreviewViewModel>;
//# sourceMappingURL=product-app-preview.d.ts.map