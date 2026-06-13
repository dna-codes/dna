## Why

Once App/Module/Page and Endpoint exist as graph nodes (`product-ui-app-module-nodes`), we want them **derived from the business graph, not hand-built** — and we want the derivation to expose where the business itself isn't built out. A product surface should fall out of the business structure: a `Domain` implies an App, its `Process`es imply Modules/Pages, their `Task`s imply Pages/Sections, the `Operation`s those tasks perform imply Components and Endpoints. Where that forward chain breaks (a Process with no Tasks, a Task with no Operation), the corresponding product node is **planned**, not real — so the running product doubles as a map of unbuilt business. Because lenses are evaluated at runtime (`runtime-lens-mechanism`), this is rendered live; nothing is generated to disk.

## What Changes

- Define a **projection**: business subgraph (anchored at a `Domain`) → product subgraph, materializing `App/Module/Workflow/Page/Section/Component` and `Endpoint` nodes with `realized_as`/`exposes`/`contains` edges, by walking `Domain → Process → Task → Operation → Resource`.
- Give each derived product node a **stable identity** keyed by `(realized_as business node) + (UI level) + (containing parent)`, so re-running the projection **upserts** structural edges idempotently.
- **Preserve governance edges**: re-derivation reconciles only the structural edge class; authored edges (added later by `product-ui-governance`) are never touched.
- Apply the **realized-level resolution**: a business node's UI level comes from an explicit `realized_as` binding if present, else a type-default (`Domain→App`, `Process→Module`, `Task→Page`, `Operation→Component`). This makes wizard-vs-board and module-vs-page a graph decision.
- Compute a **completeness state** per node from the forward invariant chain; a node whose business backing is incomplete is marked `planned` (the signal a renderer surfaces as `data-ui-planned`).
- Run the projection on the runtime lens evaluator (it consumes the evaluated subgraph; it does not re-implement traversal).

## Capabilities

### New Capabilities
- `product-projection`: The runtime derivation of the Product UI + API subgraph from a business subgraph — the projection rules (business node → UI level with default + override), stable identity keying, idempotent structural re-sync that preserves governance edges, and the forward-invariant completeness/`planned` state.

## Impact

- **`packages/core`** — a projection module consuming the `lens-evaluation` output (from `runtime-lens-mechanism`) and emitting/upserting product nodes + structural edges against the `DnaDataStore`.
- **Depends on** `product-ui-app-module-nodes` (the node/edge types) and `runtime-lens-mechanism` (the evaluator) and the `groupings-as-anchored-queries` doctrine (anchored subgraphs, graph-as-truth).
- No codegen artifacts — the projection materializes graph nodes that a runtime lens renders.
- Sets up `product-ui-governance` (governance edges attach to the nodes this change materializes).
