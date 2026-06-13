## 1. Projection core

- [ ] 1.1 Add a projection module in `packages/core` that consumes a `lens-evaluation` subgraph (Domain-anchored) and returns a product subgraph (nodes + structural edges).
- [ ] 1.2 Implement the business walk `Domain → Process → Task → Operation → Resource`, emitting App/Module/Workflow/Page/Section/Component/Endpoint per the projection rules.
- [ ] 1.3 Implement level resolution: explicit `realized_as` binding, else type default.

## 2. Identity & idempotent apply

- [ ] 2.1 Implement the stable identity key `(realized_as target, level, parent)` for every derived node.
- [ ] 2.2 Implement `apply(productSubgraph, store)` that upserts structural edges idempotently against those identities (create new, leave existing, no duplicates).
- [ ] 2.3 Ensure the reconcile touches only structural edges; never delete or modify governance edges.
- [ ] 2.4 Implement soft-delete/orphan marking for product nodes whose business backing was removed but that carry governance edges.

## 3. Completeness state

- [ ] 3.1 Compute the derived `planned`/`complete` state per node from the forward invariant chain; recompute on every apply.
- [ ] 3.2 Expose the state on the node (or alongside the subgraph) so a renderer can map `planned → data-ui-planned`.

## 4. API projection

- [ ] 4.1 Materialize an `Endpoint` (`exposes` Operation) for each Operation reached in the walk, grouped into a `Namespace` per Domain (reuse the existing API grouping).

## 5. Tests

- [ ] 5.1 Convergence: projecting twice over an unchanged graph creates no new nodes/edges.
- [ ] 5.2 Incremental: adding one Task adds exactly one product node; removing the backing Process orphans (not deletes) a governed Module.
- [ ] 5.3 Governance preservation: a `can_access` edge survives re-derivation.
- [ ] 5.4 Completeness: Task-without-Operation marks the action `planned`; filling the gap clears it.
- [ ] 5.5 Level override: Process bound to a Page realizes tasks as Sections.
