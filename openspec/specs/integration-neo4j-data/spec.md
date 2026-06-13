# integration-neo4j-data Specification

## Purpose

Defines the `@dna-codes/dna-adapters/integration/neo4j` subpath: a Neo4j-backed, registry-native implementation of the `DnaDataStore` contract from `@dna-codes/dna-core`. Persists both the type registry (`:ResourceType` / `:RelationshipType` metadata nodes with versioned history) and the *runtime data* described by an `OperationalDNA` (Loan records, Borrower records, the Links between them). Instances become labeled nodes (label = Resource/Person/Role/Group name) stamped with `_schemaVersion`, Links become typed `[:LINK]` edges between Instance nodes, `migrate()` creates only constraints + indexes, and `seedFromDna()` writes the registry records and a seed marker on first boot. Deliberately DNA-aware as a documented exception to the integration pure-I/O rule.

## Requirements

### Requirement: Package exports a Neo4j-backed `DnaDataStore` implementation

`@dna-codes/dna-adapters/integration/neo4j` SHALL export a `createClient(opts: Neo4jClientOptions, dna: OperationalDNA): DnaDataStore` factory whose return value satisfies the `DnaDataStore` interface from `@dna-codes/dna-core`. `Neo4jClientOptions` MUST include `uri`, `username`, `password`, and an optional `database`. The package MAY declare `neo4j-driver` as a runtime dependency scoped to this subpath; consumers who do not import `integration/neo4j` MUST NOT install `neo4j-driver`.

#### Scenario: Factory returns a DnaDataStore

- **WHEN** `createClient({ uri, username, password }, dna)` is invoked
- **THEN** the result has `migrate`, `instance.*`, `link.*`, and `close` methods matching the `DnaDataStore` interface

#### Scenario: `neo4j-driver` is scoped to the subpath

- **WHEN** a consumer imports `@dna-codes/dna-adapters/integration/memory` only and runs `npm install`
- **THEN** `neo4j-driver` is not installed in `node_modules`

### Requirement: Instances stored as labeled nodes; Links as typed edges with properties

Each Instance SHALL be persisted as a Neo4j node whose label equals its `typeName` (the Resource/Person/Role/Group name from the DNA). The node SHALL carry the Instance `data` as flat properties plus the reserved properties `_id`, `_typeName`, `_createdAt`, `_updatedAt`. Each Link SHALL be persisted as a directed `LINK` edge between two Instance nodes, carrying `_id`, optional `role`, optional `attributes` (serialized JSON), and `createdAt` as edge properties.

#### Scenario: Instance node carries the type name as its label

- **WHEN** `instance.create("Loan", { amount: 1000 })` is called and the underlying Neo4j graph is inspected
- **THEN** a node with label `:Loan` exists carrying properties `_id`, `_typeName: "Loan"`, `amount: 1000`, `_createdAt`, `_updatedAt`

#### Scenario: Link edge connects Instance nodes with role and attributes

- **WHEN** a Loan Instance `L1` and a Borrower Instance `B1` exist and `link.create({typeName: "Loan", id: L1}, {typeName: "Borrower", id: B1}, { role: "primary_borrower", attributes: { assigned_at: "2026-05-23" } })` is called
- **THEN** a directed `[:LINK]` edge from the `:Loan {_id: L1}` node to the `:Borrower {_id: B1}` node exists with edge properties `_id`, `role: "primary_borrower"`, `attributes: '{"assigned_at":"2026-05-23"}'`

### Requirement: `migrate()` creates constraints and indexes only — no seeding

`migrate()` SHALL only create database constraints and indexes (idempotent via `IF NOT EXISTS`). It SHALL NOT seed any data. The constraints created are: `(:ResourceType) REQUIRE name IS UNIQUE`, `(:RelationshipType) REQUIRE name IS UNIQUE`, `(:ResourceTypeVersion) REQUIRE id IS UNIQUE`, `(:RelationshipTypeVersion) REQUIRE id IS UNIQUE`, and the `()-[:LINK]-() ON _id` index. Per-typename Instance-uniqueness constraints (`(:Loan) REQUIRE _id IS UNIQUE`, etc.) are no longer created in `migrate()` — they are created on-demand when `resourceType.create` is invoked for a new type. Seeding moves to the dedicated `seedFromDna` method.

#### Scenario: Migrate on an empty database creates only schema artifacts

- **WHEN** `migrate()` is invoked against a fresh Neo4j
- **THEN** no `:ResourceType`, `:RelationshipType`, or `:SeedMarker` nodes are written; only the static metadata constraints and the LINK index are created

#### Scenario: Migrate is idempotent across repeated calls

- **WHEN** `migrate()` is invoked twice in succession
- **THEN** both calls resolve without throwing and the schema artifact set is unchanged

#### Scenario: Per-typename constraint is created on resourceType.create

- **WHEN** `resourceType.create({ name: "Loan", ... })` is invoked after `migrate()`
- **THEN** a `(:Loan) REQUIRE _id IS UNIQUE` constraint is created (idempotent)

### Requirement: `DnaDataStore` exposes metadata-CRUD surfaces for `ResourceType` and `RelationshipType`

The `DnaDataStore` interface (in `@dna-codes/dna-core`) SHALL expose `resourceType.{create,get,update,delete,list,versions}` and `relationshipType.{create,get,update,delete,list,versions}` methods. Each `create` writes the live type record plus an initial version record. Each `update` writes a new immutable version record and bumps the live record's `current_version`.

#### Scenario: Create writes the live type and an initial version

- **WHEN** `resourceType.create({ name: "Loan", category: "resource", attribute_schema: {...} })` is invoked
- **THEN** a `:ResourceType` node with `current_version: 1` and `is_seed: false` is written, plus a `:ResourceTypeVersion` node `{version: 1, attribute_schema: {...}}` linked via `[:VERSION_OF]`

#### Scenario: Update creates a new version and bumps current_version

- **WHEN** `resourceType.update(id, { attribute_schema: {...new...} })` is invoked against a type with `current_version: 1`
- **THEN** a new `:ResourceTypeVersion {version: 2}` node is written and the live `:ResourceType.current_version` becomes `2`

#### Scenario: Get returns the live record with current_version

- **WHEN** `resourceType.get(id)` is invoked
- **THEN** the response includes `id`, `name`, `category`, `current_version`, `attribute_schema`, `is_seed`

#### Scenario: List returns every live type, optionally filtered by category

- **WHEN** `resourceType.list({ category: "person" })` is invoked
- **THEN** the response includes only `ResourceType` records with `category: "person"`

#### Scenario: Versions list reflects every update

- **WHEN** a `ResourceType` has been updated twice (versions 1, 2, 3) and `resourceType.versions(id)` is called
- **THEN** the response contains three `ResourceTypeVersion` records in order `[3, 2, 1]`

### Requirement: Cascade-delete semantics on type deletion

`resourceType.delete(id, opts)` SHALL reject with a `TypeInUseError` if any `:Resource` instance of that type exists, unless `opts.cascade === true`. With cascade, the adapter SHALL delete all matching `:Resource` instances and their related `:LINK` edges before removing the type and its versions. Same semantics for `relationshipType.delete`.

#### Scenario: Delete without cascade rejects when instances exist

- **WHEN** at least one `:Loan` instance exists and `resourceType.delete(loanTypeId)` is invoked without cascade
- **THEN** the call rejects with an error referencing the in-use count

#### Scenario: Cascade delete removes the type and its instances

- **WHEN** `resourceType.delete(loanTypeId, { cascade: true })` is invoked
- **THEN** every `:Loan` instance is deleted (along with adjacent `:LINK` edges), the `:ResourceType` node and its `:ResourceTypeVersion` history are removed, and the call resolves

### Requirement: `seedFromDna` writes seed records and a seed marker

The adapter SHALL expose `seedFromDna(dna): Promise<SeedReport>` translating DNA noun primitives and relationships into `ResourceType` / `RelationshipType` records. The method SHALL be idempotent on `name`: existing types are NOT overwritten. After successful seeding, the adapter SHALL write a `:SeedMarker` (or equivalent sentinel) node carrying a hash of the seed DNA.

#### Scenario: Foundational ResourceTypes seeded from DNA noun-categories

- **WHEN** `seedFromDna(dna)` is invoked against an empty store
- **THEN** four `:ResourceType` records named `Person`, `Role`, `Group`, `Resource` with `is_seed: true` and matching `category` values are written

#### Scenario: Domain entries seeded per DNA collection

- **WHEN** the DNA contains `dna.domain.resources: [{ name: "Loan", ... }]`
- **THEN** a `:ResourceType` record named `Loan` with `is_seed: true` and `category: resource` is written

#### Scenario: Relationships seeded per DNA entry

- **WHEN** the DNA contains `dna.relationships: [{ name: "Loan.borrower", from: "Loan", to: "Borrower", cardinality: "many-to-one", attribute: "borrower_id" }]`
- **THEN** a `:RelationshipType` record named `Loan.borrower` with `is_seed: true` is written

#### Scenario: Re-seeding preserves admin edits

- **WHEN** an admin has updated a seeded type's `attribute_schema` and `seedFromDna(dna)` is invoked again
- **THEN** the admin-edited type is NOT overwritten; the call is a no-op for that name

### Requirement: `hasBeenSeeded` exposes seed-marker state

The adapter SHALL expose `hasBeenSeeded(): Promise<boolean>` returning `true` iff a `:SeedMarker` node (or equivalent sentinel) exists. The CLI uses this to decide whether to invoke `seedFromDna` on startup.

#### Scenario: Returns false on an empty store

- **WHEN** `hasBeenSeeded()` is called against a fresh Neo4j
- **THEN** the response is `false`

#### Scenario: Returns true after seeding

- **WHEN** `seedFromDna(dna)` has been invoked successfully and `hasBeenSeeded()` is called
- **THEN** the response is `true`

### Requirement: Storage labels renamed for clarity

The Neo4j storage SHALL use `:ResourceType` (renamed from `:TypeDefinition` in `add-integration-neo4j-data`) and `:RelationshipType` (renamed from `:RelationshipDef`) as the metadata-node labels. Per-typename Instance node labels (`:Loan`, `:Borrower`, etc.) SHALL remain unchanged. The `[:LINK]` edge label SHALL remain unchanged. The migration script `packages/api/scripts/migrate-to-registry.ts` renames labels in-place for existing data.

#### Scenario: New deployments use renamed labels

- **WHEN** `seedFromDna` is invoked against a fresh Neo4j and the schema is inspected
- **THEN** `:ResourceType` and `:RelationshipType` nodes exist; `:TypeDefinition` and `:RelationshipDef` labels are absent

#### Scenario: Migration script renames labels in-place

- **WHEN** `packages/api/scripts/migrate-to-registry.ts` is invoked against a Neo4j with pre-existing `:TypeDefinition` nodes
- **THEN** every `:TypeDefinition` node is renamed to `:ResourceType` (with `current_version: 1` and `is_seed: false` stamped), every `:RelationshipDef` is renamed to `:RelationshipType`, and a `:SeedMarker` node is written

### Requirement: Instance and Link writes carry `_schemaVersion` stamp

Every `:Resource` instance node created via `instance.create` or updated via `instance.update` SHALL carry a `_schemaVersion: int` property stamped from the relevant `:ResourceType.current_version` at write time. Same stamping applies to `:LINK` edges via the relevant `:RelationshipType.current_version`.

#### Scenario: Instance writes carry schema version stamp

- **WHEN** an Instance is created via `instance.create('Loan', {...})` while the live `:ResourceType` is at `current_version: 3`
- **THEN** the resulting `:Loan` node carries property `_schemaVersion: 3`

#### Scenario: Updates re-stamp from the current ResourceType version

- **WHEN** a Loan Instance exists at `_schemaVersion: 2` and the live `:ResourceType` is now at `current_version: 5`, and `instance.update('Loan', id, {...})` succeeds
- **THEN** the resulting node carries `_schemaVersion: 5`

### Requirement: Round-trip CRUD against canonical fixtures

The adapter SHALL pass round-trip tests for all `DnaDataStore` Instance and Link methods against the `examples/registry` and `examples/lending` DNA fixtures. Tests MUST be gated on the `NEO4J_URI` environment variable: when unset, the Neo4j tests are skipped (not failed). The same test suite that runs against the memory adapter MUST run against the Neo4j adapter when the env var is set, with identical assertions.

#### Scenario: Tests skip cleanly when NEO4J_URI is unset

- **WHEN** the test suite is run without `NEO4J_URI` defined
- **THEN** the Neo4j adapter tests are reported as skipped (not failed) and the overall test run succeeds

#### Scenario: Same fixture round-trips through Neo4j and memory with identical results

- **WHEN** the shared CRUD test suite is run against both the memory adapter and the Neo4j adapter with the same fixture and the same operation sequence
- **THEN** the observable results (returned data, list contents, deletion behavior) are identical between the two

### Requirement: CLI with `migrate`, instance CRUD, and Link CRUD commands

The package SHALL ship a `cli.ts` exposing `migrate`, `instance:create`, `instance:get`, `instance:update`, `instance:delete`, `instance:list`, `link:create`, `link:delete`, and `link:list` commands. Credentials MUST come from the environment variables `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, and optional `NEO4J_DATABASE` — never from flags. The DNA MUST be loaded from a `--dna <file>` flag. Write commands (`instance:create`, `instance:update`, `link:create`) MUST validate the input payload via `ajv` against the relevant `ResourceType.attribute_schema` before invoking the library API. Per-ResourceType / RelationshipType admin CRUD is not exposed via the integration CLI — it lives in the API layer.

#### Scenario: Credentials read from env, not flags

- **WHEN** `cli instance:list --type Loan --dna ./dna.json` is run with `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` defined in the environment
- **THEN** the command authenticates against Neo4j using those env values and returns the Loan Instance list

#### Scenario: Missing credential env var fails fast

- **WHEN** any CLI command is run with `NEO4J_URI` unset
- **THEN** the command exits non-zero with an error message naming the missing env var

#### Scenario: Write command validates against the ResourceType.attribute_schema before persisting

- **WHEN** `cli instance:create --type Loan --dna ./dna.json --in ./bad.json` is run with a payload that fails ajv validation
- **THEN** the command exits non-zero with a validation error and no node is written to Neo4j

### Requirement: DNA-awareness exception documented

The adapter is a deliberate exception to the integration pure-I/O rule because it takes an `OperationalDNA` at construction time and stores DNA-derived TypeDefinition metadata. The exception SHALL be documented in `packages/adapters/src/integration/neo4j/AGENTS.md` with the rationale, alongside the existing exception note for any persistence integration.

#### Scenario: AGENTS.md documents the exception

- **WHEN** `packages/adapters/src/integration/neo4j/AGENTS.md` is read
- **THEN** it explicitly states that this integration is DNA-aware by design (takes an `OperationalDNA` at construction), names the rationale (DNA-derived type system as data), and contrasts with external-system integrations (Jira, Notion, Google Drive) that remain pure I/O

### Requirement: ProcessStep is not promoted to nodes

The adapter SHALL NOT materialize `ProcessStep` sub-objects as Neo4j nodes or edges. Process records (if persisted as Instances) carry their `steps` array as a serialized JSON property. This restriction is documented in the README as a parked design decision with the rationale that no current consumer requires step-level DAG traversal in Cypher.

#### Scenario: README documents the ProcessStep limitation

- **WHEN** `packages/adapters/src/integration/neo4j/README.md` is read
- **THEN** it explicitly states that `ProcessStep` is not modeled as Neo4j nodes in v1 and references this as a parked decision available for promotion in a future change
