## 1. Resolve the source-graph vocabulary (design)

- [ ] 1.1 Confirm the exact operational relationship-type names for `Domain↔Process` and `Task↔Operation` against the seeding / graph-data-resource-model.
- [ ] 1.2 Record the decision (core `From_To` graph as canonical source; pack-vocabulary bridge deferred) in design.md.

## 2. Product type registration

- [ ] 2.1 Add `seedProductTypes(store)` registering the product UI/API resource types (App/Module/Workflow/Page/Section/Component/Element, reuse Endpoint/Namespace) and relationship types (contains/realized_as/exposes), derived from the `product/ui/*` schemas.
- [ ] 2.2 Make it idempotent (skip-if-exists by name), mirroring `seedPack`.
- [ ] 2.3 Tests: types appear in `resourceType.list()`/`relationshipType.list()`; an `App` instance can be created; re-running creates no duplicates.

## 3. Apply (persistence)

- [ ] 3.1 Add `applyProjection(subgraph, store)` — upsert each `ProductNode` as an instance of its level's resource type, stamping a stable `_projectionKey` attribute.
- [ ] 3.2 Create `contains`/`realized_as`/`exposes` links for `ProductEdge`s; resolve endpoint instance ids via the persisted keys.
- [ ] 3.3 Idempotent reconcile: present key → leave; new key → create; never duplicate.
- [ ] 3.4 Reconcile only structural links; never read or write governance edges.
- [ ] 3.5 Soft-delete: a previously-applied node absent from the new subgraph and carrying governance edges is marked orphaned, not removed.

## 4. Tests

- [ ] 4.1 Persist: App→Module→Page→Component subgraph yields the matching instances + contains/realized_as edges.
- [ ] 4.2 Idempotence: re-apply unchanged → no new instances/links; add one node → exactly one new instance.
- [ ] 4.3 Governance preservation: a `can_access` link survives re-apply.
- [ ] 4.4 Soft-delete: removing the backing of a governed node marks it orphaned.

## 5. Wrap-up

- [ ] 5.1 Export `seedProductTypes` and `applyProjection`; update README.
- [ ] 5.2 Note the unblocked follow-ons: `product-ui-governance` and the live product/app-preview lens.
