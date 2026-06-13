## MODIFIED Requirements

### Requirement: Product UI primitives are registered as graph resource types
`@dna-codes/dna-core` SHALL register `product/ui/app`, `product/ui/module`, `product/ui/workflow`, `product/ui/section`, `product/ui/component`, `product/ui/element`, and `product/ui/operation` so they appear in `availableSchemas()` and are resolvable as graph node types. The API surface SHALL reuse the existing `product/api/endpoint` and `product/api/namespace` types (no new API node types are introduced).

#### Scenario: New UI primitives appear in availableSchemas
- **WHEN** `availableSchemas()` is read after this change
- **THEN** it SHALL contain `product/ui/app` and `product/ui/module` in addition to the existing `product/ui/workflow`, `product/ui/section`, `product/ui/component`, `product/ui/element`, and `product/ui/operation`

#### Scenario: No duplicate API primitives are introduced
- **WHEN** `availableSchemas()` is read after this change
- **THEN** the existing `product/api/endpoint` and `product/api/namespace` remain the API surface and grouping, and no `product/api/service` is added

### Requirement: Product UI graph relationships are defined and typed
The graph model for Product UI SHALL define the following typed relationships between nodes:

| Relationship | From | To | Meaning |
|---|---|---|---|
| `contains` | `app` | `module` | An App groups one or more Modules |
| `contains` | `module` | `workflow` | A Module groups one or more Workflows |
| `contains` | `module` | `page` | A Module directly contains a Page |
| `contains` | `workflow` | `page` | A Workflow groups one or more Pages |
| `contains` | `page` | `section` | A Page contains one or more Sections |
| `contains` | `page` | `component` | A Page directly contains a Component |
| `contains` | `section` | `component` | A Section contains one or more Components |
| `contains` | `component` | `element` | A Component contains one or more Elements |
| `realized_as` | `app` | `domain`\|`group` | An App surfaces a grouping anchor (function/Domain or Group) |
| `realized_as` | `module` | `domain`\|`process` | A Module surfaces a sub-Domain or Process |
| `realized_as` | `workflow`\|`page` | `process`\|`step` | A Workflow/Page surfaces a Process or Step |
| `realized_as` | `section` | `step` | A Section surfaces a Step |
| `realized_as` | `component` | `operation` | A Component surfaces an Operation |
| `realized_as` | `namespace` | `domain` | An API Namespace surfaces a Domain |
| `exposes` | `endpoint` | `operation` | An Endpoint exposes the Operation named by its `operation` field |
| `triggers` | `component` | `ui-operation` | A Component triggers a UIOperation |
| `navigates_to` | `ui-operation` | `page` | A UIOperation navigates to a Page |
| `navigates_to` | `ui-operation` | `workflow` | A UIOperation navigates to a Workflow |
| `calls` | `ui-operation` | `operation` | A UIOperation calls a Product Core or Operational Operation |
| `renders` | `ui-operation` | `component` | A UIOperation shows or hides a Component |
| `updates` | `ui-operation` | `component` | A UIOperation updates state in a Component |
| `requires` | `component` | `operation` | A Component requires permission to perform an Operation |
| `renders` | `page` | `component` | A Page renders a Component (structural rendering edge) |

#### Scenario: App-to-Module contains edge is traversable
- **WHEN** an `App` node references a `Module` node via `modules[]`
- **THEN** the graph SHALL represent this as a `contains` edge from the App node to each Module node

#### Scenario: realized_as edge surfaces a business node
- **WHEN** a `Module` declares `realizes: "LoanOrigination"` (a Process)
- **THEN** the graph SHALL represent this as a `realized_as` edge from the Module node to the Process node

#### Scenario: exposes edge maps an Endpoint to its Operation
- **WHEN** an `Endpoint` declares `operation: "Loan.Approve"`
- **THEN** the graph SHALL represent this as an `exposes` edge from the Endpoint node to the `Loan.Approve` operation node

### Requirement: Graph lens for Product UI surface is defined
A `product-ui` lens SHALL be defined that groups all Product UI node types and their structural relationships into a named traversal pattern. The lens SHALL cover: `app`, `module`, `workflow`, `page`, `section`, `component`, `element`, `ui-operation`, the API types `endpoint` and `namespace`, and the relationship types `contains`, `realized_as`, `exposes`, `triggers`, `navigates_to`, `calls`, `renders`, `updates`, `requires`.

#### Scenario: product-ui lens covers the new nodes and edges
- **WHEN** the `product-ui` lens definition is read
- **THEN** its nodes SHALL include `app`, `module`, `endpoint`, and `namespace`
- **THEN** its edges SHALL include `realized_as` and `exposes`
