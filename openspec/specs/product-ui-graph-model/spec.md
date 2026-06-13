# product-ui-graph-model Specification

## Purpose
TBD - created by archiving change product-ui-behavioral-dna. Update Purpose after archive.
## Requirements
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
| `realized_as` | `workflow`\|`page` | `process`\|`task` | A Workflow/Page surfaces a Process or Task |
| `realized_as` | `section` | `task` | A Section surfaces a Task |
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

#### Scenario: Workflow-to-Page contains edge is traversable
- **WHEN** a `Workflow` node references a `Page` node via `pages[]`
- **THEN** the graph SHALL represent this as a `contains` edge from the Workflow node to each Page node

#### Scenario: App-to-Module contains edge is traversable
- **WHEN** an `App` node references a `Module` node via `modules[]`
- **THEN** the graph SHALL represent this as a `contains` edge from the App node to each Module node

#### Scenario: realized_as edge surfaces a business node
- **WHEN** a `Module` declares `realizes: "LoanOrigination"` (a Process)
- **THEN** the graph SHALL represent this as a `realized_as` edge from the Module node to the Process node

#### Scenario: exposes edge maps an Endpoint to its Operation
- **WHEN** an `Endpoint` declares `operation: "Loan.Approve"`
- **THEN** the graph SHALL represent this as an `exposes` edge from the Endpoint node to the `Loan.Approve` operation node

#### Scenario: UIOperation-to-Operation calls edge is traversable
- **WHEN** a `UIOperation` has an effect `{ type: "api", target: "User.Create" }`
- **THEN** the graph SHALL represent this as a `calls` edge from the UIOperation node to the User.Create operation node

### Requirement: Graph traversal queries are expressible over Product UI primitives
The registered nodes and edges SHALL support answering graph queries by traversal. The following queries SHALL be expressible as graph patterns:

- "Show every page involved in a given workflow" → traverse `workflow -[contains]-> page`
- "What components can trigger role assignment?" → traverse `component -[triggers]-> ui-operation -[calls]-> operation` filtered by operation name
- "Which API operations does a given workflow call?" → traverse `workflow -[contains]-> page -[renders]-> component -[triggers]-> ui-operation -[calls]-> operation`
- "What breaks if UserDetailPage is removed?" → reverse-traverse all `contains`, `navigates_to`, and `renders` edges pointing to the target node
- "Generate a React router config" → collect all `page` nodes and their associated `route` nodes via `renders` edges

#### Scenario: Impact analysis query returns upstream dependents
- **WHEN** a graph query asks "what nodes have edges pointing to UserDetailPage"
- **THEN** the result SHALL include all `Workflow` nodes containing it (via `contains`), all `UIOperation` nodes navigating to it (via `navigates_to`), and all `Route` nodes mapping to it

#### Scenario: Workflow operation coverage query returns all API calls
- **WHEN** a graph query asks "what API operations does CreateUserWorkflow call"
- **THEN** the result SHALL traverse `CreateUserWorkflow -[contains]-> * -[triggers]-> * -[calls]-> operation` and return all reachable operation nodes

### Requirement: Graph lens for Product UI surface is defined
A `product-ui` lens SHALL be defined that groups all Product UI node types and their structural relationships into a named traversal pattern. The lens SHALL cover: `app`, `module`, `workflow`, `page`, `section`, `component`, `element`, `ui-operation`, the API types `endpoint` and `namespace`, and the relationship types `contains`, `realized_as`, `exposes`, `triggers`, `navigates_to`, `calls`, `renders`, `updates`, `requires`.

#### Scenario: product-ui lens is registered
- **WHEN** `allLenses()` is called
- **THEN** the result SHALL include a lens with `$id` matching `product-ui` and nodes covering the five UI structural types plus `ui-operation`

#### Scenario: product-ui lens covers the new nodes and edges
- **WHEN** the `product-ui` lens definition is read
- **THEN** its nodes SHALL include `app`, `module`, `endpoint`, and `namespace`
- **THEN** its edges SHALL include `realized_as` and `exposes`

