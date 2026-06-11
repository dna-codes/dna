## ADDED Requirements

### Requirement: Responsibility map transformer produces a three-tier bipartite graph
`lib/lenses/responsibility-map/fromResourceGraph.ts` SHALL export `fromResourceGraph(graph: ResourceGraph): GraphData`. The returned `GraphData` SHALL include:
- `department` nodes for every department resource
- `position` nodes for every position resource, each with `parentId` set to their department id (via `belongs_to` or `reports_to` chain)
- `step` nodes for every step resource
- Edges of type `has_position` connecting each department to its direct-report positions
- Edges of type `assigned_to` connecting each position to the steps it is assigned to

Steps with no `assigned_to` relationship SHALL still be included as nodes with no edges connecting them to positions.

#### Scenario: All three resource tiers are present
- **WHEN** a fixture has departments, positions, and steps
- **THEN** `fromResourceGraph` SHALL return nodes of all three types

#### Scenario: Department–position edges are emitted
- **WHEN** a position belongs to a department via `belongs_to`
- **THEN** an edge of type `has_position` SHALL connect the department node to the position node

#### Scenario: Position–step edges are emitted
- **WHEN** a step has an `assigned_to` relationship pointing to a position
- **THEN** an edge of type `assigned_to` SHALL connect the position node to the step node

#### Scenario: Unassigned steps are included without edges
- **WHEN** a step has no `assigned_to` relationship
- **THEN** the step node SHALL be present in the output with no connecting edges

### Requirement: Responsibility map canvas renders a sector-based radial layout
`ResponsibilityMapCanvas` SHALL lay out nodes in three concentric tiers. Departments SHALL occupy an inner ring, divided into equal angular sectors. Positions SHALL be placed in the middle ring within their department's sector. Steps SHALL be placed on an outer ring, fanned around their assigned position. Unassigned steps SHALL form a separate cluster.

Node styles SHALL distinguish tiers: departments use a teal filled circle, positions use the slate rectangle style, steps use a smaller muted rectangle. Edges SHALL use thin accent-colored lines without arrowheads (the layout itself communicates direction).

#### Scenario: Departments form the inner ring
- **WHEN** a fixture with multiple departments is rendered
- **THEN** each department node SHALL be positioned at approximately equal angular spacing on an inner radius

#### Scenario: Positions cluster near their department
- **WHEN** a position belongs to a department
- **THEN** the position node SHALL be rendered angularly near its department's sector

#### Scenario: Steps cluster near their assigned position
- **WHEN** a step is assigned to a position
- **THEN** the step node SHALL be rendered in the outer ring near that position node

### Requirement: Responsibility map lens page exists for each example
Each example SHALL have a page at `app/lens/[example]/responsibility-map/page.tsx` that imports the example's fixture, calls the responsibility-map transformer, and renders `ResponsibilityMapCanvas`.

#### Scenario: Responsibility map page renders without error
- **WHEN** the responsibility map page for any example is requested
- **THEN** a page with the responsibility map canvas and an "About this DNA" summary SHALL be returned
