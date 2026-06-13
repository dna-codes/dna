## ADDED Requirements

### Requirement: Type-registry view-model

The MCP server SHALL provide a `buildTypeRegistryGraph(store)` view-model that reads the registry and returns resource types as nodes and relationship types as directed edges, sourced from existing type records (no instances). Each resource type SHALL include `name`, `category`, optional `description`, `stability`, and its `attribute_schema` fields. Each relationship type SHALL include `name`, `from`, `to`, `cardinality`, optional `description`, and `stability`.

#### Scenario: View-model lists every registered type

- **WHEN** the registry has resource types and relationship types but zero instances
- **THEN** the view-model's `resourceTypes` contains one entry per registered resource type with its category, stability, and attribute fields
- **THEN** the view-model's `relationshipTypes` contains one entry per registered relationship type with its `from`, `to`, and cardinality

#### Scenario: View-model is independent of instances

- **WHEN** the view-model is built for a registry with no instances
- **THEN** it still returns the full set of types (it does not read or require any instance)

### Requirement: Type-registry is readable via REST and app proxy

The MCP server SHALL expose `GET /lens/type-registry` returning the type-registry view-model as JSON. The dna-agent app SHALL proxy it at `GET /api/lens/type-registry`.

#### Scenario: REST endpoint returns the view-model

- **WHEN** a GET request is made to `/lens/type-registry`
- **THEN** the response is the type-registry view-model with `resourceTypes` and `relationshipTypes` arrays

#### Scenario: App proxies the endpoint

- **WHEN** the app receives `GET /api/lens/type-registry`
- **THEN** it forwards to the MCP server's `/lens/type-registry` and returns the JSON

### Requirement: Build-mode Graph Explorer renders the schema graph

In Build mode, the Graph Explorer SHALL render the type registry as a graph: each resource type is a node and each relationship type is a labeled directed edge from its `from` type to its `to` type. Self-referential relationship types (`from === to`) SHALL be rendered as self-loops. The empty state SHALL reference types, not instances.

#### Scenario: Schema graph shows types and relationships

- **WHEN** Build mode is active and the registry has resource and relationship types
- **THEN** the Graph Explorer shows one node per resource type and one edge per relationship type
- **THEN** a relationship type whose `from` equals its `to` is shown as a self-loop

#### Scenario: Empty state references types

- **WHEN** Build mode is active and the registry has no resource types
- **THEN** the Graph Explorer empty state prompts the user to model types (not instances)

### Requirement: Build-mode Org Chart renders the structural type spine

In Build mode, the Org Chart lens SHALL render a hierarchy of resource types derived from structural relationship types (`belongs_to`, `reports_to`). Containment (`belongs_to`) defines parent/child nesting; `reports_to` SHALL be shown as a node annotation rather than a nesting edge (to avoid cycles from self-references). When no structural relationships exist, the lens SHALL fall back to listing resource types grouped by category.

#### Scenario: Containment forms the hierarchy

- **WHEN** the registry has `position belongs_to department` and `department belongs_to company`
- **THEN** the Build Org Chart nests `position` under `department` under `company`

#### Scenario: Self-reporting shown as annotation

- **WHEN** the registry has `position reports_to position`
- **THEN** `position` is annotated as reporting to `position`, and no infinite nesting occurs

#### Scenario: Fallback grouping when no structure

- **WHEN** the registry has resource types but no `belongs_to` relationship types
- **THEN** the Build Org Chart lists the resource types grouped by category

### Requirement: Build-mode Reporting Chains renders reports_to wiring

In Build mode, the Reporting Chains lens SHALL render the `reports_to`-style relationship types as `from → to` entries among the participating resource types.

#### Scenario: reports_to relationship type is listed

- **WHEN** the registry has a `reports_to` relationship type from `position` to `position`
- **THEN** the Build Reporting Chains lens shows a `position → position` reporting entry

### Requirement: Build-mode Job Descriptions renders type definition cards

In Build mode, the Job Descriptions lens SHALL render one definition card per resource type, showing the type name and category, a stability badge, its description, its `attribute_schema` fields (name, type, and whether required), and the relationship types it participates in split into outgoing (`from === type`) and incoming (`to === type`).

#### Scenario: Definition card shows attributes and relationships

- **WHEN** Build mode is active and a `position` resource type has attributes and participates in `reports_to` and `fills`
- **THEN** its card shows the stability badge, each attribute field, the outgoing relationship types where `position` is the `from`, and the incoming relationship types where `position` is the `to`

#### Scenario: Stability is surfaced

- **WHEN** a resource type has stability `experimental`
- **THEN** its definition card displays an `experimental` stability badge

### Requirement: Build lens set includes the four type lenses

The Build-mode lens tab set SHALL be `graph-explorer`, `org-chart`, `reporting-chains`, and `job-descriptions`, all rendering type-level views. The Build system prompt's `activate_lens` routing SHALL be scoped to these four lens IDs. Operate-mode lenses SHALL be unchanged.

#### Scenario: Build shows four type lenses

- **WHEN** Build mode is active
- **THEN** the lens tab bar shows graph-explorer, org-chart, reporting-chains, and job-descriptions, each rendering type-level data

#### Scenario: Operate lenses unchanged

- **WHEN** Operate mode is active
- **THEN** the lens tab bar shows the existing instance-based operational lenses as before
