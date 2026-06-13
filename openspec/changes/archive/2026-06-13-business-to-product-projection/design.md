## Context

This change implements the **derivation** half of the Product-UI-as-graph arc. The three-plane model, the seam edges, and the two-edge-class ownership rule are established in `product-ui-app-module-nodes/design.md` (shared doctrine) — this design assumes them and focuses on *how the product subgraph is derived and kept in sync*.

It rides on `runtime-lens-mechanism`: that change turns a lens definition + store into a matched subgraph. The projection consumes that subgraph; it does not re-implement traversal. It builds on `product-ui-app-module-nodes`: the node and edge types it materializes.

## Goals / Non-Goals

**Goals:**
- A pure-ish function `project(businessSubgraph) → productSubgraph` plus an idempotent `apply` that upserts the result into the store.
- Stable identity so re-derivation is convergent, not duplicative, and never disturbs authored governance edges.
- Forward-only completeness: surface where the business isn't built out.

**Non-Goals:**
- Rendering / `data-ui-planned` visuals (a renderer consumes the `planned` flag; that's UI work, not this change).
- Governance edges (`product-ui-governance`).
- Bidirectional/orphan-UI coverage analysis (forward chain only for v1; reverse coverage is a noted follow-up).

## Decisions

### Decision: identity key = (business node, level, parent)

A derived product node's identity is `hash(realized_as target id + UI level + containing parent id)`. Re-running the projection recomputes the same keys, so structural edges are **upserted** (created if absent, left alone if present, removed if the business node disappeared). This is the mechanism that makes derivation convergent and lets governance edges survive — the node keeps its id across runs, so edges pointing *at* it persist.

*Alternatives considered:* (a) wipe-and-rebuild the product subgraph each run — simplest but destroys authored governance edges; rejected. (b) content-hash of the whole node — unstable under cosmetic changes; rejected. The triple key is the minimal stable identity.

### Decision: level resolution = explicit binding, else type-default

For each business node, the UI level is:
1. the target level of an explicit `realized_as` edge if the user/agent authored one, else
2. the type default: `Domain→App`, `Process→Module`, `Task→Page`, `Operation→Component`, `Resource→form/Element grouping`.

This keeps the common case zero-config while letting a single edge reshape the surface (Process→Page collapses a flow to one screen; Task→Section turns tasks into a board). Defaults live in the projection; overrides live in the graph.

### Decision: completeness is the forward invariant chain

A derived node is `complete` iff its forward backing resolves; otherwise `planned`:

| Node | Complete when |
|---|---|
| App (Domain) | Domain has ≥1 Process |
| Module/Workflow (Process) | Process has ≥1 Task |
| Page/Section (Task) | Task performs ≥1 Operation |
| Component (Operation) | Operation declares ≥1 `changes` |
| form (Resource) | the Resource surfaced has the Operations its Task needs |

The `planned` flag is **derived**, recomputed every run — it is never authored. A renderer maps `planned → data-ui-planned`. This is what makes "the product is also the gap report" true.

### Decision: API projection shares the Operation walk

`Endpoint` nodes derive from the same `Operation` nodes the UI walk visits: each Operation reachable in the business subgraph yields an `Endpoint` (`exposes` that Operation), grouped into a `Namespace` per Domain (reusing the existing API grouping primitive, per `product-ui-app-module-nodes`). UI and API are two sinks of one traversal.

## Risks / Trade-offs

- **Re-sync removing a node that has authored governance edges** (business node was deleted) → don't hard-delete; mark the product node `orphaned` and let governance review it, rather than silently dropping role assignments. (Soft-delete policy.)
- **Level override creating cycles** (Process realized as a Page that contains a Module realizing a parent Domain) → the projection walks the business DAG, not the product graph, so product-side cycles can't form from a tree business walk; guard anyway.
- **Cost on large graphs** → projection is O(business subgraph); it runs against an already-scoped, Domain-anchored subgraph from the evaluator, not the whole store.

## Resolved Questions

- **Backing removed** → **Soft-delete.** When a product node's business backing vanishes, the projection SHALL mark the node orphaned/soft-deleted (not hard-delete it), so its authored governance edges survive for review rather than silently disappearing.

## Open Questions

- Should `planned` be a derived attribute on the node or a separate computed overlay returned alongside the subgraph? (Leaning: derived attribute, recomputed on apply, so any consumer sees it without re-deriving.)
