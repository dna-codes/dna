## ADDED Requirements

### Requirement: E-commerce fixture exists at examples/ecommerce/dna.json
The file `examples/ecommerce/dna.json` SHALL conform to the `ResourceGraph` interface: top-level `resources[]` and `relationships[]` arrays, each item with `id`, `type`, `name` (and `from`/`to` for relationships).

#### Scenario: Fixture loads without error
- **WHEN** `examples/ecommerce/dna.json` is imported as JSON
- **THEN** it SHALL parse successfully and have non-empty `resources` and `relationships` arrays

### Requirement: E-commerce fixture contains org-chart resources
The fixture SHALL include a `company` resource, at least three `department` resources (e.g., Catalog, Orders, Fulfillment), and at least six `position` resources. At least four positions SHALL have `fills` relationships to `person` resources.

#### Scenario: Company and departments present
- **WHEN** `resources` is filtered by `type === 'company'` or `type === 'department'`
- **THEN** at least four resources SHALL be returned (one company, three+ departments)

#### Scenario: Positions are assigned
- **WHEN** `relationships` is filtered by `type === 'fills'`
- **THEN** at least four entries SHALL be present

### Requirement: E-commerce fixture contains a process-flow process
The fixture SHALL include one `process` resource representing the order-fulfillment flow and at least four `step` resources connected by `next_step` relationships forming a linear or branching sequence.

#### Scenario: Order-fulfillment process steps present
- **WHEN** `resources` is filtered by `type === 'step'`
- **THEN** at least four step resources SHALL be returned

#### Scenario: next_step edges connect the steps
- **WHEN** `relationships` is filtered by `type === 'next_step'`
- **THEN** at least three entries SHALL connect the fulfillment steps in sequence

### Requirement: E-commerce fixture contains a runbook process
The fixture SHALL include a second `process` resource (e.g., payment-failure runbook) with at least four `step` resources. At least two steps SHALL have `assigned_to` relationships pointing to positions.

#### Scenario: Payment-failure steps are assigned
- **WHEN** `relationships` is filtered by `type === 'assigned_to'`
- **THEN** at least two entries SHALL be present
