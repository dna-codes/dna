## Why

Lenses are declarative JSON today (`packages/core/lenses/*.json` — slots bound to types, edges bound to relationship types, a sentence), but nothing *evaluates* them. Every actual view is a bespoke hand-coded traversal in `packages/mcp/src/lenses/*.ts` (`buildOrgChart`, `reporting-chains`, `span-of-control`, …), each re-implementing store queries with hardcoded type-name sets. The `groupings-as-anchored-queries` doctrine settled the model — lenses are **schema lenses** or **data lenses**, and a grouping is just a data lens with a **pinned** anchor — but there is no runtime that turns a lens definition into a subgraph. This change builds that evaluator so lenses (including groupings) are data-driven, not code-per-lens.

## What Changes

- **New generic lens evaluator** in `packages/core` — takes a lens definition + a `DnaDataStore` and returns a matched subgraph (nodes + links), replacing per-lens hardcoded traversal logic.
- **Lens definition shape extended** to support **free** bindings (slot/edge bound to a type → matches any instance) and **pinned** bindings (bound to a specific instance `id` → an anchor). A grouping is a data lens with ≥1 pinned binding plus a traversal/scope spec (`via` relationship types, depth, node-type filter).
- **Schema-lens vs data-lens classification** — a lens declares whether it reads/returns the type graph (`resource_type` + `relationship_type`) or the instance graph (`resource` + `relationship`). Pinning applies only to data lenses.
- **DECISION resolved in design**: one unified lens schema (a slot accepts `type` *or* `id`) vs. distinct schema-lens/data-lens shapes. (Recommendation carried in design.md.)
- **Bespoke mcp lenses refactored** to call the evaluator with a declarative definition instead of hand-rolled store queries (incremental; org-chart first as the proof).
- **Presentation stays a separable facet** — the evaluator returns a subgraph; rendering (`sentence` / view-model shaping) consumes it. No change to how panels render.

## Capabilities

### New Capabilities

- `lens-evaluation`: A runtime that evaluates a lens definition against a `DnaDataStore` and returns the matched subgraph. Covers free/pinned slot+edge bindings, traversal/scope for groupings, and the schema-lens vs data-lens distinction.
- `lens-definition-schema`: The declarative shape a lens conforms to — slots, edges, free/pinned bindings, traversal/scope, and the schema/data classification — including whether free and pinned bindings share one schema.

### Modified Capabilities

_None — `grouping-model` (from `groupings-as-anchored-queries`) defines the doctrine; this change implements it without changing those requirements._

## Impact

- `packages/core` — new `lens` evaluation module + exported types; depends only on the existing `DnaDataStore` interface (works against Neo4j or in-memory adapters).
- `packages/core/lenses/*.json` — definitions extended to the new shape; existing all-free lenses remain valid (rendering views).
- `packages/mcp/src/lenses/*.ts` — migrated to thin wrappers over the evaluator (org-chart first; others follow incrementally).
- No change required to `apps/*` panels — they consume the same view-model surface; the evaluator backs it.
- Depends on the `groupings-as-anchored-queries` doctrine (graph-as-truth, home-as-primary-edge, schema/data lenses).
