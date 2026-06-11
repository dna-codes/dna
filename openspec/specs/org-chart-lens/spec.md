## MODIFIED Requirements

### Requirement: toOrgChartData produces type-discriminated nodes
`toOrgChartData` SHALL produce `GraphNode` objects using the `type` field (not `label`). Nodes representing hierarchical positions SHALL use `type: "position"` (not `"role"`).

#### Scenario: Domain node uses type field
- **WHEN** `toOrgChartData` maps a domain
- **THEN** the resulting `GraphNode` SHALL have `type: "domain"`

#### Scenario: Group node uses type field
- **WHEN** `toOrgChartData` maps a group
- **THEN** the resulting `GraphNode` SHALL have `type: "group"`

#### Scenario: Position node uses type field with value position
- **WHEN** `toOrgChartData` maps a role/position
- **THEN** the resulting `GraphNode` SHALL have `type: "position"` (not `"role"`)

#### Scenario: Person node uses type field
- **WHEN** `toOrgChartData` maps a person
- **THEN** the resulting `GraphNode` SHALL have `type: "person"`

### Requirement: OrgChartCanvas filters by type field
`OrgChartCanvas` SHALL use `n.type` (not `n.label`) when filtering or branching on node kind.

#### Scenario: Domain toggle buttons rendered for type domain
- **WHEN** `graphData` contains nodes with `type: "domain"`
- **THEN** the canvas SHALL render toggle controls for those nodes

#### Scenario: Canvas layout groups nodes by type
- **WHEN** nodes of different types are present
- **THEN** the canvas SHALL group them into level rows using the `type` field value

### Requirement: Org-chart page filters by type field
The org-chart page component SHALL use `n.type` (not `n.label`) when computing per-kind counts and tag lists for the DNA summary section.

#### Scenario: Domain tags derived from type
- **WHEN** the org-chart page renders the DNA summary
- **THEN** the domain tag list SHALL be nodes where `n.type === "domain"`

#### Scenario: Position tags derived from type
- **WHEN** the org-chart page renders the DNA summary
- **THEN** the position tag list SHALL be nodes where `n.type === "position"`
