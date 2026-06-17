## Why

The dna-agent already projects a business graph into a Product-UI graph (`project`/`applyProjection`) and ships the gate components (`<Surface>`/`<Operation>`), but nothing surfaces them: Operate mode shows only operational *instance* lenses (Org Chart, Pipeline, …), never the App/Module/Page the projection produces. The payoff of the whole Product-UI-as-graph arc — *seeing the app your operations imply, governed by who can access it* — has no view. This change adds that view as an Operate-mode lens.

## What Changes

- Add a **product-app-preview** lens builder to the MCP server: it ensures the product types are seeded, runs the business→product projection over the evaluated business graph, and returns an App→Module→Workflow→Page tree (with `planned` flags) plus a `can_access`/`assigned_to` access snapshot and the operations each surface exposes.
- Add the proxy route `/api/lens/product-app-preview` in the dna-agent (mirroring the existing lens routes).
- Add a **`ProductAppPreviewPanel`** React component that renders the tree inside a `<DnaProvider>`, gating each surface with `<Surface>` (coarse `can_access`) and each action control with `<Operation>` (fine). A **"preview as" role/user selector** drives the subject so you can see the app as different roles.
- Register the lens as an **Operate-mode** tab in `LensPanelShell` (visible in Operate, hidden in Build) and wire it into the agent `activate_lens` routing.

## Capabilities

### New Capabilities
- `product-app-preview-lens`: An Operate-mode lens that derives the Product-UI graph from the business graph via the projection and renders the App/Module/Workflow/Page tree, gated by the two-grain access model (`can_access` coarse surfaces, `<Operation>` fine controls), with a preview-as-role selector.

### Modified Capabilities
<!-- None — the gate doctrine (operation-gate, product-ui-governance) and the projection (product-projection-apply) are consumed unchanged. -->

## Impact

- **`@dna-codes/dna-mcp`** — new `lenses/product-app-preview.ts` builder and a `/lens/product-app-preview` dispatch entry; consumes `project`/`seedProductTypes` and reads `can_access`/`assigned_to`/`contains` from the store.
- **`apps/dna-agent`** — new `app/api/lens/product-app-preview/route.ts`, new `components/ProductAppPreviewPanel.tsx`, and an Operate-tab registration in `components/LensPanelShell.tsx`.
- **Depends on** `product-projection-apply` (the projection + persistence), `product-ui-governance` (`can_access`/`assigned_to` + `resolveStructuralAccess`), and `operation-gate` (the fine `<Operation>` gate). Uses `@dna-codes/dna-react` `<Surface>`/`<Operation>` for rendering.
- No change to the projection, the gate doctrine, or the operational lenses.
