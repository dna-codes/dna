## ADDED Requirements

### Requirement: Fixed top-level CRUD for `ResourceType` and `RelationshipType`

The GraphQL schema SHALL always include CRUD queries and mutations for `ResourceType` and `RelationshipType` records regardless of tenant state. These are the registry-native admin surface and remain stable across schema regenerations.

#### Scenario: Schema exposes ResourceType CRUD

- **WHEN** the GraphQL schema is introspected
- **THEN** it includes `Query.resourceType(id: ID!): ResourceType`, `Query.resourceTypes(category: NounCategory): [ResourceType!]!`, `Mutation.createResourceType(input: ResourceTypeInput!): ResourceType!`, `Mutation.updateResourceType(id: ID!, input: ResourceTypeInput!): ResourceType!`, and `Mutation.deleteResourceType(id: ID!, cascade: Boolean): Boolean!`

#### Scenario: Schema exposes RelationshipType CRUD

- **WHEN** the GraphQL schema is introspected
- **THEN** it includes the same query+mutation surface for `RelationshipType` records

#### Scenario: Read-only access to version history

- **WHEN** a `ResourceType` record exists with two or more versions
- **THEN** `query { resourceType(id) { versions { version attributeSchema createdAt } } }` returns the history in descending version order, AND a top-level `resourceTypeVersion(id: ID!)` query returns a single version by id

### Requirement: Schema hot-reload triggered by type mutations

After every successful `createResourceType` / `updateResourceType` / `deleteResourceType` / `createRelationshipType` / `updateRelationshipType` / `deleteRelationshipType` mutation, the in-process `SchemaManager` SHALL rebuild the GraphQL schema and atomically swap it before subsequent requests are accepted. In-flight requests SHALL complete against the schema they started under.

#### Scenario: Sequential mutations expose new types in order

- **WHEN** `createResourceType(name: "Loan")` succeeds, then `createResourceType(name: "Borrower")` succeeds
- **THEN** a third request introspecting the schema sees both `Loan` and `Borrower` GraphQL types

#### Scenario: A failed mutation does not rebuild the schema

- **WHEN** `createResourceType` is invoked with an invalid input that fails validation
- **THEN** the schema is unchanged on next introspection (no `SchemaManager.rebuild()` was triggered)

### Requirement: First-boot DNA seeding via `seedFromDna`

The CLI's `serve` command SHALL load the DNA file, check `dataStore.hasBeenSeeded()`, and call `dataStore.seedFromDna(dna)` if and only if no prior seed marker exists. The seed call SHALL be idempotent on type `name` (existing types are not overwritten). The DNA file is required at startup for the seed path but is no longer load-bearing after first boot.

#### Scenario: First boot seeds from DNA

- **WHEN** the CLI is invoked against a fresh data store with `--dna ./lending.json`
- **THEN** `seedFromDna` is called and the resulting `ResourceType` records include the four foundational records (`Person`, `Role`, `Group`, `Resource`) plus one per entry in `dna.domain.{persons,roles,groups,resources}` plus `RelationshipType` records for each `dna.relationships[]` entry, and a seed marker is written

#### Scenario: Subsequent boots skip seeding

- **WHEN** the CLI is restarted against a data store that already has the seed marker
- **THEN** `seedFromDna` is NOT called and the existing `ResourceType` set is preserved unchanged

#### Scenario: DNA drift warning on subsequent boot

- **WHEN** the DNA file content has changed since the seed marker was written
- **THEN** the CLI logs a warning naming the drift but starts normally

### Requirement: Seeded types carry `is_seed: true` and warn on delete

Records created via `seedFromDna` SHALL be marked with `is_seed: true`. The `deleteResourceType` and `deleteRelationshipType` mutations SHALL refuse a seed-type delete without an explicit `cascade: true` flag, surfacing an error that names the seed status.

#### Scenario: Deleting a seed type without cascade errors

- **WHEN** `deleteResourceType(id: <seeded Person>)` is invoked without `cascade: true`
- **THEN** the mutation returns an error stating that the type is a seed type and requires `cascade: true`

#### Scenario: Cascade deletes a seed type and its instances

- **WHEN** the same delete is invoked with `cascade: true`
- **THEN** all matching `:Resource` instances are deleted, the type and its versions are removed, and the mutation returns `true`

### Requirement: `Resource` and `Relationship` records expose `_schemaVersion`

Every `Resource` GraphQL type SHALL include a non-null `_schemaVersion: Int!` field returning the version stamped at the record's last write. The same applies to `Relationship` types when relationship payloads gain version stamping.

#### Scenario: Read returns the version stamp

- **WHEN** `{ loan(id: "x") { _schemaVersion } }` is executed against a record stamped at version 3
- **THEN** the response carries `_schemaVersion: 3`

## MODIFIED Requirements

### Requirement: Package exists at `packages/api/` as `@dna-codes/dna-api`

A TypeScript package SHALL live at `packages/api/` in the monorepo, published as `@dna-codes/dna-api` (version `0.2.0` or later after this change). It SHALL declare `@dna-codes/dna-core` and `@dna-codes/dna-adapters` as runtime dependencies, `@apollo/server`, `graphql`, `express`, `cors`, `body-parser`, and `@as-integrations/express4` as the GraphQL server runtime, and `ajv` plus `ajv-formats` for per-Resource data validation. It SHALL build with `tsc` and test with Jest, matching the existing workspace pattern.

#### Scenario: Package builds successfully

- **WHEN** `npm run build --workspace @dna-codes/dna-api` is invoked
- **THEN** TypeScript emits artifacts to `packages/api/dist/` without errors

#### Scenario: Package is wired into the root workspace

- **WHEN** the root `package.json` is read
- **THEN** the `workspaces` array includes `packages/api`

#### Scenario: ajv is declared as a runtime dependency

- **WHEN** `packages/api/package.json` is read
- **THEN** `ajv` and `ajv-formats` appear in the `dependencies` map

### Requirement: Server factory bootstraps the registry-native schema from the data store

The package SHALL export an async `createServer({ dna, dataStore })` factory that, given an `OperationalDNA` (used for first-boot seeding only) and an instantiated `DnaDataStore`, performs: (1) `dataStore.migrate()` to create constraints/indexes; (2) `dataStore.hasBeenSeeded()` check, calling `dataStore.seedFromDna(dna)` if false; (3) instantiate a `SchemaManager` against the data store and call `schemaManager.rebuild()` for the initial schema; (4) construct Apollo Server v5 wired to the SchemaManager and an Express app with `/graphql` and `/healthz` mounted; (5) return `{ schema, apolloServer, expressApp, listen(port): Promise<{ close(): Promise<void> }> }`.

#### Scenario: First boot seeds then serves

- **WHEN** `createServer({ dna, dataStore })` is called against a fresh data store
- **THEN** `dataStore.migrate()` is invoked, then `dataStore.hasBeenSeeded()` returns false, then `dataStore.seedFromDna(dna)` is invoked, then a schema is built reflecting the seeded types

#### Scenario: Subsequent boots skip seeding

- **WHEN** `createServer({ dna, dataStore })` is called against a data store whose `hasBeenSeeded()` returns true
- **THEN** `dataStore.seedFromDna(dna)` is NOT invoked and the schema is built from the current data store state

#### Scenario: Returned shape

- **WHEN** `createServer({ dna, dataStore })` resolves
- **THEN** the result includes `schema`, `apolloServer`, `expressApp`, and a `listen(port)` function whose returned handle exposes `close()`

### Requirement: GraphQL types are derived from `ResourceType` records at schema-build time

For every `ResourceType` record returned by `dataStore.resourceType.list()`, the schema SHALL include a corresponding GraphQL `type` with first-class fields derived from its current `attribute_schema`. The codegen mapping table carries forward: `string`/`text` → `String`, `number` → `Float`, `boolean` → `Boolean`, `date`/`datetime` → `String`, `enum` → per-attribute `enum`, `reference` → `ID`. Every type carries `id: ID!` and `_schemaVersion: Int!`. snake_case attribute names become camelCase GraphQL fields. `required: true` produces non-null wrappers.

#### Scenario: New ResourceType produces a typed GraphQL type

- **WHEN** `createResourceType` is invoked with `{ name: "Loan", category: RESOURCE, attribute_schema: [...] }` and the schema is re-introspected after the mutation
- **THEN** the schema includes `type Loan { id: ID! _schemaVersion: Int! ... }` with one field per declared attribute, plus `LoanInput`, `Query.loan(id)`, `Query.loans`, `Mutation.createLoan/updateLoan/deleteLoan`

#### Scenario: snake_case attribute names become camelCase fields

- **WHEN** a `ResourceType` declares an attribute named `borrower_id`
- **THEN** the generated GraphQL field is named `borrowerId`

#### Scenario: required attributes produce non-null fields

- **WHEN** an attribute is declared with `required: true`
- **THEN** the generated GraphQL field type is non-null (suffixed with `!`)

#### Scenario: Updating a ResourceType regenerates its GraphQL type

- **WHEN** `updateResourceType(id, { attribute_schema: [...new attributes] })` succeeds
- **THEN** subsequent introspection reflects the new fields and removes the dropped fields

#### Scenario: Deleting a ResourceType removes its GraphQL type

- **WHEN** `deleteResourceType(id, cascade: true)` succeeds
- **THEN** the GraphQL `type` and its CRUD surface are absent from subsequent introspection

### Requirement: Per-`ResourceType` generic CRUD queries and mutations

For every `ResourceType` in the data store, the generated schema SHALL register: a single-record query (`<type>(id: ID!): <Type>`), a list query (`<type>s: [<Type>!]!`), a create mutation (`create<Type>(input: <Type>Input!): <Type>!`), an update mutation (`update<Type>(id: ID!, input: <Type>Input!): <Type>!`), and a delete mutation (`delete<Type>(id: ID!): Boolean!`). Resolvers SHALL route through the injected `DnaDataStore`.

#### Scenario: Single query resolves through store.instance.get

- **WHEN** the GraphQL query `{ loan(id: "x") { amount } }` is executed against a server whose store has a `Loan` instance with `id: "x"` and `amount: 1000`
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

### Requirement: `RelationshipType` records produce expansion fields with cardinality semantics

For every `RelationshipType` returned by `dataStore.relationshipType.list()`, the codegen SHALL register a field on the `from` ResourceType's GraphQL type pointing at the `to` ResourceType's GraphQL type. The field name is derived from the `attribute` property (stripped of `_id` suffix, camelCased). Cardinality drives single-vs-list: `one-to-one`/`many-to-one` produce a single nullable field; `one-to-many`/`many-to-many` produce a nullable list of non-null elements. The resolver SHALL call `store.link.list({ from: { typeName, id }, role: <relationshipTypeName> })`.

#### Scenario: many-to-one RelationshipType produces a single-valued field

- **WHEN** a `RelationshipType { name: "Loan.borrower", from: "Loan", to: "Borrower", cardinality: "many-to-one", attribute: "borrower_id" }` exists
- **THEN** the generated `type Loan` includes `borrower: Borrower` and querying `{ loan(id) { borrower { id } } }` calls `store.link.list({ from: { typeName: "Loan", id }, role: "Loan.borrower" })`

#### Scenario: one-to-many RelationshipType produces a list-valued field

- **WHEN** a `RelationshipType` has `cardinality: "one-to-many"`
- **THEN** the generated field type is `[<Target>!]` (nullable outer, non-null inner)

#### Scenario: ResourceTypes without a matching RelationshipType omit the expansion field

- **WHEN** a `ResourceType` has a `reference` attribute (`borrower_id`) but no matching `RelationshipType` exists in the store
- **THEN** the generated `type` includes `borrowerId: ID` (the scalar FK) but does NOT include a `borrower: Borrower` expansion field

### Requirement: Validation contract — `ajv`-based per-`Resource.data` validation against `ResourceType.attribute_schema`

`createResource`-style and `update<Type>` mutations SHALL validate the input payload against the relevant `ResourceType.attribute_schema` at its `current_version` via `ajv`. Validation failures SHALL surface as GraphQL field errors with the failing JSON path. Records that pass validation SHALL be stamped with `_schemaVersion = current_version` at write time. `createServer` SHALL still validate the seed DNA via `DnaValidator` at first boot; per-request validation moves to ajv against ResourceType schemas.

#### Scenario: Valid input creates a Resource with the current version stamp

- **WHEN** a `Loan` `ResourceType` exists at `current_version = 3` and `createLoan(input: {...valid...})` is invoked
- **THEN** the created record carries `_schemaVersion: 3`

#### Scenario: Invalid input is rejected with a clear error

- **WHEN** `createLoan(input: {...missing required attribute...})` is invoked
- **THEN** the mutation returns a GraphQL error referencing the missing attribute by JSON path and no record is written

#### Scenario: Updates re-stamp to the current version

- **WHEN** a Resource exists at `_schemaVersion: 2` and the live `ResourceType` is now at `current_version: 5`, and `updateLoan(id, input: {...valid against v5...})` succeeds
- **THEN** the resulting record carries `_schemaVersion: 5`

#### Scenario: Reads return the stamped version unchanged

- **WHEN** a Resource was created at `_schemaVersion: 2` and the live `ResourceType` is now at `current_version: 5`
- **THEN** `query { loan(id) { _schemaVersion } }` returns `2`

### Requirement: CLI entrypoint serves the API from env + flags

The package SHALL ship a CLI at `bin/dna-api` invoking a `runCli(argv, env)` function in `src/cli.ts`. The `serve` command SHALL accept `--dna <path>` (overriding `DNA_FILE`) and `--port <port>` (overriding `PORT`, default `4000`), load Neo4j credentials from `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` env vars (plus optional `NEO4J_DATABASE`), and start the server. The `--dna` flag (or `DNA_FILE` env) is required at every startup — first boot uses it for seeding; subsequent boots use its hash to compute the drift-warning. Missing required env vars or DNA source SHALL produce a non-zero exit with a clear message.

#### Scenario: Help command prints usage

- **WHEN** `runCli(['help'], {})` is invoked
- **THEN** the result is exit code `0` and the printed text references the `serve` command, the `--dna` and `--port` flags, and the Neo4j env vars

#### Scenario: Missing DNA source exits non-zero

- **WHEN** `runCli(['serve'], {})` is invoked with neither `--dna` nor `DNA_FILE` set
- **THEN** the exit code is non-zero and the error message references both `--dna` and `DNA_FILE`

#### Scenario: Missing Neo4j credentials exit non-zero

- **WHEN** `runCli(['serve', '--dna', './dna.json'], {})` is invoked with `NEO4J_URI` unset
- **THEN** the exit code is non-zero and the error message references `NEO4J_URI`

## REMOVED Requirements

### Requirement: DNA Operations become mutations that supplement CRUD

**Reason**: DNA `Operation` primitives were domain verbs paired with the frozen-type model in `add-dna-api`. The registry-native model has no equivalent slot — Operations would require state-machine semantics tied to Rule enforcement (deferred), and their per-`Operation` codegen would conflict with the runtime-mutable `ResourceType` system. Dropping the codegen module entirely is cleaner than keeping a half-finished surface.

**Migration**: Tenants who relied on DNA-declared Operations (e.g. `loanApply`) should issue the equivalent CRUD mutation against the corresponding `ResourceType` (`updateLoan(id, input)`). Operation semantics may return in a future proposal as a fifth top-level type (`OperationType`); when that lands, existing `update<Type>` calls will continue to work.
