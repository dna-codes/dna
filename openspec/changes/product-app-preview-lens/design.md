## Context

The dna-agent renders graph views as **lenses**: an MCP-server lens builder takes the live `DnaDataStore` and returns a view model over HTTP (`GET /lens/<name>`); the Next.js app proxies it (`/api/lens/<name>`) and a panel renders it. `LensPanelShell` gates which tabs appear by **mode** (Build = type/grammar lenses, Operate = pack instance lenses) and pack.

Three pieces from earlier changes converge here, all unconsumed by the app today:
- `project(businessSubgraph)` (pure) walks an evaluated business subgraph into a `ProductSubgraph` of App/Module/Workflow/Page/Component nodes with stable keys and `planned` flags; `seedProductTypes`/`applyProjection` persist it.
- `can_access` / `assigned_to` governance edges + `resolveStructuralAccess` (coarse gate doctrine).
- `@dna-codes/dna-react` `<Surface>` (coarse) and `<Operation>` (fine) gates.

This change is the **consumer**: a single Operate-mode lens that runs the projection and renders the gated tree. It introduces no new doctrine.

## Goals / Non-Goals

**Goals:**
- An Operate-mode lens that shows the App→Module→Workflow→Page tree the projection derives from the current business graph.
- Surfaces gated by `can_access` (coarse, `<Surface>`); action controls gated by `<Operation>` (fine). Both composed exactly as the gate doctrine specifies.
- A **preview-as** selector (role/user) so the same tree can be viewed through different subjects' access.
- Reuse the existing lens plumbing (MCP builder → proxy route → panel → tab registration) with no new transport.

**Non-Goals:**
- Changing the projection, the gate doctrine, or `resolveStructuralAccess`.
- Authoring `can_access` edges from this lens (it *reads* them; authoring is a separate governance surface).
- Editing the product graph from the preview (read-only view this iteration).
- A Build-mode variant (Build shows types; this is an instance/derived view → Operate only).

## Decisions

### Decision: the lens renders a read-only projection; persistence is opt-in, not on-render

The builder computes the tree with the **pure** `project()` over the evaluated business subgraph and returns it. It does **not** call `applyProjection()` on every GET — a write-on-read side effect is surprising and makes a read endpoint mutate the store. Governance edges (`can_access`) still attach to *persisted* product nodes, so the builder overlays any persisted nodes' `can_access`/`assigned_to` edges onto the matching projected nodes by their stable `_projectionKey`. Materializing (running `applyProjection`) stays an explicit action elsewhere (e.g. an agent tool / governance flow), out of this lens's render path.

*Alternative considered:* run `applyProjection` inside the builder so every node is real and directly carries edges. Rejected: idempotent but still a mutation on a read; couples preview to persistence and risks orphan/soft-delete churn on every poll.

### Decision: the view model carries the gate inputs, the panel owns the gating

The builder returns: the node tree (`id`=`_projectionKey`, `name`, `level`, `planned`, children), a flat `access` snapshot (`grants: {subject, surface}[]`, `contains: {parent, child}[]`) built from `can_access` + the projection's `contains`, and `surfaceOperations` (which operations each surface exposes, from the projected Component/Operation nodes). The panel wraps itself in `<DnaProvider access={snapshot} userId roles>` and renders each node inside `<Surface id={node.id}>`, each action inside `<Operation name=…>`. This keeps the coarse/fine resolution in the shipped, tested `@dna-codes/dna-react` components rather than re-deriving access in the panel.

### Decision: preview-as subject selector drives the gate

The agent app has no end-user identity, so the coarse gate needs a chosen subject. The panel offers a **preview-as** control listing the roles present in `access.grants` (plus an "all access" bypass for authors). The selection sets `roles` on the `DnaProvider`; switching it re-gates the tree live. This turns the lens into a governance review tool ("what does an Underwriter see?").

### Decision: Operate-only tab, registered per pack via `tabsForMode`

Add the tab to the Operate `PACK_TABS` (at least `operational`; included wherever a product app is meaningful) with a stable id `product-app-preview`, so agent `activate_lens` routing maps naturally and Build mode never shows it. `tabsForMode` already returns `BUILD_TABS` for Build, so no Build leakage.

## Risks / Trade-offs

- **Empty/`planned`-heavy tree** when the business graph is thin → render `planned` nodes in a muted/"planned" state rather than hiding them, so the preview shows the intended shape. (Mirrors the `planned` flag the projection already sets.)
- **Read-only preview diverges from persisted nodes** (a projected key with no persisted node carries no `can_access`) → acceptable: such a node is `planned`/not-yet-materialized and shows as ungoverned; the overlay-by-key keeps governed nodes correct once materialized.
- **Subject-id mismatch** between `access.grants` subjects (role names / user ids) and the `DnaProvider` `roles`/`userId` → the builder MUST emit subjects as the same role-name space the panel passes; covered by a builder test asserting a granted role reaches its surface end-to-end.
- **Preview-as "all access" bypass** could be mistaken for real access → label it clearly as an author bypass; it sets no real grant and never persists.

## Open Questions

- Should the preview offer a one-click **Materialize** action (run `applyProjection`) so authors can turn the previewed tree into real, governable nodes? (Likely yes as a follow-on; kept out of the read path here.)
- Should `assigned_to` (a user's home app) drive an initial default selection in the preview-as control when a user identity is present?
