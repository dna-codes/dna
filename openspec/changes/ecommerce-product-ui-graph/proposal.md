## Why

The App Preview lens is *derived* by `project()`, which only emits App→Module→Page→Component and never produces Workflow, Layout, or Section, nor binds components to real `@dna/ui-library` elements. There is no worked ecommerce example that exercises both the operational lenses and a deep, authored product-UI tree — so the App Preview never demonstrates the full product hierarchy the schemas already define.

## What Changes

- The **App Preview lens** renders the **authored (materialized) product-UI graph** — `App → Module → Workflow → Page → Section → Component` walked over `contains` edges — instead of only the `project()` derivation. It exposes each Component's UI `type` (the existing schema field, e.g. `button`/`table`/`form`), each Page's `layout`, and computes per-page record tables from a Component's `resource` binding. Governance (`can_access`) overlay is preserved.
- **Backward compatible**: when no product `App` instance is materialized, the lens **falls back to the current `project()` build** unchanged.
- The **dna-agent panel** renders the deep tree and maps Component `type` → `@dna/ui-library` elements (Button/Card/Select/…); a `table` component renders via the existing `RecordTable` shim (ui-library has no Table primitive); pages render their Layout chrome.
- A new product **`Layout`** type is registered so pages can reference a named layout.
- A re-runnable **ecommerce seed** populates three layers in one graph: operational (company/departments/positions/people/processes/steps), authored product-UI (App/Module/Workflow/Page/Layout/Section/Component), and business data (orders/products/customers).

## Capabilities

### New Capabilities
- `product-app-preview-lens`: the App Preview lens view-model rendering the materialized product-UI graph (UI `type`, page `layout`, binding-driven record tables, governance overlay) with a `project()` fallback, plus the dna-agent panel that renders the tree using `@dna/ui-library` components.
- `ecommerce-product-ui-seed`: a re-runnable script that seeds a full ecommerce operational + authored product-UI + business-data graph into a running MCP server via `patch_graph`.

### Modified Capabilities
- `product-ui-hierarchy`: introduce a `Layout` primitive (a named page-wrapping layout); a `Page` MAY reference a `Layout` by name.
- `product-type-registration`: `seedProductTypes` also registers the `Layout` resource type (and `PRODUCT_LEVEL_TYPE_NAME` includes `layout`).

## Impact

- **core** (`packages/core/src/projection/apply.ts`, `types.ts`; `packages/schemas/product/web/layout`): Layout type/level registration.
- **mcp** (`packages/mcp/src/lenses/product-app-preview.ts`, `index.ts`): materialized-graph rendering, new view-model fields.
- **app** (`apps/dna-agent/components/ProductAppPreviewPanel.tsx`): deep-tree render + ui-library component map (reuses the existing React-dedupe config).
- **seed** (`scripts/seed-ecommerce.mjs`): expanded three-layer ecommerce seed.
- Docs + tests (core projection, mcp lens, app panel). No breaking changes — the lens fallback preserves existing derived behavior.
