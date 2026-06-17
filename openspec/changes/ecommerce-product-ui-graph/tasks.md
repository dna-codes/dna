# Tasks

## 1. Core — register the Layout product type

- [x] 1.1 Add `'layout'` to the `ProductLevel` union in `packages/core/src/projection/types.ts`
- [x] 1.2 Add `layout: 'Layout'` to `PRODUCT_LEVEL_TYPE_NAME` in `packages/core/src/projection/apply.ts`
- [x] 1.3 Include the `web/layout` schema in `productResourceSchemas()` so `seedProductTypes` registers a `Layout` type
- [x] 1.4 Verify a `product/web/layout` schema exists (title `Layout`); add/adjust if missing
- [x] 1.5 Update `packages/core` projection tests: `Layout` registered, `PRODUCT_LEVEL_TYPE_NAME` complete

## 2. MCP — render the materialized product-UI graph in the lens

- [x] 2.1 Add `readProductGraph(store)` to `packages/mcp/src/lenses/product-app-preview.ts`: read product-type instances (`App`/`Module`/`Workflow`/`Page`/`Section`/`Component`) + `contains` edges, build the nested tree rooted at each `App`
- [x] 2.2 Extend `PreviewNode` with `uiType?` (from Component `type`) and `layout?` (from Page `layout`); populate from materialized instances
- [x] 2.3 Compute `surfaceRecords` from each Component's `resource` binding (instances of that type → rows), reusing the existing column logic (`id`/`_`-prefixed excluded)
- [x] 2.4 When no `App` instance exists, fall back to the existing `project()`-based build (unchanged)
- [x] 2.5 Preserve the `can_access` governance overlay and `subjects` for both paths
- [x] 2.6 Export any new view-model fields from `packages/mcp/src/index.ts`
- [x] 2.7 Update/extend `packages/mcp` lens tests: materialized tree, fallback path, binding-driven records, governance overlay
- [x] 2.8 `bin.ts` calls `seedProductTypes` on boot + reset (idempotent) so product types + `contains`/`realized_as`/`can_access` (with `*` endpoints) are always registered for authored graphs

## 3. App — render the deep tree with @dna/ui-library components

- [x] 3.1 Extend `ProductAppPreviewPanel.tsx` tree rendering to App→Module→Workflow→Page (navigable pages)
- [x] 3.2 Add a `Component.type → @dna/ui-library` map (Button/Card/Select/Input/Badge/Dialog/Tabs/Tag/…) with a labeled placeholder fallback for unmapped types
- [x] 3.3 Render an opened Page with its Layout chrome (Application/Page/Sidebar/Content/Header/Footer) and its Sections
- [x] 3.4 Render a `table` Component via the existing `RecordTable`, sourced from `surfaceRecords` for the page's bound resource
- [x] 3.5 Reuse the existing React-dedupe config (`next.config.ts`, jest `moduleNameMapper`)
- [x] 3.6 Update/extend `ProductAppPreviewPanel.test.tsx`: navigate Page → renders sections, mapped components, and the orders table

## 4. Seed — full ecommerce graph

- [x] 4.1 Operational layer: `company`, `department`s, `position`s + `reports_to`, `person`s + `fills`, `process`es with `step`s wired by `next_step` + `assigned_to`
- [x] 4.2 Authored product-UI layer: `App` → `Module`s → `Workflow`s → `Page`s (with `layout`) → `Section`s → `Component`s (`type` + `resource` binding); `Layout` instances; `contains` tree
- [x] 4.3 Connect product → operational via `realized_as` (Module→process, Page→step) and author `can_access` grants from roles/positions to surfaces
- [x] 4.4 Business data: `order`, `product`, `customer` instances with display attributes
- [x] 4.5 Keep the script re-runnable (build-mode before session init, operate-mode restore, idempotent type registration)

## 5. Docs & verification

- [x] 5.1 Update `apps/dna-agent/README.md` (deep tree, ui-library binding, seed layers) and `packages/mcp/README` (materialized-vs-derived lens)
- [x] 5.2 Rebuild `packages/core` then `packages/mcp` (`tsc`); restart MCP on Neo4j; run the seed
- [x] 5.3 Verify `/lens/product-app-preview` (deep tree + records) and the operational lenses (`/lens/org-chart`, people-positions, reporting-chains, span-of-control, job-descriptions)
- [x] 5.4 Run `npx jest` in `packages/core`, `packages/mcp`, `apps/dna-agent` — all green
- [x] 5.5 Open the app at :3200 → Operate → App Preview → navigate Order Fulfillment → Orders → confirm the rendered page + orders table; "Preview as" a role re-gates
