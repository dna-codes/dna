## Why

The Product UI hierarchy in `product-ui-graph-model` starts at `Workflow` — there is no `App` or `Module` node, and the API surface (endpoints/services) isn't in the graph at all. That blocks the thing we actually want: giving product surfaces **real identity in the graph** so users, roles, resources, and actions can be assigned to an App or Module *independently* of the operations inside it. Per the core DNA principle — "everything is resources and relationships; no structural hierarchy lives outside the graph" — the product surface must be modeled as nodes, not computed on the fly. This change adds the missing top rungs (App, Module) and the API rungs (Endpoint, Service) as first-class graph types, plus the `realized_as` binding that links each product node to the business node it surfaces.

- Register **two** new resource types: `product/ui/app` and `product/ui/module`. (The API layer already has `product/api/endpoint` and `product/api/namespace` — those are reused, not re-created.)
- Position `App` and `Module` above `Workflow`/`Page` in the UI containment hierarchy: `App → Module → Workflow → Page → Section → Component → Element`.
- Express graph relationships as **lens edges** in `packages/core/lenses/product-ui.json` (that is how the Product UI graph model is defined today — there is no separate relationship registry). Add:
  - **`realized_as`** — a product node points to the business node it surfaces (`App → Domain|Group`, `Module → Domain|Process`, `Workflow|Page → Process|Step`, `Section → Step`, `Component → Operation`, `Namespace → Domain`). The *level* is a per-node binding with a type default, so the same Process can realize as a Module or a Page.
  - **`exposes`** — `Endpoint → Operation`, derived from the existing endpoint's `operation` field (the API analog of `calls`).
  - **`contains`** rungs for the new top of the hierarchy (`App → Module`, `Module → Workflow|Page`).
- App/Module compose the shared stability base (so they carry `stability`).

## Capabilities

### New Capabilities
- `product-ui-app-module`: The `App` and `Module` UI primitives as graph resource types, plus the `realized_as` (product→business surfacing) and `exposes` (endpoint→operation) lens edges and the extended `contains` hierarchy. The API surface reuses the existing `Endpoint` and `Namespace` types.

### Modified Capabilities
- `product-ui-graph-model`: The Product UI containment hierarchy gains `App` and `Module` above `Workflow`; the graph-relationship table adds `realized_as`, `exposes`, and the new `contains` rungs; the `product-ui` lens coverage extends to `app`, `module`, `endpoint`, `namespace`.

## Impact

- **`@dna-codes/dna-core`** — register `product/ui/app` and `product/ui/module`; extend the `product-ui` lens with the new nodes (app, module, endpoint, namespace) and edges (`contains`, `realized_as`, `exposes`); `availableSchemas()` gains App/Module.
- **Schema composites** — `product.ui.json` accepts top-level `apps[]`/`modules[]`. The API composite already carries endpoints/namespaces.
- Prerequisite for `business-to-product-projection` (which derives these nodes) and `product-ui-governance` (which attaches access edges to them).
- Depends on the `groupings-as-anchored-queries` doctrine (graph-as-truth).
