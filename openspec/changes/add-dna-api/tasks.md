## 1. Package scaffold

- [x] 1.1 Create `packages/api/` with `package.json` declaring `@dna-codes/dna-api@0.1.0`, runtime deps `@apollo/server`, `graphql`, `express`, `cors`, `body-parser`, `@dna-codes/dna-core`, `@dna-codes/dna-adapters`, and devDeps matching workspace pattern (`@types/*`, `jest`, `ts-jest`, `typescript`)
- [x] 1.2 Add `packages/api/tsconfig.json` mirroring the adapters package (target ES2020, module commonjs, strict, declaration, outDir `./dist`, rootDir `./src`)
- [x] 1.3 Add `packages/api/jest.config.js` (or jest config in `package.json`) using `ts-jest` and the same `testPathIgnorePatterns` as the adapters package
- [x] 1.4 Add the `packages/api/bin/dna-api.js` shim — minimal executable that calls `runCli(process.argv.slice(2), process.env)` and `process.exit(code)`
- [x] 1.5 Add `packages/api` to the root `package.json#workspaces` array
- [x] 1.6 Run `npm install` to link the new workspace and install Apollo + graphql + express (will require sandbox-disabled execution — flag this in implementation notes)

## 2. Schema codegen — DNA noun → GraphQL type

- [x] 2.1 Create `packages/api/src/schema/types.ts` exporting `buildResourceTypes(dna): { typeDefs: GraphQLObjectType[], enumDefs: GraphQLEnumType[], inputDefs: GraphQLInputObjectType[], registry: Map<string, GraphQLObjectType> }`
- [x] 2.2 Implement the attribute-type mapping table per design.md D1 (`string`/`text` → `String`, `number` → `Float`, `boolean` → `Boolean`, `date`/`datetime` → `String`, `enum` → per-attribute `GraphQLEnumType`, `reference` → resolved later in §3)
- [x] 2.3 Map `required: true` to GraphQL non-null wrappers (`GraphQLNonNull`)
- [x] 2.4 Implement snake_case → camelCase field-name conversion
- [x] 2.5 Implement enum-value conversion: DNA `pending` → GraphQL `PENDING` (UPPER_SNAKE_CASE); the generated enum type's name is `<TypeName><AttributeName>` (e.g. `LoanStatus`)
- [x] 2.6 Walk all four noun-primitive collections: `dna.domain.resources/persons/roles/groups`. Each entry yields one type
- [x] 2.7 Every generated type includes `id: GraphQLID!` plus its attribute fields
- [x] 2.8 Generate matching `<Type>Input` input types for CRUD mutations (strip `id`; reuse the same scalar/enum mappings)
- [x] 2.9 Unit tests: per primitive kind, assert the right type+input+enum is emitted; assert required→non-null; assert snake_case→camelCase; assert reserved enum names don't collide

## 3. Schema codegen — Relationships and reference attributes

- [x] 3.1 Create `packages/api/src/schema/relationships.ts` exporting `addRelationshipFields(typeRegistry, dna)` which mutates the registry's object types to add expansion fields
- [x] 3.2 For each entry in `dna.relationships[]`, look up the `from` and `to` types in the registry, derive the field name (strip trailing `_id` from `relationship.attribute`, then camelCase), and choose single-vs-list based on cardinality (D2)
- [x] 3.3 Reference attributes (`attribute.type === 'reference'`) remain as scalar `ID` fields on the type from §2 — they are NOT removed
- [x] 3.4 Resources with a reference attribute but no matching `Relationship` get only the scalar FK (no expansion)
- [x] 3.5 Unit tests: many-to-one/one-to-one → single-valued field; one-to-many/many-to-many → list-valued field; resources without a Relationship omit the expansion field

## 4. Schema codegen — CRUD queries + mutations

- [x] 4.1 Create `packages/api/src/schema/crud.ts` exporting `buildCrudFields(typeRegistry, dna)` returning `{ queries: Record<string, GraphQLFieldConfig>, mutations: Record<string, GraphQLFieldConfig> }`
- [x] 4.2 For each noun primitive type, register: `<type>(id: ID!): <Type>`, `<type>s: [<Type>!]!`, `create<Type>(input: <Type>Input!): <Type>!`, `update<Type>(id: ID!, input: <Type>Input!): <Type>!`, `delete<Type>(id: ID!): Boolean!`
- [x] 4.3 Naive pluralization with an exceptions map (`person → persons` overrides the naïve `peoples`)
- [x] 4.4 Resolver factories return functions that close over an injected `DnaDataStore` (no store imports in this file)
- [x] 4.5 Unit tests: per Resource, assert the five CRUD fields exist with the right types; assert pluralization exceptions; assert the input type strips `id`

## 5. Schema codegen — Operation mutations

- [x] 5.1 Create `packages/api/src/schema/operations.ts` exporting `buildOperationMutations(typeRegistry, dna)`
- [x] 5.2 For each entry in `dna.operations[]`, derive a mutation name (camelCase of `<target><Action>`, e.g. `Loan.Apply` → `loanApply`)
- [x] 5.3 Mutation signature: `(id: ID!, input: <Target>Input!): <Target>!`. Resolver delegates to `store.instance.update(target, id, input)` then re-reads via `store.instance.get(target, id)` (v1 behavior; Operation `changes[]` are NOT yet applied)
- [x] 5.4 When an Operation mutation name collides with a CRUD mutation name, the Operation wins and the CRUD mutation is omitted (D3)
- [x] 5.5 Unit tests: per Operation, assert the mutation exists with the right name and signature; assert resolver routes through `instance.update`+`instance.get`; assert a collision drops the CRUD mutation

## 6. Schema composition

- [x] 6.1 Create `packages/api/src/schema/index.ts` exporting `buildSchema({ dna, dataStore }): GraphQLSchema`
- [x] 6.2 Compose: §2 types + enums + inputs, §3 relationship fields (mutates types), §4 CRUD fields, §5 Operation mutations (filters CRUD collisions)
- [x] 6.3 The factory threads `dataStore` into every resolver via a closure (no module-level singletons)
- [x] 6.4 Validate the DNA via `DnaValidator` from `@dna-codes/dna-core` and throw a clear error before composing the schema (per D10)
- [x] 6.5 Smoke test: build a schema from `examples/lending/operational.json`, introspect it, assert the expected types/queries/mutations are present

## 7. Resolvers

- [x] 7.1 Create `packages/api/src/resolvers/instance.ts` with factory functions for the five CRUD resolvers (`makeGetResolver`, `makeListResolver`, `makeCreateResolver`, `makeUpdateResolver`, `makeDeleteResolver`), each taking `({ dataStore, typeName })` and returning a GraphQL resolve function
- [x] 7.2 Create `packages/api/src/resolvers/relationships.ts` with `makeRelationshipResolver({ dataStore, fromType, relationshipName, cardinality })` returning a resolver that calls `store.link.list({ from: { typeName, id: parent.id }, role: relationshipName })` and, for single-cardinality, returns the first match's `to.id`-resolved Instance
- [x] 7.3 Create `packages/api/src/resolvers/operations.ts` with `makeOperationResolver({ dataStore, targetType })` returning the v1 update-and-re-read behavior
- [x] 7.4 Unit tests against `integration/memory`: every resolver path executes the expected store calls; relationship resolvers resolve to the right Instance; collisions and missing records return `null`/`false` as appropriate

## 8. Server factory

- [x] 8.1 Create `packages/api/src/server.ts` exporting `createServer({ dna, dataStore }): Promise<{ schema, expressApp, listen(port): Promise<void> }>`
- [x] 8.2 Validate DNA → build schema → call `dataStore.migrate()` (D10 sequencing)
- [x] 8.3 Wire Apollo Server v4 + Express + CORS + body-parser per the Apollo v4 HTTP integration pattern
- [x] 8.4 Mount `GET /healthz` returning HTTP 200 OK
- [x] 8.5 `listen(port)` resolves once the HTTP server is bound
- [x] 8.6 Tests: server boots against `integration/memory`; healthz responds 200; introspection query against the running server returns the expected schema; a full create+read+delete cycle via HTTP succeeds for a lending example

## 9. CLI

- [x] 9.1 Create `packages/api/src/cli.ts` exporting `runCli(argv, env): Promise<number>` mirroring the parseArgs convention used by `integration/neo4j/cli.ts`
- [x] 9.2 `serve` command resolves the DNA source per D4 (`--dna` flag wins, then `DNA_FILE` env, else error)
- [x] 9.3 Resolve Neo4j credentials from `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` (plus optional `NEO4J_DATABASE`); error fast if any required var is missing
- [x] 9.4 Resolve port from `--port` flag, then `PORT` env, default `4000`
- [x] 9.5 Instantiate `integration/neo4j.createClient(neo4jOpts, dna)`, pass it to `createServer`, call `listen(port)`
- [x] 9.6 `help` / `--help` prints usage referencing all flags and env vars
- [x] 9.7 Tests: help command exits 0; missing DNA source exits non-zero with a message naming both `--dna` and `DNA_FILE`; missing Neo4j creds exit non-zero with a message naming `NEO4J_URI`

## 10. Package index + binary

- [x] 10.1 Create `packages/api/src/index.ts` exporting `createServer`, `runCli`, and any types consumers may want (`ServerOptions`, etc.)
- [x] 10.2 Verify `bin/dna-api.js` correctly invokes `runCli` (`#!/usr/bin/env node` shebang, exit-code passthrough)
- [x] 10.3 Smoke build: `npm run build --workspace @dna-codes/dna-api` succeeds; `node packages/api/bin/dna-api.js help` prints usage

## 11. Docker — single-org

- [x] 11.1 Create `packages/api/Dockerfile`:
  - [x] 11.1a Stage 1 (`deps`): copy package.json, package-lock.json; `npm ci`
  - [x] 11.1b Stage 2 (`build`): copy source, run `tsc --build` for the workspace dependency graph (or build the API package directly)
  - [x] 11.1c Stage 3 (`runtime`): `node:20-alpine` base, copy `node_modules` + `dist` + `bin`, EXPOSE 4000, CMD invokes `bin/dna-api.js serve`
- [x] 11.2 Add a `.dockerignore` covering `node_modules`, `dist`, test files, `.git`
- [x] 11.3 Create `packages/api/docker-compose.yml`:
  - [x] 11.3a `neo4j` service with the official image, ports `7474:7474` + `7687:7687`, env `NEO4J_AUTH=neo4j/devpassword`
  - [x] 11.3b `api` service built from `./Dockerfile`, ports `4000:4000`, env wires `NEO4J_URI=bolt://neo4j:7687`, `NEO4J_USERNAME=neo4j`, `NEO4J_PASSWORD=devpassword`, `DNA_FILE=/app/dna.json`
  - [x] 11.3c Volume mount: `./dna.json:/app/dna.json` (caller provides the file)
  - [x] 11.3d `depends_on: { neo4j: { condition: service_started } }` on the api service
- [ ] 11.4 Smoke test: `docker compose up`, then `curl http://localhost:4000/healthz` returns 200 and a GraphQL introspection query succeeds (DEFERRED — requires user to run; compose config validates cleanly)

## 12. Docker — multi-example-org

- [x] 12.1 Create `packages/api/docker-compose.examples.yml` defining three full stacks:
  - [x] 12.1a `neo4j-lending` (HTTP 7475, Bolt 7688) + `api-lending` (port 4001, mounts `examples/lending/operational.json`)
  - [x] 12.1b `neo4j-registry` (HTTP 7476, Bolt 7689) + `api-registry` (port 4002, mounts `examples/registry/operational.json`)
  - [x] 12.1c `neo4j-mass-tort` (HTTP 7477, Bolt 7690) + `api-mass-tort` (port 4003, mounts `examples/mass-tort/operational.json`)
- [x] 12.2 Each api-* service wires `NEO4J_URI=bolt://neo4j-<org>:7687` (internal compose-network port), unique credentials per stack
- [ ] 12.3 Smoke test: `docker compose -f packages/api/docker-compose.examples.yml up`; query each org's GraphQL endpoint at its assigned port and verify the schema reflects that DNA (DEFERRED — requires user to run; six services confirmed via `docker compose config`)

## 13. Documentation

- [x] 13.1 Write `packages/api/README.md`:
  - [x] 13.1a Two Quick-start sections: single-org `docker-compose.yml` and multi-example-org `docker-compose.examples.yml` (with the port table)
  - [x] 13.1b Architecture overview — schema codegen by concern, store injection, resolver flow
  - [x] 13.1c v1 limitations: read-only relationships; no Rule enforcement; no auth; no subscriptions; no hot-reload
  - [x] 13.1d Production hardening (TLS, secrets, observability) explicitly stated as out of scope
  - [x] 13.1e Sample GraphQL queries against the lending example
- [x] 13.2 Write `packages/api/AGENTS.md`:
  - [x] 13.2a "DNA in, API out" framing + the codegen-by-concern module layout
  - [x] 13.2b The "no backend imports" rule — every store access goes through `DnaDataStore`
  - [x] 13.2c What changes need to propagate where (interface in dna-core, store contracts, schema codegen, resolvers)
  - [x] 13.2d Test discipline — use `integration/memory`; live Neo4j integration tests are out of scope here (they live in the adapter)
- [x] 13.3 Update root `README.md`: add `@dna-codes/dna-api` row to the Packages section noting it as the first transport wrapper
- [x] 13.4 Update root `package.json#workspaces` to include `packages/api` (covered in §1.5; confirm here)

## 14. Release

- [x] 14.1 Bump `@dna-codes/dna-api` to `0.1.0` (initial public release of the new package; no prior version)
- [x] 14.2 Confirm `@dna-codes/dna-core` and `@dna-codes/dna-adapters` do NOT require bumps (this proposal is purely additive on top of `add-integration-neo4j-data`)
- [ ] 14.3 Pause before tagging — confirm with user that release is wanted
- [ ] 14.4 Tag and push (triggers publish workflow)
- [ ] 14.5 Smoke test: install `@dna-codes/dna-api` in a scratch project; run the CLI against a fixture DNA + `integration/memory`; confirm a GraphQL introspection query succeeds
