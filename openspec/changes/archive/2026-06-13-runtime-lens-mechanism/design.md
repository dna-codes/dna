## Context

DNA has declarative lens JSON (`packages/core/lenses/*.json`) but no evaluator. Each rendered view is a bespoke async function in `packages/mcp/src/lenses/*.ts` that queries `DnaDataStore` directly with hardcoded type-name sets (e.g. `org-chart.ts`'s `ORG_TYPES = {company, department, position, domain, group}`). The `groupings-as-anchored-queries` doctrine (sibling change) settled the conceptual model:

- Lenses are **schema lenses** (read/return the type graph) or **data lenses** (read/return the instance graph).
- Within a data lens, each slot/edge binding is **free** (bound to a type → matches any instance) or **pinned** (bound to a specific instance → an anchor).
- A **grouping is a data lens with a pinned anchor** + a traversal/scope.

This change builds the runtime that turns those definitions into subgraphs, against the existing `DnaDataStore` interface (so it works on both the Neo4j and in-memory adapters). It does not change the doctrine.

## Goals / Non-Goals

**Goals:**
- One generic `evaluateLens(definition, store)` that returns a matched subgraph — replacing per-lens hardcoded traversal.
- Lens definitions express free vs pinned bindings and a traversal/scope, so groupings are data-driven.
- Resolve the open shape question: one unified lens schema vs. distinct schema/data shapes.
- Prove it by backing `buildOrgChart` with the evaluator while keeping its current view-model output unchanged.

**Non-Goals:**
- Changing how panels render — the evaluator returns a subgraph; existing view-model shapers/presentation stay.
- Migrating every bespoke mcp lens in this change (org-chart is the proof; the rest follow incrementally).
- A query language / arbitrary graph algebra — scope is bounded traversal (via + direction + depth + type filter), not full Cypher.
- Persisted user-saved groupings UX (localStorage `saved-lenses.ts` is untouched here).

## Decisions

### 0. The lens grammar is a JSON Schema in `dna-schemas`, not code

There are two artifacts: the lens **meta-schema** (the grammar, one file) and lens **definitions** (instances, many files). The meta-schema is a JSON Schema, so it lives in `@dna-codes/dna-schemas` at `meta/lens.json` (`$id: https://dna.codes/schemas/meta/lens`), a sibling of `meta/stability.json`. It joins the `schemas` manifest in `packages/core/src/index.ts` (`meta: { stability, lens }`), so the existing `allSchemas()` → Ajv registration in `validator.ts` picks it up automatically — `validateLensDefinition()` is then just `ajv.getSchema('…/meta/lens')`, no new Ajv wiring. Definitions stay in `packages/core/lenses/*.json` and gain `"$schema": "…/meta/lens"`. The slot array keeps its existing key **`nodes`** (`{ slot, type }`), not `slots`, so existing lens files validate unchanged.

### 1. One unified lens definition; `target` discriminates schema vs data

A single lens schema with a `target: "schema" | "data"` field, rather than two separate file shapes.

- A **data lens** (`target: "data"`) matches/returns instances. Slots/edges may be free or pinned.
- A **schema lens** (`target: "schema"`) matches/returns the type graph; pinning is not allowed.

**Why over two shapes:** one evaluator, one validator, one mental model; groupings and rendering views are the same object at different binding tightness. Splitting reads marginally cleaner but doubles the surface and forces consumers to branch on file kind. The `target` field gives legibility without duplication.

**Extend, don't replace, the existing type.** `packages/core/src/index.ts` already exports a `LensDefinition` (`{ $id, name, nodes, edges?, sentence? }`, with `LensNodeSlot = { slot?, type }`) that the JSON lens loaders and consumers use today. The unified shape is a **superset** of it: add optional `target` + `scope` to the definition and optional `ref` to the slot. This is a deliberate edit to an in-use type — not a fresh add. Backward-compatible because every new field is optional and `target` defaults to `"data"`, so existing all-free lens files validate unchanged. The canonical types move to `src/lens/types.ts`; `index.ts` re-exports them to preserve the current import surface.

### 2. A binding is free (`type`) or pinned (`ref`)

Each slot keeps its existing `{ slot, type }` (free). Pinning adds an optional `ref`:

```
   free:    { slot: "subject", type: "Person" }
   pinned:  { slot: "anchor",  type: "Group", ref: { id: "grp_bizops" } }
   pinned:  { slot: "anchor",  type: "Domain", ref: { select: { pathPrefix: "acme.finance" } } }
```

`ref` is `{ id }` (a concrete instance) **or** `{ select }` (a predicate — by name, path-prefix, attribute). The `select` form makes a grouping a reusable template, not bound to one tenant's node ids. Existing all-free lenses validate unchanged.

### 3. Groupings declare a `scope` per anchor

A pinned anchor seeds the result; `scope` says how membership expands from it:

```
   scope: { from: "anchor", via: ["belongs_to", "reports_to"], direction: "in", depth: "transitive", nodeTypes?: [...] }
```

`via` lists relationship types to traverse; `direction` is `out|in|both`; `depth` is an integer or `"transitive"`; `nodeTypes` optionally filters which node types count as members. Absent `scope`, a pinned lens returns just the anchor and its directly-bound edges.

### 4. Evaluator returns a subgraph; presentation is separate

```
   evaluateLens(def, store) ─▶ LensResult
        data:   { nodes: InstanceRecord[], links: LinkRecord[] }
        schema: { resourceTypes: ResourceType[], relationshipTypes: RelationshipType[] }
```

Rendering (sentence interpolation, org-chart tree shaping) consumes `LensResult`. `buildOrgChart` becomes: `evaluateLens(orgChartDef, store)` → existing tree-shaping → same `OrgChartViewModel`. Panels see no change.

### 5. Evaluation algorithm (data lens)

1. **Seed**: resolve every pinned slot via `store` (`ref.id` → load; `ref.select` → query + filter) into a seed node set. If no pins, the seed is "all instances of free slot types."
2. **Expand**: for each `scope`, traverse `via` links from the seed in `direction`, to `depth`, collecting nodes (filtered by `nodeTypes`) and the links walked.
3. **Match free edges**: for declared lens `edges` (free), include links of the given relationship type between collected nodes.
4. **Return** the collected `{ nodes, links }`.

Traversal pushes down to `store.link.list` filters where the adapter supports it; otherwise it walks in memory. Registry sizes are small; correctness first, then push down hot paths.

## Risks / Trade-offs

- **Pinned-by-id brittleness** → mitigate with the `ref.select` predicate form so groupings are tenant-portable templates, not id-coupled.
- **Generic traversal slower than hand-tuned queries** → mitigate by keeping `via`/`direction`/`depth` declarative so adapters can push down; start with org-chart and measure before optimizing.
- **JSON definitions drifting from evaluator expectations** → mitigate with a JSON Schema for lens definitions (`lens.schema.json`) + validation at load.
- **Behavioral regression in org-chart during migration** → mitigate by asserting the evaluator-backed `buildOrgChart` produces an identical `OrgChartViewModel` on the existing fixtures before deleting old logic.

## Migration Plan

1. Land the evaluator + lens definition schema in `packages/core` (additive; nothing consumes it yet).
2. Author `org-chart` as a declarative data lens; back `buildOrgChart` with `evaluateLens`, asserting identical output on fixtures.
3. Migrate remaining mcp lenses (`reporting-chains`, `span-of-control`, `pipeline`, `people-positions`, `accounts`, `job-descriptions`) one at a time in follow-on work.
4. Rollback: the evaluator is additive; reverting step 2 restores the hand-coded `buildOrgChart` without touching panels.

## Open Questions

- **Schema-lens priority**: data lenses + groupings are the driver; is a schema lens (model/ER view) needed in v1 or defined-but-deferred? Leaning: define the shape now, implement minimal schema-lens evaluation, focus tests on data lenses.
- **Cycle handling** in transitive traversal: visited-set dedupe is assumed; confirm no lens needs path-multiplicity semantics.
