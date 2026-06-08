## Context

`product.ui.json` currently composes three primitives: `Layout`, `Page` (with inline `Block`s), and `Route`. Pages map to a Resource but carry no structural grouping above them and no behavioral modeling — there is no way to express that a button click navigates to another page, calls an API, or changes state. The Operational layer already models Intent → Action → Effect via `Trigger → Operation → changes[]`; this change brings equivalent behavioral modeling to the Product UI layer.

Everything in DNA is modeled as resources (nodes) and relationships (typed edges). This change extends that principle fully into the UI layer.

## Goals / Non-Goals

**Goals:**
- Complete the Product UI structural hierarchy: Workflow → Page → Section → Component → Element
- Add `UIOperation` as a first-class behavioral primitive: trigger (component + event) + effects[] (navigate, api-call, state-change, render)
- Register all new UI primitives as graph nodes with typed relationship edges so they are fully traversable
- Remain additive — all existing `product.ui.json` documents validate without change

**Non-Goals:**
- Runtime execution of UIOperations (effects are declared intent, not runtime code)
- Component library or design token modeling (that is canvas-theming territory)
- Replacing Route — routes remain the URL resolution layer; Workflows are the UX-navigation grouping layer
- Migrating existing examples to use the new hierarchy (a follow-up)

## Decisions

### 1. Workflow sits above Page; Section/Component/Element are inline sub-primitives

**Decision:** `Workflow` is a top-level array in `product.ui.json` whose items reference `Page` names via `pages[]`. `Section`, `Component`, and `Element` are inline sub-primitives of their parent — `Page.sections[]`, `Section.components[]`, `Component.elements[]` — mirroring how `Block` is inline on `Page` today.

**Rationale:** Workflows are cross-page containers that belong at document scope (like `Namespace` in `product.api.json`). Sub-primitives below Page are structural detail with no independent identity beyond their parent — inline keeps them co-located and avoids top-level proliferation.

**Alternative considered:** All five levels as top-level arrays with cross-references. Rejected — adds reference management overhead for primitives with no meaningful independent lifecycle.

### 2. UIOperation is a top-level array, not inline on Component

**Decision:** `UIOperation` is declared at `product.ui.json` document scope as a top-level `operations[]` array, referencing components by name in its `trigger`.

**Rationale:** A single UIOperation may have effects that cross page/component boundaries (navigate, call API, update state in another component). Inline placement on a component would make cross-component and cross-page effects awkward to express and hard to graph-traverse. Top-level placement makes the full behavioral surface flat and queryable in one pass.

**Alternative considered:** Inline `operations[]` on each `Component`. Rejected — cross-boundary effects become implicit references that break graph traversal.

### 3. Effects are a discriminated union by `type`

**Decision:** Each effect in `UIOperation.effects[]` is an object `{ type, ...typeSpecificFields }` — e.g. `{ type: "navigate", target: "UserDetailPage" }`, `{ type: "api", target: "CreateUser" }`, `{ type: "state", key: "selectedId", value: "..." }`, `{ type: "render", component: "PermissionSelector" }`.

**Rationale:** Discriminated unions are already the pattern for `Trigger.source` in Operational DNA and for `Block.type` in product.ui today. They keep effects self-describing and extendable without new top-level primitives.

### 4. Resource/relationship naming follows existing graph conventions

**Decision:** New `ResourceType` values are lowercase kebab: `workflow`, `section`, `component`, `element`, `ui-operation`. New `RelationshipType` values are lowercase snake: `contains`, `renders`, `triggers`, `navigates_to`, `calls`, `requires`, `updates`.

**Rationale:** Consistent with existing `ResourceType` values (`"domain"`, `"group"`) and `RelationshipType` values (`"reports_to"`, `"fills"`, `"belongs_to"`) in the graph-data-resource-model spec.

### 5. Additive-only changes to product.ui.json composite

**Decision:** New top-level arrays (`workflows[]`, `operations[]`) are optional in the composite schema. Existing required fields (`layout`, `pages`, `routes`) remain required and unchanged.

**Rationale:** Zero migration cost. Existing documents are valid. New documents opt into richer modeling incrementally.

## Risks / Trade-offs

- **Graph ResourceType/RelationshipType enum growth** → Mitigation: values are additive to the union; no existing graph queries break. Flag in the change that graph-studio NodeType guards need updating.
- **Naming collision: `Operation` exists at Operational and Product Core layers** → Mitigation: the new primitive is `UIOperation` in prose and `product/ui/operation` as its schema `$id`; the schema title disambiguates. The composite document field is `operations[]` scoped to `product.ui.json` so there is no schema-level collision.
- **Workflow vs Route dual-tracking of navigation structure** → Mitigation: these serve different purposes and are intentionally orthogonal. Routes are URL-resolution records; Workflows are UX-navigation groups. A Workflow may span multiple routes. Document the distinction in the spec.

## Open Questions

- Should `Section` be optional (some pages have no meaningful sub-section structure)? → Yes, all sub-primitives below Page are optional arrays.
- Should `UIOperation.trigger.component` reference an `Element` by name or a `Component`? → `Component` — elements are leaf nodes (individual inputs/buttons) and triggering is most naturally attached at the component level. Elements within a component may be referenced by name in the trigger if needed.
