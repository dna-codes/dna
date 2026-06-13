## MODIFIED Requirements

### Requirement: Job-description lens transform produces JobDescriptionData
`lib/lenses/job-description/fromResourceGraph.ts` SHALL export a `fromResourceGraph(graph: ResourceGraph): JobDescriptionData` function that produces one `JobDescription` entry per position resource, with:
- `title` from the position's `name`
- `department` from the department/domain/group the position belongs to (via `belongs_to`)
- `reportsTo` from the position's `reports_to` target name (if any)
- `filledBy` from the person who `fills` the position (if any)
- `summary` from `position.description` (if present)
- `ownedProcesses` — processes linked to this position via `owned_by` (process → position), each with `processName` and optional `processDescription`
- `responsibilities` grouped by process: each group lists the process name, process description, and the names of steps assigned to this position within that process

#### Scenario: Position with assigned steps produces responsibilities
- **WHEN** a position has `assigned_to` relationships to steps that belong to a process
- **THEN** the position's `JobDescription.responsibilities` contains one entry per process with the process name and step names

#### Scenario: Position with no assigned steps produces empty responsibilities
- **WHEN** a position has no `assigned_to` relationships
- **THEN** the position's `JobDescription.responsibilities` is an empty array

#### Scenario: Reports-to chain is resolved to name
- **WHEN** a position has a `reports_to` relationship to another position
- **THEN** `reportsTo` is the target position's `name` string

#### Scenario: Position with owned_by processes populates ownedProcesses
- **WHEN** one or more `owned_by` relationships point from processes to a position
- **THEN** `JobDescription.ownedProcesses` contains one entry per linked process with the process name

#### Scenario: Position with no owned_by relationships has empty ownedProcesses
- **WHEN** a position has no incoming `owned_by` relationships
- **THEN** `JobDescription.ownedProcesses` is an empty array

---

### Requirement: JobDescriptionCanvas renders a formatted document per position
`components/lenses/JobDescriptionCanvas.tsx` SHALL render a scrollable list of job description cards (one per position) as plain HTML, not a canvas or graph diagram. Each card SHALL show:
- Position title (heading)
- Department and reporting line
- Person filling the role (if any)
- Summary paragraph (if description present)
- A "Process Ownership" section listing owned processes (rendered only when `ownedProcesses` is non-empty)
- Responsibilities grouped by process, each with process name and a bulleted list of steps

#### Scenario: All positions rendered
- **WHEN** `JobDescriptionData` contains N positions
- **THEN** N job description cards are rendered in the document

#### Scenario: Empty responsibilities shows placeholder
- **WHEN** a position has no responsibilities
- **THEN** the card shows a "No responsibilities mapped" message

#### Scenario: Process Ownership section rendered when ownedProcesses present
- **WHEN** a position has one or more `ownedProcesses`
- **THEN** the card renders a "Process Ownership" section listing each owned process name

#### Scenario: Process Ownership section omitted when ownedProcesses empty
- **WHEN** a position has no `ownedProcesses`
- **THEN** the card does NOT render a "Process Ownership" section

## ADDED Requirements

### Requirement: MCP job-descriptions lens exposes ownedProcesses on each entry
`packages/mcp/src/lenses/job-descriptions.ts` SHALL collect `owned_by` links (where `link.from.typeName === 'process'` and `link.to.typeName === 'position'`) and populate an `ownedProcesses: { title: string; description?: string }[]` field on each `JobDescEntry`. Positions with no `owned_by` links SHALL have `ownedProcesses: []`.

#### Scenario: Position with owned processes has ownedProcesses populated
- **WHEN** the store has `owned_by` links from processes to a position
- **THEN** the `JobDescEntry` for that position has `ownedProcesses` containing one entry per linked process

#### Scenario: Position with no owned processes has empty ownedProcesses
- **WHEN** the store has no `owned_by` links targeting a position
- **THEN** the `JobDescEntry` for that position has `ownedProcesses: []`
