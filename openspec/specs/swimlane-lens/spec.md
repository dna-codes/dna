## ADDED Requirements

### Requirement: Swimlane transformer groups all steps by their assigned position
`lib/lenses/swimlane/fromResourceGraph.ts` SHALL export `fromResourceGraph(graph: ResourceGraph): SwimlaneData`. `SwimlaneData` SHALL be `{ lanes: SwimlaneData[], edges: GraphEdge[] }` where each `SwimlaneData` has `{ roleId: string; roleName: string; steps: GraphNode[] }`. Steps SHALL be included in a lane keyed by the name of the position they are `assigned_to`. Steps with no `assigned_to` relationship SHALL be placed in an "Unassigned" lane. `next_step` relationships between steps in different lanes SHALL be included as `GraphEdge`s in the top-level `edges` array.

#### Scenario: Steps grouped by assigned role
- **WHEN** a fixture has steps with `assigned_to` relationships pointing to distinct positions
- **THEN** `fromResourceGraph` SHALL return one lane per distinct position, each containing only the steps assigned to that position

#### Scenario: Unassigned steps get their own lane
- **WHEN** a step has no `assigned_to` relationship
- **THEN** the step SHALL appear in a lane with `roleId: 'unassigned'` and `roleName: 'Unassigned'`

#### Scenario: Cross-lane flow edges are preserved
- **WHEN** a `next_step` relationship connects a step in one lane to a step in another lane
- **THEN** that relationship SHALL appear as a `GraphEdge` in the top-level `edges` array

#### Scenario: Steps within a lane are topologically ordered
- **WHEN** a lane contains steps connected by `next_step` edges
- **THEN** the steps in `SwimlaneData.steps` SHALL be ordered topologically (earlier steps first)

### Requirement: Swimlane canvas renders horizontal role lanes with steps and flow arrows
`SwimlaneCanvas` SHALL render each lane as a labeled horizontal band. Within each band, the lane's steps SHALL be positioned left-to-right in topological order. `next_step` edges SHALL be rendered as directed arrows connecting steps, including across lane boundaries. Unassigned steps SHALL appear in a visually distinct lane.

#### Scenario: Lane labels are visible
- **WHEN** the swimlane page is rendered
- **THEN** each lane SHALL have a visible label showing the role/position name

#### Scenario: Steps are positioned left-to-right within their lane
- **WHEN** a lane has multiple steps
- **THEN** each step SHALL be rendered to the right of its predecessor

#### Scenario: Cross-lane arrows connect steps in different lanes
- **WHEN** a `next_step` edge connects steps in different lanes
- **THEN** a directed arrow SHALL visually connect the two step nodes across lane boundaries

### Requirement: Swimlane lens page exists for each example
Each example SHALL have a page at `app/lens/[example]/swimlane/page.tsx` that imports the example's fixture, calls the swimlane transformer, and renders `SwimlaneCanvas`.

#### Scenario: Swimlane page renders without error
- **WHEN** the swimlane page for any example is requested
- **THEN** a page with a swimlane canvas and an "About this DNA" summary SHALL be returned
