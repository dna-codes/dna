## Context

`business-to-product-projection` shipped the pure `project(businessSubgraph) → productSubgraph` (deterministic, store-free). This change adds the two things that turn that into live graph state: (1) registering the product types at runtime, and (2) `applyProjection` persistence. It is the shared prerequisite for `product-ui-governance` and for a live product/app-preview lens.

Runtime type registration today: `seedPack(store, pack)` does `pack.resourceTypes.map(rt => store.resourceType.create(rt))`; `seedFromDna(dna)` seeds from operational DNA. Either pattern works for product types — `store.resourceType.create({ name, category, attribute_schema, stability })` is the primitive.

## Goals / Non-Goals

**Goals:**
- Idempotent `seedProductTypes(store)` registering the product UI/API resource + structural relationship types (derived from the registered schemas).
- `applyProjection(subgraph, store)` — idempotent instance upsert by the projection's stable identity, plus structural link creation.
- Re-apply preserves authored governance edges; orphaned product nodes are soft-deleted, not dropped.
- Settle the source-graph vocabulary so the projection actually matches real data.

**Non-Goals:**
- The governance edges themselves (`can_access`/`assigned_to`) — `product-ui-governance`.
- A render surface for the persisted product graph (a follow-on lens/panel).
- Changing the pure `project` algorithm.

## Decisions

### Decision: register types from the schemas, not a hand-written pack

`seedProductTypes` derives the resource/relationship types from the already-registered `product/ui/*` schemas (title → type name, category from the schema, stability default) rather than duplicating a pack table — keeping the runtime registry in lock-step with the schema layer. Idempotent via the existing "skip if name already exists" guard `seedPack` uses.

### Decision: identity-keyed upsert, structural-only reconcile

`applyProjection` stores each `ProductNode` as an instance whose lookup key is the projection's `node.key` (persisted as a stable attribute, e.g. `_projectionKey`). On re-apply: present key → leave; absent key → create; key gone from the new subgraph but instance carries governance edges → soft-delete (mark, don't remove). Only `contains`/`realized_as`/`exposes` links are reconciled; `can_access`/`assigned_to` are never read or written here. This is the mechanism that lets the projection re-run without disturbing authored access.

### Decision (RESOLVED): the source-graph vocabulary — core operational graph is canonical

The projection walks by **node type** (`project` derives adjacency from links irrespective of relationship-type names), so it is vocabulary-agnostic on the *edge* names — but the **source business subgraph** must actually contain `Domain`/`Process`/`Task`/`Operation` *node* types. Two candidate sources exist:

- **Core operational graph** — operational DNA seeded via `seedFromDna`. Its node types are the operational primitives (`Domain`, `Process`, `Task`, `Operation`), exactly the types `project` walks; the `Domain↔Process` and `Task↔Operation` connections are the operational `relationships[]`/containment links seeded alongside. This is the canonical source.
- **dna-agent starter packs** (`packages/mcp/src/packs/operational.ts`) — these register a *different, flatter* vocabulary: resource types `person`/`position`/`department`/`company`/`process`/`step` and relationship types `belongs_to`/`assigned_to`/`next_step`. There is **no `Domain`/`Task`/`Operation`** node type here, so this data does **not** project without a bridge that maps `process`/`step` → the projection's `Process`/`Task`/`Operation` levels.

**Decision:** the core `seedFromDna` operational graph is the canonical projection source. The pack-vocabulary bridge (mapping `process`/`step` adjacency into the projection's expected node types) is **deferred** to a follow-on, to be added if/when the dna-agent demo needs live projection. Because `project` and `applyProjection` key off node `_typeName` and structural product keys — never off operational relationship-type names — no relationship-name confirmation is required to ship this change; the source lens simply has to emit `Domain`/`Process`/`Task`/`Operation`-typed nodes.

## Risks / Trade-offs

- **Soft-delete accumulation** → orphaned product nodes linger; needs an eventual reap/garbage step (out of scope; a later cleanup pass).
- **Identity key persisted on the instance** → if the key scheme changes, existing instances mismatch; keep the key derivation stable and versioned.
- **Schema-derived registration drift** → if a schema title differs from the desired type name, registration names diverge; assert names against the projection's expected types in a test.

## Open Questions

- Where does `applyProjection` live — `packages/core` (pure-ish, takes a store) or `packages/mcp` (alongside seeding)? Leaning `packages/core` next to `project`, since it only needs the `DnaDataStore` interface.
- Does the live product lens read persisted product nodes (this change) or re-`project` on the fly each render? (Deferred to the render follow-on.)
