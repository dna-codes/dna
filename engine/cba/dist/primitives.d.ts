import { Layer } from './context';
/**
 * Catalog of primitive types per layer + where they live in the layer document.
 *
 * Primitive *names* and *shapes* come from the @dna-codes/dna-schemas package — we
 * don't hardcode the list of valid types. The schema files in
 * @dna-codes/dna-schemas/{operational,product/{core,api,web},technical}/*.json
 * define what's valid; we walk those directories at module-load time to
 * discover the type set.
 *
 * What CBA *does* know is the **location** of each primitive inside its layer
 * document — that's a CBA convention, not a schema concern. The LOCATIONS map
 * encodes that convention; everything else is schema-derived.
 */
export interface PrimitiveSpec {
    type: string;
    layer: Layer;
    /** dotted path inside the layer document, or `domain.*.<plural>` / `views.*.<plural>` for tree-walked primitives */
    location: string;
    nested?: boolean;
    /** Singletons return without a `name` lookup (Namespace, Layout) */
    singleton?: boolean;
    /** Children of a noun (operational actions/attributes); CBA collects these via parent-aware walks */
    childOf?: 'noun' | 'resource' | 'page';
}
/** Module-load: build once. Re-exported for callers that just want to enumerate. */
export declare const PRIMITIVES: PrimitiveSpec[];
export declare function primitivesForLayer(layer: Layer): PrimitiveSpec[];
export declare function findPrimitiveSpec(layer: Layer, type: string): PrimitiveSpec | undefined;
/** Walk the operational domain tree, yielding each domain node with its dotted path. */
export declare function walkDomains(domain: any, visit: (node: any, path: string) => void): void;
export interface FoundPrimitive {
    type: string;
    name: string;
    domainPath?: string;
    node: any;
}
/**
 * Collect every instance of a primitive type across a layer document.
 *
 * Handles three traversal styles:
 *   - top-level array (`location: "operations"`)
 *   - top-level singleton (`location: "namespace"`, `singleton: true`)
 *   - tree-walked (`location: "domain.*.resources"` or `"views.*.nodes"`)
 *   - parent-aware children (operational actions/attributes — collected from
 *     every Resource / Person / Role / Group in the domain tree)
 */
export declare function collectPrimitives(doc: any, spec: PrimitiveSpec): FoundPrimitive[];
/** Find the domain node at a given dotted path. */
export declare function findDomainByPath(domain: any, targetPath: string): any | undefined;
/**
 * For an operational noun primitive (Resource/Person/Role/Group), find it by
 * `name` anywhere in the domain tree. Used by the CLI to resolve `--at` paths
 * for adding Action/Attribute children.
 *
 * Returns the noun node and its kind ("resources" | "persons" | "roles" | "groups")
 * so the caller knows which child collection to mutate.
 */
export declare function findNounByName(domain: any, domainPath: string, nounName: string): {
    noun: any;
    kind: 'resources' | 'persons' | 'roles' | 'groups';
} | undefined;
