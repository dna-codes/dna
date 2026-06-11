## MODIFIED Requirements

### Requirement: Example registry contains five lenses per example
Each entry in `EXAMPLES` SHALL have exactly five `LensMeta` entries: `org-chart`, `process-flow`, `runbook`, `swimlane`, and `responsibility-map`. Each `LensMeta` SHALL have a valid `href` of the form `/lens/[example.id]/[lens.id]`.

#### Scenario: Each example has five lens entries
- **WHEN** `EXAMPLES` is imported and any entry is read
- **THEN** its `lenses` array SHALL have exactly five entries

#### Scenario: Swimlane href is correct
- **WHEN** the swimlane `LensMeta` for any example is read
- **THEN** its `href` SHALL be `/lens/[example.id]/swimlane`

#### Scenario: Responsibility map href is correct
- **WHEN** the responsibility-map `LensMeta` for any example is read
- **THEN** its `href` SHALL be `/lens/[example.id]/responsibility-map`
