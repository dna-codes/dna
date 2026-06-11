### Requirement: ResourceItem supports optional description
`ResourceItem` in `lib/resource-graph.ts` SHALL include an optional `description?: string` field so that DNA JSON nodes with descriptions are typed correctly throughout the system.

#### Scenario: Position node with description is typed
- **WHEN** a DNA JSON resource has `{ "type": "position", "description": "..." }`
- **THEN** the `ResourceItem` type accepts `description` without a TypeScript error

#### Scenario: Nodes without description remain valid
- **WHEN** a DNA JSON resource omits `description`
- **THEN** `ResourceItem` remains valid with `description` as `undefined`

---

### Requirement: DNA example files include descriptions on position and process nodes
All example DNA JSON files (ecommerce, lending, audiobook-distributor, mass-torts-org) SHALL include a `description` field on every `position` and `process` resource. The description SHALL be a single sentence summarising the role or process purpose.

#### Scenario: Position descriptions present in ecommerce example
- **WHEN** `examples/ecommerce/dna.json` is loaded
- **THEN** every resource with `"type": "position"` has a non-empty `description` string

#### Scenario: Process descriptions present in lending example
- **WHEN** `examples/lending/dna.json` is loaded
- **THEN** every resource with `"type": "process"` has a non-empty `description` string

---

### Requirement: Job-description lens transform produces JobDescriptionData
`lib/lenses/job-description/fromResourceGraph.ts` SHALL export a `fromResourceGraph(graph: ResourceGraph): JobDescriptionData` function that produces one `JobDescription` entry per position resource, with:
- `title` from the position's `name`
- `department` from the department/domain/group the position belongs to (via `belongs_to`)
- `reportsTo` from the position's `reports_to` target name (if any)
- `filledBy` from the person who `fills` the position (if any)
- `summary` from `position.description` (if present)
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

---

### Requirement: JobDescriptionCanvas renders a formatted document per position
`components/lenses/JobDescriptionCanvas.tsx` SHALL render a scrollable list of job description cards (one per position) as plain HTML, not a canvas or graph diagram. Each card SHALL show:
- Position title (heading)
- Department and reporting line
- Person filling the role (if any)
- Summary paragraph (if description present)
- Responsibilities grouped by process, each with process name and a bulleted list of steps

#### Scenario: All positions rendered
- **WHEN** `JobDescriptionData` contains N positions
- **THEN** N job description cards are rendered in the document

#### Scenario: Empty responsibilities shows placeholder
- **WHEN** a position has no responsibilities
- **THEN** the card shows a "No responsibilities mapped" message

---

### Requirement: Job-description route exists for each example
Each example with positions SHALL have a Next.js route at `app/lens/{example}/job-description/page.tsx` that loads the example's DNA JSON, calls `fromResourceGraph`, and renders `JobDescriptionCanvas` inside `LensShell`.

#### Scenario: Ecommerce job description page renders
- **WHEN** the user navigates to `/lens/ecommerce/job-description`
- **THEN** the page renders job descriptions for all Apex Commerce positions

#### Scenario: Lending job description page renders
- **WHEN** the user navigates to `/lens/lending/job-description`
- **THEN** the page renders job descriptions for all ClearPath Lending positions

#### Scenario: Audiobook-distributor job description page renders
- **WHEN** the user navigates to `/lens/audiobook-distributor/job-description`
- **THEN** the page renders job descriptions for all INaudio Content Ops positions

#### Scenario: Mass-torts job description page renders
- **WHEN** the user navigates to `/lens/mass-torts/job-description`
- **THEN** the page renders job descriptions for all Marshall Fire Justice positions

---

### Requirement: Lens registry includes job-description entry
`lib/lens-registry.ts` SHALL include an entry for `job-description` with a title, description, and href.

#### Scenario: getLens returns job-description entry
- **WHEN** `getLens('job-description')` is called
- **THEN** it returns a non-null `LensEntry` with `title: 'Job Description'`
