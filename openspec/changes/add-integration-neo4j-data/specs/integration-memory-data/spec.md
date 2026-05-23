## ADDED Requirements

### Requirement: Package exports an in-memory `DnaDataStore` implementation

`@dna-codes/dna-adapters/integration/memory` SHALL export a `createClient(dna: OperationalDNA): DnaDataStore` factory whose return value satisfies the `DnaDataStore` interface from `@dna-codes/dna-core`. The implementation MUST NOT introduce any runtime dependencies beyond what `@dna-codes/dna-adapters` already declares.

#### Scenario: Factory returns a DnaDataStore

- **WHEN** `createClient(dna)` is invoked with a valid `OperationalDNA`
- **THEN** the result has `migrate`, `instance.create/get/update/delete/list`, `link.create/delete/list`, and `close` methods matching the `DnaDataStore` interface

#### Scenario: No new runtime dependencies

- **WHEN** the package is installed and only the `integration/memory` subpath is imported
- **THEN** no transitive runtime dependencies beyond the existing `@dna-codes/dna-adapters` dependency set are present

### Requirement: `migrate()` seeds TypeDefinition and RelationshipDef metadata from the DNA

`migrate()` SHALL register a TypeDefinition record for every entry in `dna.domain.resources[]`, `dna.domain.persons[]`, `dna.domain.roles[]`, and `dna.domain.groups[]`, each carrying its name, category (`resource | person | role | group`), and attribute schema. It SHALL register a RelationshipDef record for every entry in `dna.relationships[]`. The method MUST be idempotent.

#### Scenario: Seeding noun primitives as TypeDefinitions

- **WHEN** `migrate()` is called on a client constructed with a DNA whose domain declares one Resource (`Loan`), one Person (`Borrower`), one Role (`Underwriter`), and one Group (`BankDepartment`)
- **THEN** four TypeDefinition records are registered with names `Loan`, `Borrower`, `Underwriter`, `BankDepartment` and categories `resource`, `person`, `role`, `group` respectively

#### Scenario: Seeding relationships as RelationshipDefs

- **WHEN** `migrate()` is called on a client constructed with a DNA whose `relationships[]` contains `{ name: "Loan.borrower", from: "Loan", to: "Borrower", cardinality: "many-to-one", attribute: "borrower_id" }`
- **THEN** a RelationshipDef record named `Loan.borrower` is registered with the same `from`, `to`, `cardinality`, `attribute`

#### Scenario: Migrate is idempotent

- **WHEN** `migrate()` is called twice in succession on the same client
- **THEN** the second call resolves without throwing and the registered TypeDefinition / RelationshipDef set is unchanged

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

The package's `README.md` and `AGENTS.md` SHALL identify `integration/memory` as the recommended test double for any package that depends on `DnaDataStore`. Tests in the dna-codes monorepo MUST use it (rather than mocking the interface) wherever a `DnaDataStore` is required.

#### Scenario: README documents the test-double role

- **WHEN** `packages/adapters/src/integration/memory/README.md` is read
- **THEN** it states that this adapter is the recommended test double for any consumer of `DnaDataStore` and gives a minimal example
