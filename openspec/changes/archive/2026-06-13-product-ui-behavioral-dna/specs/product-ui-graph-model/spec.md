## ADDED Requirements

### Requirement: Product UI primitives are registered as graph resource types
`@dna-codes/dna-core` SHALL register `product/ui/workflow`, `product/ui/section`, `product/ui/component`, `product/ui/element`, and `product/ui/operation` so they appear in `availableSchemas()` and are resolvable as graph node types.

#### Scenario: New UI primitives appear in availableSchemas
- **WHEN** `availableSchemas()` is read after this change
- **THEN** it SHALL contain `product/ui/workflow`, `product/ui/section`, `product/ui/component`, `product/ui/element`, and `product/ui/operation`

### Requirement: Product UI graph relationships are defined and typed
The graph model for Product UI SHALL define the following typed relationships between nodes:

| Relationship | From | To | Meaning |
|---|---|---|---|
| `contains` | `workflow` | `page` | A Workflow groups one or more Pages |
| `contains` | `page` | `section` | A Page contains one or more Sections |
| `contains` | `page` | `component` | A Page directly contains a Component |
| `contains` | `section` | `component` | A Section contains one or more Components |
| `contains` | `component` | `element` | A Component contains one or more Elements |
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

#### Scenario: UIOperation-to-Page navigates_to edge is traversable
- **WHEN** a `UIOperation` has an effect `{ type: "navigate", target: "UserDetailPage" }`
- **THEN** the graph SHALL represent this as a `navigates_to` edge from the UIOperation node to the UserDetailPage node

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
A `product-ui` lens SHALL be defined that groups all Product UI node types and their structural relationships into a named traversal pattern. The lens SHALL cover: `workflow`, `page`, `section`, `component`, `element`, `ui-operation`, and the relationship types `contains`, `triggers`, `navigates_to`, `calls`, `renders`, `updates`, `requires`.

#### Scenario: product-ui lens is registered
- **WHEN** `allLenses()` is called
- **THEN** the result SHALL include a lens with `$id` matching `product-ui` and nodes covering the five UI structural types plus `ui-operation`
