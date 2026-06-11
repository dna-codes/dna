# example-registry Specification

## Purpose
Defines the `EXAMPLES` registry in `lib/examples.ts` that powers the Graph Studio index gallery, mapping each example to its available lenses.

## Requirements

### Requirement: Example registry exports a typed list of example metadata
`lib/examples.ts` SHALL export a `const EXAMPLES` array of `ExampleMeta` objects. Each object SHALL have: `id` (kebab-case string), `label` (display name), `description` (one sentence), and `lenses` (array of `LensMeta`). Each `LensMeta` SHALL have: `id` (kebab-case), `label` (display name), and `href` (the `/lens/[example]/[lens]` URL).

#### Scenario: Registry contains exactly four examples
- **WHEN** `EXAMPLES` is imported
- **THEN** it SHALL have exactly four entries with ids `mass-torts`, `ecommerce`, `lending`, and `audiobook-distributor`

#### Scenario: Each example has exactly five lens entries
- **WHEN** any entry in `EXAMPLES` is read
- **THEN** its `lenses` array SHALL have exactly five entries with ids `org-chart`, `process-flow`, `runbook`, `swimlane`, and `responsibility-map`, each with a valid `href` of the form `/lens/[example.id]/[lens.id]`

### Requirement: Index page renders an example gallery from the registry
The root index page (`app/page.tsx`) SHALL render one card per entry in `EXAMPLES`. Each card SHALL display the example label, description, and a list of lens links derived from `ExampleMeta.lenses`.

#### Scenario: Index shows all examples
- **WHEN** the index page is rendered
- **THEN** one card per `EXAMPLES` entry SHALL be present, identified by the example label

#### Scenario: Lens links are correct hrefs
- **WHEN** a lens link in an example card is clicked
- **THEN** the browser SHALL navigate to `/lens/[example]/[lens]`

#### Scenario: Swimlane href is correct
- **WHEN** the swimlane `LensMeta` for any example is read
- **THEN** its `href` SHALL be `/lens/[example.id]/swimlane`

#### Scenario: Responsibility map href is correct
- **WHEN** the responsibility-map `LensMeta` for any example is read
- **THEN** its `href` SHALL be `/lens/[example.id]/responsibility-map`
