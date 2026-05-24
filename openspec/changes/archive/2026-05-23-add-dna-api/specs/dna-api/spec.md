## ADDED Requirements

### Requirement: Package exists at `packages/api/` as `@dna-codes/dna-api`

A new TypeScript package SHALL live at `packages/api/` in the monorepo, published as `@dna-codes/dna-api`. It SHALL declare `@dna-codes/dna-core` and `@dna-codes/dna-adapters` as runtime dependencies, and `@apollo/server`, `graphql`, and `express` as the GraphQL server runtime. It SHALL build with `tsc` and test with Jest, matching the existing workspace pattern.

#### Scenario: Package builds successfully

- **WHEN** `npm run build --workspace @dna-codes/dna-api` is invoked
- **THEN** TypeScript emits artifacts to `packages/api/dist/` without errors

#### Scenario: Package is wired into the root workspace

- **WHEN** the root `package.json` is read
- **THEN** the `workspaces` array includes `packages/api`

### Requirement: Server factory generates a GraphQL schema from the supplied DNA

The package SHALL export a `createServer({ dna, dataStore })` factory that, given an `OperationalDNA` and an instantiated `DnaDataStore`, validates the DNA via `DnaValidator`, generates a GraphQL schema from the DNA, calls `dataStore.migrate()`, and returns an object suitable for hosting over HTTP (`{ schema, expressApp, listen(port): Promise<void> }`).

#### Scenario: Invalid DNA fails fast

- **WHEN** `createServer({ dna, dataStore })` is called with a DNA that does not validate against the operational schema
- **THEN** the factory rejects with an error whose message names the validation failures

#### Scenario: Valid DNA produces a server

- **WHEN** `createServer({ dna, dataStore })` is called with a valid DNA and an in-memory `DnaDataStore`
- **THEN** the result includes a `GraphQLSchema`, an Express app, and a `listen(port)` function

#### Scenario: Server calls dataStore.migrate() at startup

- **WHEN** `createServer({ dna, dataStore })` is called
- **THEN** `dataStore.migrate()` is invoked before `listen()` returns

### Requirement: DNA noun primitives become GraphQL types

Each entry in `dna.domain.resources[]`, `dna.domain.persons[]`, `dna.domain.roles[]`, and `dna.domain.groups[]` SHALL produce one GraphQL `type` whose name equals the primitive's `name` (PascalCase, as-is). Each type SHALL include an `id: ID!` field and one field per declared `Attribute` (snake_case → camelCase). The DNA `AttributeType` enum maps to GraphQL types per the design table (D1).

#### Scenario: Resource becomes a GraphQL type with attribute fields

- **WHEN** a DNA declares `Resource { name: "Loan", attributes: [{ name: "amount", type: "number" }, { name: "status", type: "enum", values: ["pending","active"] }] }` and `createServer` is invoked
- **THEN** the generated schema includes `type Loan { id: ID! amount: Float status: LoanStatus }` (or non-null variants when `required: true`) and `enum LoanStatus { PENDING ACTIVE }`

#### Scenario: snake_case attribute names become camelCase fields

- **WHEN** a Resource declares an attribute named `borrower_id`
- **THEN** the generated GraphQL field is named `borrowerId`

#### Scenario: required attributes produce non-null fields

- **WHEN** an attribute is declared with `required: true`
- **THEN** the generated GraphQL field type is non-null (suffixed with `!`)

### Requirement: Per-Resource generic CRUD queries and mutations

For every Resource (and every other noun primitive — Person, Role, Group), the generated schema SHALL register: a single-record query (`<type>(id: ID!): <Type>`), a list query (`<type>s: [<Type>!]!`), a create mutation (`create<Type>(input: <Type>Input!): <Type>!`), an update mutation (`update<Type>(id: ID!, input: <Type>Input!): <Type>!`), and a delete mutation (`delete<Type>(id: ID!): Boolean!`). Resolvers SHALL route through the injected `DnaDataStore`.

#### Scenario: Single query resolves through store.instance.get

- **WHEN** the GraphQL query `{ loan(id: "x") { amount } }` is executed against a server whose store has a `Loan` Instance with `id: "x"` and `amount: 1000`
- **THEN** the response is `{ data: { loan: { amount: 1000 } } }` and `store.instance.get('Loan', 'x')` was called

#### Scenario: List query resolves through store.instance.list

- **WHEN** the GraphQL query `{ loans { id amount } }` is executed against a server whose store has three `Loan` Instances
- **THEN** the response contains three records with `id` and `amount` fields and `store.instance.list('Loan')` was called

#### Scenario: Create mutation calls store.instance.create then returns the new record

- **WHEN** the mutation `mutation { createLoan(input: { amount: 1000 }) { id amount } }` is executed
- **THEN** the response includes the new `id` and `amount: 1000`, `store.instance.create('Loan', { amount: 1000 })` was called, and `store.instance.get('Loan', <id>)` was called

#### Scenario: Update mutation calls store.instance.update

- **WHEN** the mutation `mutation { updateLoan(id: "x", input: { status: ACTIVE }) { status } }` is executed
- **THEN** `store.instance.update('Loan', 'x', { status: 'active' })` was called and the response includes the updated record

#### Scenario: Delete mutation calls store.instance.delete and returns true

- **WHEN** the mutation `mutation { deleteLoan(id: "x") }` is executed
- **THEN** `store.instance.delete('Loan', 'x')` was called and the response is `{ data: { deleteLoan: true } }`

### Requirement: DNA Relationships become expansion fields with cardinality semantics

For each `Relationship` declared in `dna.relationships[]`, the codegen SHALL register a field on the `from` Resource's GraphQL type pointing at the `to` Resource's GraphQL type. The field name is derived from the relationship (the `attribute` name stripped of any `_id` suffix, then camelCased). The cardinality drives single-vs-list: `one-to-one` and `many-to-one` produce a single nullable field; `one-to-many` and `many-to-many` produce a nullable list of non-null elements. The resolver SHALL call `store.link.list({ from: { typeName, id }, role: <relationshipName> })`.

#### Scenario: many-to-one relationship produces a single-valued field

- **WHEN** the DNA declares `Relationship { name: "Loan.borrower", from: "Loan", to: "Borrower", cardinality: "many-to-one", attribute: "borrower_id" }`
- **THEN** the generated `type Loan` includes `borrower: Borrower` and querying `{ loan(id) { borrower { id } } }` calls `store.link.list({ from: { typeName: "Loan", id }, role: "borrower" })`

#### Scenario: one-to-many relationship produces a list-valued field

- **WHEN** the DNA declares a relationship with `cardinality: "one-to-many"`
- **THEN** the generated field type is `[<Target>!]` (nullable outer, non-null inner)

#### Scenario: Resources without a declared Relationship omit the expansion field

- **WHEN** a Resource has a reference attribute (`borrower_id`) but no matching `Relationship` is declared in `dna.relationships[]`
- **THEN** the generated `type` includes `borrowerId: ID` (the scalar FK) but does NOT include a `borrower: Borrower` expansion field

### Requirement: DNA Operations become mutations that supplement CRUD

For each entry in `dna.operations[]`, the generated schema SHALL register a mutation whose name is the camelCase of `<target><Action>` (e.g. `Loan.Apply` → `loanApply`). The mutation accepts `(id: ID!, input: <Target>Input!)` and resolves through `store.instance.update(<target>, id, input)` in v1. When an Operation's generated name collides with a generic CRUD mutation, the Operation mutation SHALL be registered and the colliding CRUD mutation SHALL be omitted.

#### Scenario: Operation generates a domain-specific mutation

- **WHEN** the DNA declares `Operation { target: "Loan", action: "Apply", name: "Loan.Apply" }`
- **THEN** the schema includes `mutation { loanApply(id: ID!, input: LoanInput!): Loan! }`

#### Scenario: Operation calls store.instance.update on resolve

- **WHEN** `loanApply(id: "x", input: { status: PENDING })` is executed
- **THEN** `store.instance.update('Loan', 'x', { status: 'pending' })` was called and the response includes the updated Loan

#### Scenario: Operation-CRUD name collision resolves to the Operation

- **WHEN** the DNA declares an Operation whose generated mutation name matches a generic CRUD mutation (an unlikely but possible naming conflict for a non-Operation-style mutation)
- **THEN** the Operation mutation is registered and the colliding CRUD mutation is omitted from the schema

### Requirement: All resolvers route through `DnaDataStore`; no direct backend imports

The API package SHALL NOT import `neo4j-driver` or any other backend client directly. Every read or write of runtime data SHALL go through the `DnaDataStore` contract from `@dna-codes/dna-core`. The store is injected via `createServer({ dna, dataStore })`; tests inject `@dna-codes/dna-adapters/integration/memory` and production code injects `@dna-codes/dna-adapters/integration/neo4j`.

#### Scenario: Package source imports no backend driver directly

- **WHEN** the package's `src/` is searched for `import .* from ['\"]neo4j-driver['\"]`
- **THEN** no matches are found outside test fixtures

#### Scenario: Tests pass memory store and exercise the full schema

- **WHEN** the test suite constructs a server with `createServer({ dna, dataStore: memoryClient(dna) })` and runs CRUD + relationship queries
- **THEN** every test passes against the memory store with no Neo4j dependency

### Requirement: CLI entrypoint serves the API from env + flags

The package SHALL ship a CLI at `bin/dna-api` invoking a `runCli(argv, env)` function in `src/cli.ts`. The `serve` command SHALL accept `--dna <path>` (overriding `DNA_FILE`) and `--port <port>` (overriding `PORT`, default `4000`), load Neo4j credentials from `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` env vars, and start the server. Missing required env vars SHALL produce a non-zero exit with a clear message.

#### Scenario: Help command prints usage

- **WHEN** `runCli(['help'], {})` is invoked
- **THEN** the result is exit code `0` and the printed text references the `serve` command, the `--dna` and `--port` flags, and the Neo4j env vars

#### Scenario: Missing DNA source exits non-zero

- **WHEN** `runCli(['serve'], {})` is invoked with neither `--dna` nor `DNA_FILE` set
- **THEN** the exit code is non-zero and the error message references both `--dna` and `DNA_FILE`

#### Scenario: Missing Neo4j credentials exit non-zero

- **WHEN** `runCli(['serve', '--dna', './dna.json'], {})` is invoked with `NEO4J_URI` unset
- **THEN** the exit code is non-zero and the error message references `NEO4J_URI`

### Requirement: Health endpoint returns 200 OK

The server SHALL expose `GET /healthz` returning HTTP `200 OK` with no body content requirements. This endpoint is unauthenticated by design and is intended for container liveness probes.

#### Scenario: /healthz returns 200

- **WHEN** an HTTP GET is made to `/healthz` on a running server
- **THEN** the response status is `200`

### Requirement: Validation contract

`createServer` SHALL validate the DNA before generating the schema. Resolvers SHALL NOT validate Instance data against per-Resource attribute schemas — that responsibility belongs to the caller or a future Rule-enforcement layer. The CLI MAY layer additional validation on top of `createServer`.

#### Scenario: Resolvers do not call DnaValidator per request

- **WHEN** a `createLoan` mutation is executed
- **THEN** `store.instance.create` is invoked without an intervening per-request `DnaValidator.validate` call (validation happens at DNA-load time, not per request)
