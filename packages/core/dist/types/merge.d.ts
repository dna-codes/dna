/**
 * A loose structural type for an Operational DNA document.
 *
 * Matches the shape produced and consumed by `merge()`. Callers who want
 * stronger per-primitive typing should validate via `DnaValidator` against
 * the published JSON Schemas.
 */
export interface OperationalDNA {
    /** The thin tenant-root Domain. Descendant domains live in top-level `domains[]`. */
    domain: {
        name: string;
        path?: string;
        description?: string;
        owner?: string;
        parent?: string;
        [key: string]: unknown;
    };
    /** Descendant (non-root) thin Domain nodes, each naming its `parent`. */
    domains?: unknown[];
    /** Top-level noun type definitions; each names its home Domain via `domain`. */
    resources?: unknown[];
    persons?: unknown[];
    positions?: unknown[];
    groups?: unknown[];
    memberships?: unknown[];
    operations?: unknown[];
    triggers?: unknown[];
    rules?: unknown[];
    relationships?: unknown[];
    tasks?: unknown[];
    processes?: unknown[];
    [key: string]: unknown;
}
/**
 * Source identifies an origin document for a DNA chunk being merged.
 */
export interface Source {
    /** Origin URI (e.g. `gdrive://abc`, `file:///tmp/sop.md`). */
    uri: string;
    /** ISO 8601 timestamp at which the source was loaded. */
    loadedAt: string;
}
/**
 * One competing value observed at a conflict path, paired with its source.
 */
export interface ConflictValue {
    value: unknown;
    source: Source;
}
/**
 * The picked value the merger writes into the merged DNA, with a reason
 * citing which step of the v1 recommendation policy chose it.
 */
export interface ConflictRecommendation {
    value: unknown;
    reason: string;
}
/**
 * A reported conflict from `merge()`.
 *
 * `kind: 'scalar'` (default) — multiple chunks set different scalar values for
 * the same field; the recommendation has been written into the merged DNA.
 *
 * `kind: 'unresolved-reference'` — an Activity primitive references a noun /
 * operation / task / process that does not exist in the merged set; the
 * referencing primitive is still emitted into the merged DNA.
 */
export interface Conflict {
    path: string;
    values: ConflictValue[];
    recommendation: ConflictRecommendation;
    kind?: 'scalar' | 'unresolved-reference';
}
/**
 * Provenance map: dotted primitive path → sources that contributed that
 * primitive (or sub-primitive). Entries are deduped by (uri, loadedAt).
 */
export type Provenance = Record<string, Source[]>;
/**
 * A DNA chunk paired with the source it was extracted from. Used as input to
 * `merge()` when callers want per-chunk provenance and source-aware conflict
 * reporting.
 */
export interface MergeChunk {
    dna: OperationalDNA;
    source?: Source;
}
export interface MergeResult {
    dna: OperationalDNA;
    conflicts: Conflict[];
    provenance: Provenance;
}
//# sourceMappingURL=merge.d.ts.map