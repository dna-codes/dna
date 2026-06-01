## ADDED Requirements

### Requirement: packages/lenses/ is a standalone npm package peer to packages/schemas/
There SHALL be a `packages/lenses/` directory at the repo root as a peer to `packages/schemas/`. It SHALL be published as `@dna-codes/dna-lenses`. It SHALL contain its own `package.json`, `README.md`, and JSON lens definition files. It SHALL have no runtime dependency on `@dna-codes/dna-schemas` — node type and relationship type names in lens definitions are plain strings, not JSON Schema `$ref`s.

#### Scenario: Package directory exists as a peer to schemas
- **WHEN** the repository is inspected
- **THEN** `packages/lenses/` SHALL exist at the same level as `packages/schemas/`

#### Scenario: Lens package has no dependency on schemas package
- **WHEN** `packages/lenses/package.json` is read
- **THEN** it SHALL NOT list `@dna-codes/dna-schemas` as a dependency

### Requirement: Lens definitions use the $id namespace https://dna.codes/lenses/
Every lens definition file SHALL carry a `$id` field using the namespace `https://dna.codes/lenses/<name>`. The base schema SHALL use `$id: https://dna.codes/lenses/base`. This namespace SHALL be distinct from the resource type schema namespace (`https://dna.codes/schemas/`).

#### Scenario: Core lens has correct $id
- **WHEN** `packages/lenses/access-control.json` is read
- **THEN** its `$id` SHALL equal `https://dna.codes/lenses/access-control`

#### Scenario: Lens base has correct $id
- **WHEN** `packages/lenses/base.json` is read
- **THEN** its `$id` SHALL equal `https://dna.codes/lenses/base`

### Requirement: packages/lenses/base.json defines the LensType contract
There SHALL be a `base.json` file in `packages/lenses/` that defines the shared contract for all lens definitions. It SHALL declare `name` as a required string, `nodes` as a required array of node slot objects, `edges` as an optional array of edge objects, and `sentence` as an optional string. It SHALL use JSON Schema Draft 2020-12. It SHALL NOT lock `additionalProperties` or `unevaluatedProperties` so that lens definitions can add their own fields.

#### Scenario: Base schema validates a minimal lens
- **WHEN** a lens with only `name` and `nodes[]` is validated against `base.json`
- **THEN** validation SHALL pass

#### Scenario: Base schema rejects a lens missing name
- **WHEN** a lens definition with no `name` field is validated against `base.json`
- **THEN** validation SHALL fail

#### Scenario: Base schema rejects a lens missing nodes
- **WHEN** a lens definition with no `nodes` array is validated against `base.json`
- **THEN** validation SHALL fail

### Requirement: Lenses are registered in packages/core/ alongside schemas
`packages/core/src/index.ts` SHALL export a `lenses` object containing all core lens definitions keyed by camelCase name. It SHALL also export an `allLenses()` function that returns all lens definitions as a flat array, parallel to the existing `allSchemas()` function. The `lenses` object and `allLenses()` SHALL be available from the main `@dna-codes/dna-core` export.

#### Scenario: lenses object is exported from dna-core
- **WHEN** `import { lenses } from '@dna-codes/dna-core'` is called
- **THEN** `lenses.accessControl`, `lenses.people`, `lenses.operational`, etc. SHALL be defined

#### Scenario: allLenses() returns all core lens definitions
- **WHEN** `allLenses()` is called
- **THEN** it SHALL return an array containing all six core lens definition objects

#### Scenario: Each lens definition has a $id field
- **WHEN** each entry returned by `allLenses()` is inspected
- **THEN** it SHALL have a `$id` field in the `https://dna.codes/lenses/` namespace
