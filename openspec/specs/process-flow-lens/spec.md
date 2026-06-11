## ADDED Requirements

### Requirement: Process-flow transformer extracts steps and flow edges from a ResourceGraph
`lib/lenses/process-flow/fromResourceGraph.ts` SHALL export `fromResourceGraph(graph: ResourceGraph): GraphData`. It SHALL project `process` and `step` resources as `GraphNode`s. `next_step` relationships SHALL become `GraphEdge`s (source → target). `belongs_to` / `part_of` relationships between steps and a process SHALL set `parentId` on the step node. The transformer SHALL skip resources of all other types (person, company, department, position) and SHALL skip `assigned_to`, `fills`, `reports_to` relationships (they are handled by other lenses).

#### Scenario: Step nodes are emitted
- **WHEN** a fixture has resources of type `step` in a process
- **THEN** `fromResourceGraph` SHALL return a node for each step

#### Scenario: Process node is emitted
- **WHEN** a fixture has a resource of type `process`
- **THEN** `fromResourceGraph` SHALL return a node for the process resource

#### Scenario: next_step relationships become edges
- **WHEN** a fixture has `next_step` relationships between steps
- **THEN** `fromResourceGraph` SHALL return edges with the same source and target ids

#### Scenario: assigned_to relationships annotate step nodes
- **WHEN** a step has an `assigned_to` relationship pointing to a position
- **THEN** the step's `GraphNode.attrs.assignedTo` SHALL contain the position name

### Requirement: Process-flow canvas renders steps as a left-to-right directed graph
`ProcessFlowCanvas` SHALL render nodes as rounded rectangles and `next_step` edges as directed arrows flowing left-to-right. Step type SHALL be shown as a sublabel. The canvas SHALL use JointJS with the same brand tokens as OrgChartCanvas.

#### Scenario: Nodes are laid out left-to-right
- **WHEN** a linear sequence of steps is given
- **THEN** each step SHALL be positioned to the right of its predecessor

#### Scenario: Edges have arrowheads
- **WHEN** a `next_step` edge exists
- **THEN** the rendered link SHALL have a visible arrowhead pointing from source to target

### Requirement: Process-flow lens page exists for each example
Each example SHALL have a page at `app/lens/[example]/process-flow/page.tsx` that imports the example's fixture, calls the process-flow transformer, and renders `ProcessFlowCanvas`.

#### Scenario: Page renders without error
- **WHEN** the process-flow page for any example is requested
- **THEN** a page with a canvas and an "About this DNA" summary SHALL be returned
