## ADDED Requirements

### Requirement: Runbook transformer extracts ordered steps with role assignments
`lib/lenses/runbook/fromResourceGraph.ts` SHALL export `fromResourceGraph(graph: ResourceGraph): GraphData`. It SHALL include `step` resources as `GraphNode`s. `next_step` relationships become `GraphEdge`s. For each step, if an `assigned_to` relationship points to a `position` or `person`, the transformer SHALL set `attrs.assignedTo` (name of the position/person) on that step node. Steps without a `belongs_to` parent process SHALL still be included.

#### Scenario: Step nodes carry assignment metadata
- **WHEN** a step has an `assigned_to` relationship to a position
- **THEN** the resulting node's `attrs.assignedTo` SHALL equal the position's name

#### Scenario: Unassigned steps are included
- **WHEN** a step has no `assigned_to` relationship
- **THEN** the step node SHALL still be present with no `attrs.assignedTo`

### Requirement: Runbook canvas renders steps as a numbered vertical list with role badges
`RunbookCanvas` SHALL render each step node as a full-width row with: a step number (1-based, derived from topological order), the step name, and — if `attrs.assignedTo` is set — a role badge (teal pill) showing the assigned position name. `next_step` edges are not drawn as arrows; order is communicated by vertical position alone.

#### Scenario: Steps are numbered in topological order
- **WHEN** steps are connected by `next_step` edges
- **THEN** each rendered row SHALL display a sequential number starting at 1

#### Scenario: Role badge is shown for assigned steps
- **WHEN** a step node has `attrs.assignedTo`
- **THEN** a teal pill with the assignee name SHALL appear on that step's row

#### Scenario: Unassigned steps show no badge
- **WHEN** a step node has no `attrs.assignedTo`
- **THEN** no role badge SHALL appear on that row

### Requirement: Runbook lens page exists for each example
Each example SHALL have a page at `app/lens/[example]/runbook/page.tsx` that imports the example's fixture, calls the runbook transformer, and renders `RunbookCanvas`.

#### Scenario: Runbook page renders without error
- **WHEN** the runbook page for any example is requested
- **THEN** a page with a runbook canvas and an "About this DNA" summary SHALL be returned
