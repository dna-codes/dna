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

### Decision (OPEN — to resolve here): the source-graph vocabulary

The projection walks by node type, so it is vocabulary-agnostic — but the **source business subgraph** must actually contain Domain/Process/Task/Operation nodes and the links among them. The core operational model emits `Process_Task`, `Operation_Resource` (PascalCase `From_To`); the dna-agent starter packs emit `belongs_to`, `assigned_to`, `next_step`. The lens that feeds `project` must target whichever graph is canonical for this feature.

- **Option A — core operational graph.** Feed `project` from operational DNA seeded via `seedFromDna` (the `From_To` graph). Clean, canonical; but the dna-agent demo data (pack vocabulary) won't project without a bridge.
- **Option B — bridge the pack vocabulary.** Map pack relationship names → the projection's expected adjacency so agent-created data projects directly.
- **Recommendation:** A for correctness now (canonical core graph), B as a follow-on if/when the dna-agent demo needs live projection. Confirm the exact `Domain↔Process` and `Task↔Operation` relationship names against the seeding before wiring the source lens.

## Risks / Trade-offs

- **Soft-delete accumulation** → orphaned product nodes linger; needs an eventual reap/garbage step (out of scope; a later cleanup pass).
- **Identity key persisted on the instance** → if the key scheme changes, existing instances mismatch; keep the key derivation stable and versioned.
- **Schema-derived registration drift** → if a schema title differs from the desired type name, registration names diverge; assert names against the projection's expected types in a test.

## Open Questions

- Where does `applyProjection` live — `packages/core` (pure-ish, takes a store) or `packages/mcp` (alongside seeding)? Leaning `packages/core` next to `project`, since it only needs the `DnaDataStore` interface.
- Does the live product lens read persisted product nodes (this change) or re-`project` on the fly each render? (Deferred to the render follow-on.)
