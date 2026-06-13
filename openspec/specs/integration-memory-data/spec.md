# integration-memory-data Specification

## Purpose

Defines the `@dna-codes/dna-adapters/integration/memory` subpath: a zero-dependency, in-memory implementation of the `DnaDataStore` contract from `@dna-codes/dna-core`. Mirrors the Neo4j adapter's semantics so tests written against memory predict Neo4j behavior. The recommended test double for any package that depends on `DnaDataStore` (transport wrappers, DNA-driven applications, integration tests), and the local-development substitute when a Neo4j instance is unavailable.

## Requirements

### Requirement: Package exports an in-memory `DnaDataStore` implementation

`@dna-codes/dna-adapters/integration/memory` SHALL export a `createClient(dna: OperationalDNA): DnaDataStore` factory whose return value satisfies the `DnaDataStore` interface from `@dna-codes/dna-core`. The implementation MUST NOT introduce any runtime dependencies beyond what `@dna-codes/dna-adapters` already declares.

#### Scenario: Factory returns a DnaDataStore

- **WHEN** `createClient(dna)` is invoked with a valid `OperationalDNA`
- **THEN** the result has `migrate`, `instance.create/get/update/delete/list`, `link.create/delete/list`, and `close` methods matching the `DnaDataStore` interface

#### Scenario: No new runtime dependencies

- **WHEN** the package is installed and only the `integration/memory` subpath is imported
- **THEN** no transitive runtime dependencies beyond the existing `@dna-codes/dna-adapters` dependency set are present

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

### Requirement: `migrate()` is a no-op for the memory adapter

`migrate()` SHALL be a no-op on the memory adapter (in-memory state needs no schema setup). Seeding moves to the dedicated `seedFromDna` method; the prior behavior of seeding TypeDefinition / RelationshipDef metadata in `migrate()` is removed.

#### Scenario: Migrate resolves without writing seed records

- **WHEN** `migrate()` is invoked on the memory adapter
- **THEN** the call resolves and no `ResourceType` or `RelationshipType` records are written

#### Scenario: Migrate is idempotent

- **WHEN** `migrate()` is invoked twice in succession
- **THEN** both calls resolve without side effects

### Requirement: Per-Instance CRUD scoped by `typeName`

The client SHALL expose Instance CRUD methods scoped by a Resource/Person/Role/Group name (`typeName`). Each method MUST operate on Instances of the given type only. The `id` field uniquely identifies an Instance within a type; the same `id` MAY be reused across different types without collision.

#### Scenario: Create then get round-trips data

- **WHEN** `instance.create("Loan", { amount: 1000, status: "pending" })` is called and `instance.get("Loan", <returned id>)` follows
- **THEN** the `get` call resolves with `{ amount: 1000, status: "pending" }` (plus the assigned `id`)

#### Scenario: Get on missing id returns null

- **WHEN** `instance.get("Loan", "nonexistent-id")` is called and no such Instance exists
- **THEN** the call resolves with `null` (does not throw)

#### Scenario: Update applies a patch

- **WHEN** an Instance is created with `{ amount: 1000, status: "pending" }` and `instance.update("Loan", id, { status: "active" })` is called
- **THEN** a subsequent `instance.get("Loan", id)` returns `{ amount: 1000, status: "active" }` (the patch is shallow-merged)

#### Scenario: Delete removes the Instance

- **WHEN** an Instance is created and `instance.delete("Loan", id)` is called
- **THEN** a subsequent `instance.get("Loan", id)` resolves with `null`

#### Scenario: List returns all Instances of a type

- **WHEN** three Loan Instances are created and `instance.list("Loan")` is called
- **THEN** the result is an array of three records, each carrying the assigned `id` and the stored data

#### Scenario: Same id across different types does not collide

- **WHEN** `instance.create("Loan", { id: "shared", amount: 1000 })` and `instance.create("Borrower", { id: "shared", name: "Alice" })` are both called
- **THEN** both creates succeed and a subsequent `instance.get("Loan", "shared")` returns the Loan data while `instance.get("Borrower", "shared")` returns the Borrower data

### Requirement: Link CRUD with `from`, `to`, optional `role` and `attributes`

The client SHALL expose Link CRUD methods. A Link connects two Instances identified by `{ typeName, id }`. Each Link MAY carry an optional `role` discriminator and optional `attributes` payload. Each Link has its own unique ID.

#### Scenario: Create a Link between two Instances

- **WHEN** a Loan Instance `L1` and a Borrower Instance `B1` exist and `link.create({ typeName: "Loan", id: L1 }, { typeName: "Borrower", id: B1 })` is called
- **THEN** the call resolves with `{ id: <linkId> }` and a subsequent `link.list({ from: { typeName: "Loan", id: L1 } })` returns one Link with `to: { typeName: "Borrower", id: B1 }`

#### Scenario: Link carries an optional role and attributes

- **WHEN** `link.create({...}, {...}, { role: "primary_borrower", attributes: { assigned_at: "2026-05-23" } })` is called
- **THEN** a subsequent `link.list({ role: "primary_borrower" })` includes that Link with `attributes: { assigned_at: "2026-05-23" }`

#### Scenario: Delete a Link by id

- **WHEN** a Link is created and `link.delete(linkId)` is called
- **THEN** subsequent `link.list()` calls (with no filter or with any matching filter) do not include that Link

#### Scenario: List Links filtered by from / to / role

- **WHEN** multiple Links exist with mixed `from`, `to`, and `role` values and `link.list({ from: { typeName: "Loan", id: L1 }, role: "primary_borrower" })` is called
- **THEN** the result includes only Links whose `from` matches `L1` AND whose `role` is `primary_borrower`

### Requirement: Hybrid ID assignment — caller-provided or adapter-generated UUIDv4

`instance.create(typeName, data)` SHALL accept an optional `id` field within `data`. If present, that ID MUST be used and a collision with an existing Instance of the same type MUST throw. If absent, the adapter MUST generate a UUIDv4. The create response MUST include the resolved `id`. The same contract applies to `link.create` via an `opts.id` field.

#### Scenario: Caller-provided id is honored

- **WHEN** `instance.create("Loan", { id: "loan-42", amount: 1000 })` is called
- **THEN** the response is `{ id: "loan-42" }` and `instance.get("Loan", "loan-42")` returns the stored data

#### Scenario: Collision on caller-provided id throws

- **WHEN** `instance.create("Loan", { id: "loan-42", amount: 1000 })` is called and then `instance.create("Loan", { id: "loan-42", amount: 2000 })` is called
- **THEN** the second call rejects with an error

#### Scenario: Adapter generates a UUIDv4 when id is omitted

- **WHEN** `instance.create("Loan", { amount: 1000 })` is called with no `id` field
- **THEN** the response `{ id }` carries a string matching the UUIDv4 format

### Requirement: Memory adapter is the documented test double for `DnaDataStore` consumers

The package's `README.md` and `AGENTS.md` SHALL identify `integration/memory` as the recommended test double for any package that depends on `DnaDataStore`. The docs SHALL reflect the registry-native expansion: the memory adapter implements `resourceType.*`, `relationshipType.*`, `seedFromDna`, and `hasBeenSeeded` alongside the existing `instance.*` and `link.*` surfaces. Tests in the dna-codes monorepo MUST use it (rather than mocking the interface) wherever a `DnaDataStore` is required.

#### Scenario: README documents the registry-native test-double role

- **WHEN** `packages/adapters/src/integration/memory/README.md` is read
- **THEN** it identifies the memory adapter as the recommended test double for `DnaDataStore` consumers AND gives a minimal example that exercises both `resourceType.create` and `instance.create`
