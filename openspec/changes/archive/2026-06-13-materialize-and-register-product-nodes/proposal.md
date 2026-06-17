## Why

The pure projection (`business-to-product-projection`) computes the product subgraph the business implies, but nothing **persists** it, and the store doesn't know the product types: you can't create an `App` instance until an `App` resource type is registered at runtime. Both the projection's persistence and `product-ui-governance` (whose `can_access`/`assigned_to` edges attach to real `App`/`Module`/`Page` nodes) are blocked on this one prerequisite. This change registers the product UI/API types at runtime and adds `apply()` — turning the computed subgraph into persisted graph nodes with stable identity — so the rest of the arc has real nodes to work with.

## What Changes

- **Register product types at runtime.** Add `seedProductTypes(store)` that creates the product UI/API **resource types** (`App`, `Module`, `Workflow`, `Page`, `Section`, `Component`, `Element`, plus reusing `Endpoint`/`Namespace`) and the structural **relationship types** (`contains`, `realized_as`, `exposes`) — derived from the registered schemas, mirroring how `seedPack` creates types. Idempotent; safe to re-run.
- **Persist the projection.** Add `applyProjection(subgraph, store)` that upserts product **instances** keyed by the projection's stable identity (`create` when new, leave when present, no duplicates) and creates the `contains`/`realized_as`/`exposes` **links**. It reconciles only these structural edges.
- **Preserve governance, soft-delete orphans.** Authored edges on a product node (the `product-ui-governance` class) are never touched by re-apply. A product node whose business backing has vanished is marked orphaned (soft-deleted), not hard-deleted, so its governance edges survive review.
- **Resolve the vocabulary question (DECISION in design).** Pin which business relationship vocabulary the projection's source lens evaluates against — the core operational `From_To` names vs the dna-agent pack names — and whether a bridge is needed.

## Capabilities

### New Capabilities
- `product-type-registration`: Registering the product UI/API resource and structural relationship types in a `DnaDataStore` at runtime (derived from the schemas), so product instances can be created. Idempotent.
- `product-projection-apply`: `applyProjection(subgraph, store)` — idempotent persistence of a projected product subgraph (instance upsert by stable identity, structural link creation), preserving authored governance edges and soft-deleting product nodes whose business backing is gone.

## Impact

- **`@dna-codes/dna-core`** (or `packages/mcp` seeding) — `seedProductTypes`; `applyProjection` consuming `ProductSubgraph` + a `DnaDataStore`.
- **Depends on** `product-ui-app-module-nodes` (the schemas/types), `business-to-product-projection` (the pure `project` output), and `runtime-lens-mechanism` (the business subgraph source).
- **Unblocks** `product-ui-governance` (real nodes for `can_access`) and a live Product/App-preview lens (renders persisted product nodes with `planned` markers).
