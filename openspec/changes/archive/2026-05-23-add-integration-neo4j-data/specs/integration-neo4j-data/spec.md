## ADDED Requirements

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

### Requirement: `migrate()` seeds TypeDefinition / RelationshipDef nodes and creates constraints + indexes

`migrate()` SHALL `MERGE` one `:TypeDefinition` node per noun primitive in the DNA (Resources, Persons, Roles, Groups) and one `:RelationshipDef` node per entry in `dna.relationships[]`. It SHALL create `UNIQUE` constraints on `(:TypeDefinition) REQUIRE name`, `(:RelationshipDef) REQUIRE name`, and `(:<TypeLabel>) REQUIRE _id` for every distinct noun-primitive label declared in the DNA. It SHALL create indexes on `(:<TypeLabel>) ON _typeName` and `()-[:LINK]-() ON _id`. The method MUST be idempotent — repeated calls MUST NOT throw and MUST NOT duplicate metadata.

#### Scenario: TypeDefinition nodes seeded from the DNA

- **WHEN** `migrate()` is called on a client constructed with a DNA whose domain declares Resources `Loan` and `Borrower`, and Role `Underwriter`
- **THEN** three `:TypeDefinition` nodes are present with names `Loan`, `Borrower`, `Underwriter` and categories `resource`, `resource`, `role`

#### Scenario: Constraints and indexes created

- **WHEN** `migrate()` is called and the database schema is inspected (`SHOW CONSTRAINTS` / `SHOW INDEXES`)
- **THEN** the listed schema includes `UNIQUE` constraints on `(:TypeDefinition) REQUIRE name`, `(:RelationshipDef) REQUIRE name`, and `(:Loan) REQUIRE _id` (one per declared noun-primitive label) plus the per-label `_typeName` and `LINK._id` indexes

#### Scenario: Migrate is idempotent

- **WHEN** `migrate()` is called twice in succession against the same Neo4j database
- **THEN** the second call resolves without throwing and the resulting `:TypeDefinition` / `:RelationshipDef` node counts and the schema constraint/index set are unchanged

### Requirement: Round-trip CRUD against canonical fixtures

The adapter SHALL pass round-trip tests for all `DnaDataStore` Instance and Link methods against the `examples/registry` and `examples/lending` DNA fixtures. Tests MUST be gated on the `NEO4J_URI` environment variable: when unset, the Neo4j tests are skipped (not failed). The same test suite that runs against the memory adapter MUST run against the Neo4j adapter when the env var is set, with identical assertions.

#### Scenario: Tests skip cleanly when NEO4J_URI is unset

- **WHEN** the test suite is run without `NEO4J_URI` defined
- **THEN** the Neo4j adapter tests are reported as skipped (not failed) and the overall test run succeeds

#### Scenario: Same fixture round-trips through Neo4j and memory with identical results

- **WHEN** the shared CRUD test suite is run against both the memory adapter and the Neo4j adapter with the same fixture and the same operation sequence
- **THEN** the observable results (returned data, list contents, deletion behavior) are identical between the two

### Requirement: CLI with `migrate`, instance CRUD, and Link CRUD commands

The package SHALL ship a `cli.ts` exposing `migrate`, `instance:create`, `instance:get`, `instance:update`, `instance:delete`, `instance:list`, `link:create`, `link:delete`, and `link:list` commands. Credentials MUST come from the environment variables `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, and optional `NEO4J_DATABASE` — never from flags. The DNA MUST be loaded from a `--dna <file>` flag. Write commands (`instance:create`, `instance:update`, `link:create`) MUST validate the input payload via `DnaValidator` from `@dna-codes/dna-core` before invoking the library API.

#### Scenario: Credentials read from env, not flags

- **WHEN** `cli instance:list --type Loan --dna ./dna.json` is run with `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` defined in the environment
- **THEN** the command authenticates against Neo4j using those env values and returns the Loan Instance list

#### Scenario: Missing credential env var fails fast

- **WHEN** any CLI command is run with `NEO4J_URI` unset
- **THEN** the command exits non-zero with an error message naming the missing env var

#### Scenario: Write command validates before persisting

- **WHEN** `cli instance:create --type Loan --dna ./dna.json --in ./bad.json` is run with a payload that fails `DnaValidator` (e.g., missing a required attribute)
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
