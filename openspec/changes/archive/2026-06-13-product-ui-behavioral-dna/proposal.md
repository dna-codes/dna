## Why

The Product UI layer (`product.ui.json`) models only static structure (Page, Route, Block, Layout) — it has no hierarchy above Page and no way to describe what happens when a user interacts with the UI. This means DNA can describe *what exists* but not *what happens*, making it impossible to answer graph queries like "what breaks if UserDetailsPage is removed?" or to generate routes, tests, and component scaffolding from a single DNA source.

## What Changes

- Add a `Workflow` grouping above `Page` in the Product UI hierarchy, giving pages a navigable container and making module-scoped workflows first-class
- Add `Section`, `Component`, and `Element` as structural sub-primitives below `Page`, completing the full UI hierarchy (Workflow → Page → Section → Component → Element)
- Add `UIOperation` as a first-class behavioral primitive: a `trigger` (component + event) plus `effects[]` (navigate, api-call, state-change, render) — the product-layer equivalent of Operational's `Operation`
- Register all new Product UI primitives as graph nodes with typed relationships (`CONTAINS`, `RENDERS`, `TRIGGERS`, `NAVIGATES_TO`, `CALLS`, `REQUIRES`, `UPDATES`), making the UI fully graph-queryable
- Everything is modeled as resources and relationships — no behavioral state lives outside the graph

## Capabilities

### New Capabilities
- `product-ui-hierarchy`: Full structural hierarchy for product UI — Workflow, Page, Section, Component, Element — as DNA primitives with parent/child relationships
- `product-ui-operations`: `UIOperation` primitive with trigger (component + event) and effects (navigate, api-call, state-change, render) as first-class behavioral DNA at the product layer
- `product-ui-graph-model`: Typed node and relationship registration for all product UI primitives, enabling graph traversal, impact analysis, and artifact generation across the full UI surface

### Modified Capabilities
- `graph-data-resource-model`: Extend `ResourceType` and `RelationshipType` to include Product UI node and edge types (`workflow`, `page`, `section`, `component`, `element`, `ui-operation`, `CONTAINS`, `RENDERS`, `TRIGGERS`, `NAVIGATES_TO`, `CALLS`, `REQUIRES`, `UPDATES`)

## Impact

- `packages/schemas` — new JSON Schema files for `product/ui/workflow`, `product/ui/section`, `product/ui/component`, `product/ui/element`, `product/ui/operation`; updated `product.ui.json` composite to include new arrays
- `packages/core` — register new schemas; extend `ResourceType` / `RelationshipType` unions; update `availableSchemas()`
- `packages/adapters/output/markdown` — render new UI hierarchy and UIOperation in markdown output
- `examples/` — update or add a UI-layer example demonstrating the full hierarchy + behavioral operations
- No breaking changes to existing `product.ui.json` documents (all new fields are additive/optional)
