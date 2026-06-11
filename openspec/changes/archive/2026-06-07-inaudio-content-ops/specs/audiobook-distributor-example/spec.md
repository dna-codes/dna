## ADDED Requirements

### Requirement: audiobook-distributor DNA fixture exists and is valid
A fixture file at `examples/audiobook-distributor/dna.json` SHALL exist and conform to the `ResourceGraph` schema (`name`, `description`, `resources[]`, `relationships[]`). It SHALL model INaudio's Content Operations department with the following resource types present: `company`, `department`, `domain`, `position`, `person`, `process`, `step`.

#### Scenario: Fixture contains the INaudio company resource
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain exactly one entry with `type: "company"` and `id: "inaudio"`

#### Scenario: Fixture contains the Content Operations department
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain one entry with `type: "department"` and `id: "content-ops"`

#### Scenario: Fixture contains exactly three positions
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain exactly three entries with `type: "position"`: `position-adam-barresse`, `position-jarrett-catcott`, `position-drew-hill`

#### Scenario: Fixture contains exactly three persons
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain exactly three entries with `type: "person"`: `adam-barresse`, `jarrett-catcott`, `drew-hill`

#### Scenario: Fixture contains exactly six domains
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain exactly six entries with `type: "domain"`: `domain-title-review`, `domain-chaptering`, `domain-catalog-management`, `domain-rights-management`, `domain-acx-distribution`, `domain-merchandizing-and-promotions`

#### Scenario: Fixture contains exactly six processes
- **WHEN** `examples/audiobook-distributor/dna.json` is read
- **THEN** `resources` SHALL contain exactly six entries with `type: "process"`, one per domain

#### Scenario: Every process has at least three steps
- **WHEN** each process resource is cross-referenced with `relationships` of type `part_of`
- **THEN** each process SHALL have at least three associated `step` resources

#### Scenario: Steps for title-review and chaptering are assigned to Jarrett's position
- **WHEN** `relationships` of type `assigned_to` are filtered for steps in the title-review and chaptering processes
- **THEN** every such relationship's `to` SHALL be `position-jarrett-catcott`

#### Scenario: Steps for catalog-management and rights-management are assigned to Adam's position
- **WHEN** `relationships` of type `assigned_to` are filtered for steps in those two processes
- **THEN** every such relationship's `to` SHALL be `position-adam-barresse`

#### Scenario: Steps for acx-distribution and merchandizing-and-promotions are assigned to Drew's position
- **WHEN** `relationships` of type `assigned_to` are filtered for steps in those two processes
- **THEN** every such relationship's `to` SHALL be `position-drew-hill`

### Requirement: All five lens routes exist for audiobook-distributor
Page routes SHALL exist at `app/lens/audiobook-distributor/[lens]/page.tsx` for all five lens ids: `org-chart`, `process-flow`, `runbook`, `swimlane`, `responsibility-map`. Each SHALL pass the fixture through the appropriate `fromResourceGraph` transformer and render the correct canvas component with the INaudio `CanvasTheme`.

#### Scenario: org-chart route renders
- **WHEN** `/lens/audiobook-distributor/org-chart` is rendered
- **THEN** it SHALL display a `data-testid="graph-canvas"` element with org hierarchy nodes

#### Scenario: process-flow route renders
- **WHEN** `/lens/audiobook-distributor/process-flow` is rendered
- **THEN** it SHALL display a `data-testid="graph-canvas"` element with process and step nodes

#### Scenario: runbook route renders
- **WHEN** `/lens/audiobook-distributor/runbook` is rendered
- **THEN** it SHALL display an ordered list of steps with role badges

#### Scenario: swimlane route renders
- **WHEN** `/lens/audiobook-distributor/swimlane` is rendered
- **THEN** it SHALL display a `data-testid="graph-canvas"` element with lane rows

#### Scenario: responsibility-map route renders
- **WHEN** `/lens/audiobook-distributor/responsibility-map` is rendered
- **THEN** it SHALL display a `data-testid="graph-canvas"` element with radial layout
