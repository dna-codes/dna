## ADDED Requirements

### Requirement: Example registry exports a typed list of example metadata
`lib/examples.ts` SHALL export a `const EXAMPLES` array of `ExampleMeta` objects. Each object SHALL have: `id` (kebab-case string), `label` (display name), `description` (one sentence), and `lenses` (array of `LensMeta`). Each `LensMeta` SHALL have: `id` (kebab-case), `label` (display name), and `href` (the `/lens/[example]/[lens]` URL).

#### Scenario: Registry contains exactly three examples
- **WHEN** `EXAMPLES` is imported
- **THEN** it SHALL have exactly three entries with ids `mass-torts`, `ecommerce`, and `incident-response`

#### Scenario: Each example lists its lenses
- **WHEN** any entry in `EXAMPLES` is read
- **THEN** its `lenses` array SHALL contain at least two entries, each with a valid `href` of the form `/lens/[example.id]/[lens.id]`

### Requirement: Index page renders an example gallery from the registry
The root index page (`app/page.tsx`) SHALL render one card per entry in `EXAMPLES`. Each card SHALL display the example label, description, and a list of lens links derived from `ExampleMeta.lenses`.

#### Scenario: Index shows all examples
- **WHEN** the index page is rendered
- **THEN** one card per `EXAMPLES` entry SHALL be present, identified by the example label

#### Scenario: Lens links are correct hrefs
- **WHEN** a lens link in an example card is clicked
- **THEN** the browser SHALL navigate to `/lens/[example]/[lens]`
