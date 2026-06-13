## 1. Pure projection

- [x] 1.1 Add `packages/core/src/projection/types.ts` — `ProductLevel`, `ProductNode { key, level, name, realizes, parentKey?, planned }`, `ProductEdge { from, to, via }`, `ProductSubgraph`, `ProjectOptions { levelOverrides? }`.
- [x] 1.2 Add `packages/core/src/projection/project.ts` — `project(business: LensDataResult, opts?) → ProductSubgraph`. Type-driven adjacency walk `Domain→Process→Task→Operation`; emit App/Module/Page/Component with `contains` + `realized_as` edges.
- [x] 1.3 Level resolution: explicit `levelOverrides[bizId]` else type default (`Domain→app`, `Process→module`, `Task→page`, `Operation→component`).
- [x] 1.4 Stable identity key `(realizes, level, parent)`; dedupe emitted nodes by key.
- [x] 1.5 Completeness `planned` per the forward chain (Domain→Process→Task→Operation→`changes`).
- [x] 1.6 API: one `Namespace` per Domain (`realized_as`), one `Endpoint` per reached Operation (`exposes`), Endpoint `contains`-ed by its Domain's Namespace; dedupe Endpoints per Operation.
- [x] 1.7 Export `project`, `ProductSubgraph`, and the related types from `packages/core/src/index.ts`.

## 2. Tests

- [x] 2.1 Walk: a Domain→Process→Task→Operation subgraph yields App→Module→Page→Component with correct `realized_as`/`contains` edges.
- [x] 2.2 Determinism: projecting the same subgraph twice yields the same node-key set.
- [x] 2.3 Level override: a Process overridden to `page` is emitted at `page`.
- [x] 2.4 Completeness: Process-without-Task → planned module; Operation-without-changes → planned component.
- [x] 2.5 API: two operations under one domain → one Namespace containing two Endpoints; an operation reached via two tasks → one Endpoint.

## 3. Wrap-up

- [x] 3.1 Note the deferred follow-ups in the change/proposal: `apply()` persistence + runtime UI-type registration; the core↔pack relationship vocabulary bridge; confirming `Domain↔Process`/`Task↔Operation` relationship names.
