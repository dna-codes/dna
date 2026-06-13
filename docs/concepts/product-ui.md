# Product UI Layer

The Product UI layer models an application's web surface as **resources and
relationships** — a graph of typed nodes and typed edges. It has two
complementary parts:

1. A **structural hierarchy** describing what exists (Workflow → Page →
   Section → Component → Element), and
2. A **behavioral primitive**, `UIOperation`, describing what happens when a
   user interacts with the UI.

Modeling behavior as graph nodes — not as code buried in components — is what
makes questions like *"what breaks if `LoanDetailPage` is removed?"* or
*"which operations call `Loan.Approve`?"* answerable by traversal, and lets
routes, tests, and component scaffolding be generated from a single source.

## Resource primitives

| Primitive | Role |
|-----------|------|
| `Workflow` | A navigable grouping of Pages above the Page level — a coherent user journey through a Resource (e.g. the loan application flow). |
| `Page` | A discrete screen representing a Resource. Composes Sections and/or Components (and, for the flat legacy model, Blocks). |
| `Section` | A named structural region within a Page (`header`, `main`, `sidebar`, …) that groups Components. |
| `Component` | A reusable UI unit within a Section (card, table, form, …). Maps from a Resource and optionally an Operation; composes Elements. |
| `Element` | A leaf UI primitive within a Component (input, button, label, …). Optionally binds to a `Field` on the Component's Resource. |
| `UIOperation` | A behavioral primitive: a `trigger` (Component + user event) plus an ordered list of `effects`. The product-layer equivalent of Operational's `Operation`. |

Each schema lives under `@dna-codes/dna-schemas` at `product/ui/<name>` and
composes the shared `meta/stability` mixin, so every primitive may carry an
optional `stability` marker.

## Relationship primitives

The hierarchy and behavior connect through seven typed edges:

| Relationship | From → To | Meaning |
|--------------|-----------|---------|
| `contains` | Workflow→Page, Page→Section, Section→Component, Component→Element | Structural nesting. |
| `renders` | Component → Resource | The Resource a Component displays. |
| `triggers` | Component → UIOperation | The Component whose event fires an operation. |
| `navigates_to` | UIOperation → Page | A `navigate` effect's destination. |
| `calls` | UIOperation → Operation | An `api-call` effect's backend Operation. |
| `requires` | Element → Field | The Field an Element binds to. |
| `updates` | UIOperation → Resource | A Resource a `state-change`/`api-call` effect mutates. |

## UIOperation: trigger + effects

A `UIOperation` is `{ id, name, trigger, effects[] }`:

- **`trigger`** — `{ component, event }` where `event` is one of `click`,
  `submit`, `change`, `load`, `hover`, `focus`, `blur`.
- **`effects`** — an ordered, non-empty list. Each effect is a discriminated
  union on `type`:
  - `navigate` → `{ to }` — go to a Page or route.
  - `api-call` → `{ operation }` — invoke a backend Operation (`Resource.Action`).
  - `state-change` → `{ target, value? }` — update a piece of UI state.
  - `render` → `{ component }` — render a Component.

```json
{
  "id": "submit-loan-application",
  "name": "SubmitLoanApplication",
  "trigger": { "component": "SubmitButton", "event": "click" },
  "effects": [
    { "type": "state-change", "target": "form.submitting", "value": true },
    { "type": "api-call", "operation": "Loan.Apply" },
    { "type": "navigate", "to": "LoanConfirm" }
  ]
}
```

## The `product-ui` lens

`@dna-codes/dna-core` ships a `product-ui` lens (`packages/core/lenses/product-ui.json`,
exported via `allLenses()`) that declares all six node types and the seven
relationship edges, so the layer is traversable as a named graph pattern.

## Example graph queries

- **Impact analysis** — *"what breaks if a Page is removed?"* Traverse
  `navigates_to` edges into the Page (which UIOperations land there) and
  `contains` edges from it (which Sections/Components/Elements disappear).
- **Backend coupling** — *"which UI operations call `Loan.Approve`?"* Filter
  UIOperations whose effects include an `api-call` with that `operation`, then
  follow `triggers` back to the Components (and their Pages) that fire them.
- **Field coverage** — *"which Elements bind to `amount`?"* Traverse
  `requires` edges to the `amount` Field.

## Composing into a document

A `product.ui.json` document composes a `layout`, `pages`, and `routes` (all
required for backward compatibility) plus the new optional `workflows[]` and
`operations[]` arrays. All additions are non-breaking — existing documents
without workflows or operations remain valid.

A worked example lives at [`examples/ecommerce/product.ui.json`](../../examples/ecommerce/product.ui.json),
demonstrating a checkout Workflow, the full Page→Section→Component→Element
hierarchy, and three UIOperations.

See also: [Resource Types catalog](./resource-types.md) ·
[README — Product Layer](../../README.md#product-layer).
