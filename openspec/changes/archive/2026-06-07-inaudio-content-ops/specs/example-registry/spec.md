## MODIFIED Requirements

### Requirement: Example registry exports a typed list of example metadata
`lib/examples.ts` SHALL export a `const EXAMPLES` array of `ExampleMeta` objects. Each object SHALL have: `id` (kebab-case string), `label` (display name), `description` (one sentence), and `lenses` (array of `LensMeta`). Each `LensMeta` SHALL have: `id` (kebab-case), `label` (display name), and `href` (the `/lens/[example]/[lens]` URL).

#### Scenario: Registry contains exactly four examples
- **WHEN** `EXAMPLES` is imported
- **THEN** it SHALL have exactly four entries with ids `mass-torts`, `ecommerce`, `lending`, and `audiobook-distributor`

#### Scenario: Each example has exactly five lens entries
- **WHEN** any entry in `EXAMPLES` is read
- **THEN** its `lenses` array SHALL have exactly five entries with ids `org-chart`, `process-flow`, `runbook`, `swimlane`, and `responsibility-map`, each with a valid `href` of the form `/lens/[example.id]/[lens.id]`
