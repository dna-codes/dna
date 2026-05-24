## ADDED Requirements

### Requirement: Memory adapter exposes the same metadata-CRUD surfaces as the Neo4j adapter

The in-memory adapter SHALL expose `resourceType.{create,get,update,delete,list,versions}` and `relationshipType.{create,get,update,delete,list,versions}` with semantics matching the Neo4j adapter, plus `seedFromDna(dna)` and `hasBeenSeeded()`. Behaviors observable via the interface SHALL match the Neo4j adapter so tests written against memory predict Neo4j behavior.

#### Scenario: ResourceType CRUD round-trips in memory

- **WHEN** `resourceType.create({ name: "Loan", category: "resource", attribute_schema: {...} })` is invoked, then `resourceType.get(id)` is called
- **THEN** the response includes `id`, `name`, `category`, `current_version: 1`, `attribute_schema`, `is_seed: false`

#### Scenario: Update bumps current_version and appends a version record

- **WHEN** `resourceType.update(id, { attribute_schema: {...new...} })` is invoked
- **THEN** `resourceType.get(id).current_version === 2` AND `resourceType.versions(id)` returns two records in descending version order

#### Scenario: seedFromDna is idempotent and marks the seed

- **WHEN** `seedFromDna(dna)` is invoked twice in succession against the same in-process store
- **THEN** the first call writes seed records, the second call is a no-op for existing names, AND `hasBeenSeeded()` returns `true` after the first call

#### Scenario: Cascade delete clears instances

- **WHEN** a `ResourceType` named "Loan" exists with three Instances and `resourceType.delete(loanTypeId, { cascade: true })` is invoked
- **THEN** every Loan Instance is removed, the type and its versions are gone, AND `instance.list('Loan')` returns an empty array

### Requirement: Instance and Link records carry `_schemaVersion` stamps in memory

The memory adapter SHALL stamp `_schemaVersion` on every `instance.create` / `instance.update` from the relevant `ResourceType.current_version`. The same applies to `link.create` from the relevant `RelationshipType.current_version`. The stamp travels back to the caller in `instance.get` / `instance.list` / `link.list` responses.

#### Scenario: Instance carries _schemaVersion

- **WHEN** a `ResourceType` exists at `current_version: 2` and `instance.create('Loan', { amount: 1000 })` is invoked
- **THEN** the resulting record carries `_schemaVersion: 2`

#### Scenario: Update re-stamps from current_version

- **WHEN** a `:Loan` Instance exists at `_schemaVersion: 2` and the live `ResourceType` is now at `current_version: 5`, and `instance.update('Loan', id, {...})` succeeds
- **THEN** `instance.get('Loan', id)._schemaVersion === 5`

## MODIFIED Requirements

### Requirement: `migrate()` is a no-op for the memory adapter

`migrate()` SHALL be a no-op on the memory adapter (in-memory state needs no schema setup). Seeding moves to the dedicated `seedFromDna` method; the prior behavior of seeding TypeDefinition / RelationshipDef metadata in `migrate()` is removed.

#### Scenario: Migrate resolves without writing seed records

- **WHEN** `migrate()` is invoked on the memory adapter
- **THEN** the call resolves and no `ResourceType` or `RelationshipType` records are written

#### Scenario: Migrate is idempotent

- **WHEN** `migrate()` is invoked twice in succession
- **THEN** both calls resolve without side effects

### Requirement: Memory adapter is the documented test double for `DnaDataStore` consumers

The package's `README.md` and `AGENTS.md` SHALL identify `integration/memory` as the recommended test double for any package that depends on `DnaDataStore`. The docs SHALL reflect the registry-native expansion: the memory adapter implements `resourceType.*`, `relationshipType.*`, `seedFromDna`, and `hasBeenSeeded` alongside the existing `instance.*` and `link.*` surfaces. Tests in the dna-codes monorepo MUST use it (rather than mocking the interface) wherever a `DnaDataStore` is required.

#### Scenario: README documents the registry-native test-double role

- **WHEN** `packages/adapters/src/integration/memory/README.md` is read
- **THEN** it identifies the memory adapter as the recommended test double for `DnaDataStore` consumers AND gives a minimal example that exercises both `resourceType.create` and `instance.create`
