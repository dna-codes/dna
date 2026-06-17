## Context

The App Preview lens (`packages/mcp/src/lenses/product-app-preview.ts`) builds its tree from `project()` (`packages/core/src/projection/project.ts`), which maps business→product as domain→App, process→Module, task→Page, operation→Component — App→Module→Page→Component only. The product *schemas* (`packages/schemas/product/ui/{workflow,section,component,element}`, `web/{layout,route}`) already define a richer hierarchy, and `seedProductTypes()` / `applyProjection()` / `PRODUCT_LEVEL_TYPE_NAME` (`packages/core/src/projection/apply.ts`) already register most product types and the `contains`/`realized_as`/`exposes` + `can_access`/`assigned_to` relationship types. The pieces exist; they are not wired into the runtime lens, panel, or a seed.

Key schema facts that shape the design:
- A `Component` already carries a required **`type`** field (`button`/`form`/`table`/`dropdown`/`modal`/`input`/…) and optional `resource`/`operation` references (per `product-ui-hierarchy`). We reuse `type` as the ui-library binding and `resource` as the data binding — **no new `uiComponent` attribute is invented**.
- A `Workflow` contains `pages[]`; a `Section` has a `role` and inline `components[]`. These map cleanly to graph nodes + `contains` edges.
- `Layout` exists only as `web/layout` + a `Route.layout` name reference; it is **not** registered as a product type today.
- `@dna/ui-library` exposes `Application`/`ApplicationModule`/`Page`/`Workflow`/`Content`/`Container`/`Header`/`Sidebar`/`Footer` and atomics (`Button`/`Card`/`Select`/`Input`/`Badge`/`Dialog`/`Tabs`/`Tag`/…) but **no Table/List/Grid**.

## Goals / Non-Goals

**Goals:**
- App Preview renders an authored product-UI graph: App→Module→Workflow→Page→Section→Component over `contains`.
- Components bind to real `@dna/ui-library` elements via their `type`; pages render their `Layout` chrome.
- Per-page record tables come from a Component's `resource` binding (e.g. an Orders `table` bound to `order`).
- One re-runnable ecommerce seed lights up the operational lenses *and* the App Preview.
- Backward compatible: graphs with no materialized `App` still render via `project()`.

**Non-Goals:**
- Adding a real `Table` primitive to `@dna/ui-library` (out of scope; use the existing `RecordTable` shim).
- Changing `project()`'s derivation rules (kept as the fallback scaffolder).
- Static fixture work in `examples/ecommerce/dna.json` (`ecommerce-example` capability is separate).
- Agent/system-prompt changes to auto-author product graphs (possible follow-up).

## Decisions

**1. Render the materialized product graph; fall back to `project()`.**
The lens first reads product instances (types from `PRODUCT_LEVEL_TYPE_NAME`) and `contains` edges and builds the tree from them. If no `App` instance exists, it runs the current `project()` path unchanged. *Why:* satisfies the authored-node requirement without breaking existing derived graphs or their tests. *Alternative rejected:* pure derivation (can't express Layout/Section/specific ui-library components); pure replacement (breaks existing behavior).

**2. Reuse `Component.type` + `Component.resource` rather than new attributes.**
`type` → ui-library element; `resource` → the business resource type whose instances fill a record table. *Why:* the schema already defines these; avoids drift. *Alternative rejected:* a bespoke `uiComponent`/`binds` pair (redundant with the schema).

**3. `Layout` is a referenced type, not a containment level.**
Register a `Layout` product type; a `Page` references it via a `layout` attribute (matching `Route.layout` being a name). The panel renders layout *chrome* (sidebar/header/content) around the page; Layout is not a parent in the `contains` tree. *Why:* matches the web schema and keeps the tree single-rooted. *Alternative rejected:* Layout as a tree node above Page (conflicts with Module→Workflow→Page containment).

**4. `table` components render via the existing `RecordTable` shim.**
Since ui-library has no Table, a Component of `type: "table"` renders the `RecordTable` already in the panel, sourced from `surfaceRecords` keyed by the component's bound `resource`. *Why:* reuses working code; avoids submodule changes. *Trade-off:* not a true ui-library primitive (flagged as a follow-up).

**5. Seed via `patch_graph` over HTTP, three layers in one script.**
Extends the existing `scripts/seed-ecommerce.mjs` orchestration (build-mode flip before session init, operate-mode restore). *Why:* transport-agnostic (memory or Neo4j), already proven this session.

## Risks / Trade-offs

- [Lens behavior change could regress derived graphs] → guarded by the `project()` fallback + retained derived-path tests.
- [No ui-library Table] → `RecordTable` shim; documented as a follow-up if a real primitive is wanted.
- [In-app reset wipes Neo4j and reseeds the pack] → seed is re-runnable; documented in README.
- [Component `type` vocabulary vs ui-library names may not be 1:1] → a single mapping table in the panel with a labeled placeholder fallback for unmapped types.
- [Seed appends instances on re-run] → reset/clear before reseeding for a clean graph (documented).

## Migration Plan

Additive. Rebuild `packages/core` then `packages/mcp` (`tsc`), restart the MCP server (Neo4j preserves data), run the seed. Rollback = revert the packages; the lens fallback means an un-migrated graph still renders.

## Open Questions

- Should a real `Table`/`DataTable` be added to `@dna/ui-library` later (separate submodule change)?
- Should the agent's Operate-mode prompt learn to author product-UI nodes so users get this by chatting (follow-up to the earlier system-prompt question)?
