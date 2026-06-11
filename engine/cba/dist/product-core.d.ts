import { DomainPaths } from './context';
/**
 * Product Core materializer.
 *
 * Derives `product.core.json` from `operational.json` + the product surfaces
 * (`product.api.json`, `product.ui.json`). Product Core is the self-contained
 * slice of operational DNA transitively referenced by the product layer — it
 * is the contract that downstream cells read INSTEAD of operational DNA.
 *
 * Product Core is ALWAYS DERIVED, never hand-authored. Running this module
 * (via `cba product core materialize` or automatically during `cba develop`)
 * overwrites `product.core.json` with the current projection.
 *
 * The shape of Product Core matches `@dna-codes/dna-core`'s ProductCoreDNA:
 *   { domain, resources?, operations?, triggers?, relationships? }
 *
 * The earlier model (capabilities, outcomes, signals, equations, lifecycles)
 * is gone — operations subsume capabilities, operation.changes[] subsumes
 * outcomes, and signals/lifecycles/equations were removed from the canonical
 * DNA model.
 */
export interface ProductCoreDNA {
    domain: {
        name: string;
        path: string;
        description?: string;
    };
    resources?: any[];
    operations?: any[];
    triggers?: any[];
    rules?: any[];
    relationships?: any[];
}
/**
 * Materialize product.core.json from operational + surfaces.
 *
 * Algorithm:
 * 1. Flatten the operational domain tree into a flat list of Resources
 *    (annotating each with the domain path it lives under).
 * 2. Walk product.api (resources[].resource) and product.ui (pages[].resource
 *    → api.resources[].resource) to collect surfaced Resource names. Default
 *    to all resources if no surfaces reference anything.
 * 3. Expand the surfaced set via Relationships — a Resource reachable from a
 *    surfaced Resource via any Relationship is included (transitive closure).
 * 4. Filter Operations to those whose `target` is a surfaced Resource.
 * 5. Filter Triggers to those that fire surfaced Operations or Processes
 *    that operate on surfaced Resources.
 * 6. Filter Relationships to ones whose endpoints are both surfaced.
 * 7. Pick the deepest single domain node that contains at least one
 *    surfaced Resource as the core's `domain` field.
 */
export declare function materializeProductCore(operational: any, api?: any, ui?: any): ProductCoreDNA;
/**
 * Read operational.json + optional product surfaces from a domain, materialize
 * product.core.json, and write it to the domain directory.
 */
export declare function materializeAndSaveProductCore(paths: DomainPaths): ProductCoreDNA;
