## ADDED Requirements

### Requirement: Lending fixture exists at examples/lending/dna.json
The file `examples/lending/dna.json` SHALL conform to the `ResourceGraph` interface: top-level `resources[]` and `relationships[]` arrays, each item with `id`, `type`, `name` (and `from`/`to` for relationships).

#### Scenario: Fixture loads without error
- **WHEN** `examples/lending/dna.json` is imported as JSON
- **THEN** it SHALL parse successfully and have non-empty `resources` and `relationships` arrays

### Requirement: Lending fixture contains org-chart resources
The fixture SHALL include a `company` resource (e.g., ClearPath Lending), at least four `department` resources (Origination, Underwriting, Servicing, Collections), and at least seven `position` resources. At least five positions SHALL have `fills` relationships to `person` resources.

#### Scenario: Company and departments present
- **WHEN** `resources` is filtered by `type === 'company'` or `type === 'department'`
- **THEN** at least five resources SHALL be returned (one company, four departments)

#### Scenario: Positions are filled
- **WHEN** `relationships` is filtered by `type === 'fills'`
- **THEN** at least five entries SHALL be present

### Requirement: Lending fixture contains a loan-application process
The fixture SHALL include one `process` resource representing the loan-application / origination flow and at least five `step` resources connected by `next_step` relationships. Steps SHALL cover the key origination stages: application intake, credit check, underwriting review, approval decision, and offer generation. At least three steps SHALL have `assigned_to` relationships pointing to positions.

#### Scenario: Loan-application steps present
- **WHEN** `resources` is filtered by `type === 'step'` where the step belongs to the origination process
- **THEN** at least five step resources SHALL be returned

#### Scenario: next_step edges connect the steps
- **WHEN** `relationships` is filtered by `type === 'next_step'`
- **THEN** at least four entries SHALL connect the origination steps in sequence

#### Scenario: Steps are role-assigned
- **WHEN** `relationships` is filtered by `type === 'assigned_to'`
- **THEN** at least three entries SHALL point to positions in the lending org

### Requirement: Lending fixture contains a loan-closing runbook
The fixture SHALL include a second `process` resource for the loan-closing runbook with at least five `step` resources. At least three steps SHALL have `assigned_to` relationships pointing to positions (e.g., Loan Officer, Closing Coordinator, Compliance Reviewer).

#### Scenario: Loan-closing steps are assigned
- **WHEN** `relationships` is filtered by `type === 'assigned_to'` for closing steps
- **THEN** at least three entries SHALL be present covering distinct position types
