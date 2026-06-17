## 1. MCP lens builder

- [x] 1.1 Add `lenses/product-app-preview.ts` in `@dna-codes/dna-mcp`: run `project()` over the evaluated business subgraph and return the `App→Module→Workflow→Page` tree (`id`=`_projectionKey`, `name`, `level`, `planned`, children). Read-only — no `applyProjection`/seeding on the render path (reads only already-registered product types; deviates from the original "ensure seeded" wording per the read-only design decision).
- [x] 1.2 Overlay persisted governance edges: read `can_access` and emit the view model's `access` snapshot (`grants[]`, `contains[]`) plus `surfaceOperations[]` and `operationAllows[]` (fine-gate inputs), keying onto projected nodes by `_projectionKey`. Subjects emitted as Role/User names.
- [x] 1.3 Register `/lens/product-app-preview` in the MCP server lens dispatch (`handleLensRequest`); export the view-model types from the package index.

## 2. dna-agent proxy + panel

- [x] 2.1 Add `app/api/lens/product-app-preview/route.ts` proxying to the MCP `/lens/product-app-preview` endpoint (mirroring the existing lens routes). Added `@dna-codes/dna-react` as a dna-agent dependency.
- [x] 2.2 Add `components/ProductAppPreviewPanel.tsx`: fetch the view model, render inside `<DnaProvider access={snapshot}>`, wrapping each surface in `<Surface id>` and each action control in `<Operation name>` (fine gate fed by a synthesized DNA from `operationAllows`); render `planned` nodes muted.
- [x] 2.3 Add the preview-as control (roles from `subjects` + an author bypass) driving the provider's `roles`/`access`; switching re-gates without re-fetching.

## 3. Operate-mode registration

- [x] 3.1 Register the `product-app-preview` tab in `LensPanelShell` Operate `PACK_TABS` (operational); `tabsForMode` returns `BUILD_TABS` in Build, so it never leaks there.
- [x] 3.2 Agent `activate_lens` routing: the lens id is advertised only in `operateModeSection`, and the client honors a lensId only when it is a tab of the current mode — so it resolves only in Operate mode.

## 4. Tests & docs

- [x] 4.1 Builder tests (`packages/mcp/src/__tests__/product-app-preview.test.ts`): tree mirrors `project()`; `planned` nodes included; building the view model twice mutates nothing; a persisted `can_access` on a Module surfaces in `grants`; `contains` is emitted for cascade.
- [x] 4.2 Panel tests (`apps/dna-agent/components/ProductAppPreviewPanel.test.tsx`, new jsdom/RTL harness): unreachable surface hidden + ungranted control disabled for a role; switching preview-as re-gates without re-fetch; author bypass reveals all surfaces. (Underlying `<Surface>`/`<Operation>` composition also covered in `@dna-codes/dna-react`.)
- [x] 4.3 Documented the Operate-mode App Preview lens in the dna-agent README (two-grain gating + preview-as, read-only projection).
