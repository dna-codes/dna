## ADDED Requirements

### Requirement: Product UI defines an `App` primitive

Product UI SHALL define an `App` primitive at `product/ui/app`. An `App` is the top-level product surface for a business function — the product face of a **grouping anchor** (any `Domain` or `Group` node a grouping is anchored at). It SHALL declare a PascalCase `name` (string, required), an optional `description`, an optional `realizes` reference naming the business anchor node it surfaces, and an optional `modules[]` array of `Module` references. It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal App validates

- **WHEN** a document `{ "name": "Lending" }` is validated against `product/ui/app`
- **THEN** validation SHALL pass

#### Scenario: App realizing a Domain validates

- **WHEN** an `App` declares `realizes: "Lending"` (a Domain) and `modules: ["Origination"]`
- **THEN** validation SHALL pass

### Requirement: Product UI defines a `Module` primitive

Product UI SHALL define a `Module` primitive at `product/ui/module`. A `Module` is a feature-area grouping beneath an `App` and above `Workflow`/`Page` — typically the product surface of a sub-`Domain` or a `Process`. It SHALL declare a PascalCase `name` (string, required), an optional `description`, an optional `realizes` reference, and optional `workflows[]` and `pages[]` arrays. It SHALL compose the shared stability base.

#### Scenario: Minimal Module validates

- **WHEN** a document `{ "name": "Origination" }` is validated against `product/ui/module`
- **THEN** validation SHALL pass

#### Scenario: Module realizing a Process validates

- **WHEN** a `Module` declares `realizes: "LoanOrigination"` (a Process) and `pages: ["ApplicationPage"]`
- **THEN** validation SHALL pass

### Requirement: API surface reuses the existing Endpoint and Namespace primitives

This change SHALL NOT introduce new API primitives. The existing `product/api/endpoint` (which names the `Operation` it maps from via its `operation` field) and `product/api/namespace` (which groups resources and maps from a Domain) SHALL serve as the API surface and its grouping. The graph model SHALL connect them via the new `exposes` and `realized_as` edges rather than via new node types.

#### Scenario: No new API node types are registered

- **WHEN** `availableSchemas()` is read after this change
- **THEN** it SHALL NOT contain a new `product/api/service` schema (the existing `product/api/namespace` is the API grouping)

#### Scenario: Namespace realizes its Domain

- **WHEN** a `Namespace` maps from the Domain "Lending" via its `domain` field
- **THEN** the graph SHALL represent a `realized_as` edge from the Namespace node to the Lending Domain node

### Requirement: `realized_as` relationship binds a product node to the business node it surfaces

A `realized_as` relationship type SHALL be expressed in the product graph model (as a lens edge), directed from a Product UI/API node to the business node it surfaces. Valid endpoints SHALL include `App → Domain|Group` (any grouping anchor), `Module → Domain`, `Module → Process`, `Workflow → Process`, `Page → Process`, `Page → Step`, `Section → Step`, `Component → Operation`, and `Namespace → Domain`. The level is a per-node binding: the same business node MAY be realized at different levels by different product nodes.

#### Scenario: realized_as edge is traversable both ways

- **WHEN** a `Page` declares `realizes: "CollectApplication"` (a Step)
- **THEN** the graph SHALL represent a `realized_as` edge from the Page to the Step
- **THEN** the reverse traversal "what surfaces CollectApplication" SHALL return the Page

#### Scenario: same Process realized at two levels

- **WHEN** one `Module` realizes `LoanOrigination` and one `Page` in another App also realizes `LoanOrigination`
- **THEN** both `realized_as` edges SHALL be valid and SHALL NOT collide (identity is per product node, not per business node)

### Requirement: `exposes` relationship binds an Endpoint to its Operation

An `exposes` relationship type SHALL be expressed in the product graph model (as a lens edge), directed from an existing `Endpoint` to the `Operation` named by the Endpoint's `operation` field — the derived behavioral seam between the API and the business, analogous to how `calls` derives from a UIOperation effect.

#### Scenario: exposes edge derives from the endpoint's operation field

- **WHEN** an `Endpoint` declares `operation: "Loan.Approve"`
- **THEN** the graph SHALL represent an `exposes` edge from the Endpoint node to the `Loan.Approve` operation node

### Requirement: `contains` hierarchy extends to App and Module

The `contains` relationship type SHALL additionally support `App → Module`, `Module → Workflow`, and `Module → Page`, extending the existing Product UI containment hierarchy upward.

#### Scenario: App-to-Module contains edge is traversable

- **WHEN** an `App` references a `Module` via `modules[]`
- **THEN** the graph SHALL represent a `contains` edge from the App to the Module

#### Scenario: full hierarchy is traversable

- **WHEN** the graph holds `App → Module → Page → Section → Component → Element`
- **THEN** each adjacent pair SHALL be connected by a `contains` edge, traversable top-down and bottom-up
