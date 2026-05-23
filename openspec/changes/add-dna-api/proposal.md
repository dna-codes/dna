## Why

The `DnaDataStore` contract just landed (in `add-integration-neo4j-data`) makes it possible to persist the data described by an `OperationalDNA` — but no consumer of that contract exists yet. Every transport wrapper in the design (`dna-mcp`, `dna-api`, `dna-cli`) is still vapor. This proposal lands the first one: a deployable GraphQL API server.

The pitch is "DNA in, API out." An organization writes its `OperationalDNA` (its Resources, Persons, Roles, Relationships, Operations). `@dna-codes/dna-api` reads that DNA at startup, generates a GraphQL schema from it, wires resolvers through `@dna-codes/dna-adapters/integration/neo4j`, and serves the API. No hand-written schema, no hand-written resolvers, no bespoke Cypher. The DNA *is* the API spec.

Per-org deployable shape: each org runs its own API process (loaded with its DNA), against its own Neo4j (storing its data). Docker for local dev today; production hardening deferred. A `docker-compose.examples.yml` spins up two or three example-org stacks (lending, registry, mass-tort) so the per-org pattern is visible and reproducible without a real customer.

## What Changes

- **NEW** `@dna-codes/dna-api` at `packages/api/`. TypeScript. Builds with `tsc`, tests with Jest, matches the existing workspace pattern.
- **NEW** Startup pipeline that loads an `OperationalDNA` from a file path (env var `DNA_FILE`, or `--dna` flag on the CLI), generates a GraphQL schema, instantiates a `DnaDataStore`, and serves Apollo Server over HTTP.
- **NEW** GraphQL schema codegen, decomposed by concern:
  - `schema/types.ts` — DNA noun primitive → GraphQL `type` (one `type` per `Resource`/`Person`/`Role`/`Group`; one `enum` per attribute whose `type === 'enum'`).
  - `schema/relationships.ts` — DNA `Relationship` → GraphQL field on the `from` type pointing at the `to` type (cardinality drives single-vs-list).
  - `schema/operations.ts` — DNA `Operation` → GraphQL mutation (`Loan.Apply` → `loanApply`).
  - `schema/crud.ts` — type-generic CRUD floor (`loan(id)`, `loans`, `createLoan`, `updateLoan`, `deleteLoan`).
  - `schema/index.ts` — composes the four into one `GraphQLSchema`.
- **NEW** Resolvers in `resolvers/` mirroring the schema modules, each calling the injected `DnaDataStore`. No raw Cypher in the API.
- **NEW** CLI entrypoint at `bin/dna-api.js` invoking a `runCli(argv, env)` function in `src/cli.ts`. Commands: `serve --dna <path> --port <port>` (the only command in v1).
- **NEW** Docker setup at `packages/api/`:
  - `Dockerfile` — multi-stage TypeScript build, final image runs the CLI.
  - `docker-compose.yml` — one Neo4j + one API service. Single-org local dev.
  - `docker-compose.examples.yml` — three full stacks (api + neo4j per org) for lending / registry / mass-tort.
- **NEW** Smoke test fixtures and an in-process Jest harness that wires the schema generator + `integration/memory` so the API's behavior can be tested without a database or HTTP server.
- **MODIFIED** root `package.json` workspaces array to include `packages/api`.
- **MODIFIED** root `README.md` to add `@dna-codes/dna-api` to the Packages section as the first transport wrapper.

## Capabilities

### New Capabilities

- `dna-api`: DNA-derived GraphQL API server. Loads an `OperationalDNA`, generates a GraphQL schema (types from noun primitives, enums from `attribute.type === 'enum'`, fields from `Relationship` entries, queries+mutations from CRUD + `Operation`), and routes every resolver through a `DnaDataStore`.
- `dna-api-docker`: Local-dev Docker assets — a Dockerfile, a single-org `docker-compose.yml`, and a multi-example-org `docker-compose.examples.yml` that spins up parallel stacks for lending / registry / mass-tort example DNAs.

### Modified Capabilities

<!-- None. This is purely additive. -->

## Impact

- **NEW package** `@dna-codes/dna-api`: minor 0.1.0. Runtime deps: `@apollo/server`, `graphql`, `express`, `@dna-codes/dna-core`, `@dna-codes/dna-adapters`. DevDeps: workspace-standard `@types/*` + jest / ts-jest / typescript.
- **`@dna-codes/dna-core`** and **`@dna-codes/dna-adapters`**: no changes required. The `DnaDataStore` contract from `add-integration-neo4j-data` is the load-bearing interface.
- **Root workspace**: `packages/api` added to `package.json#workspaces`; README updated.
- **Unblocks**: real consumers of the registry triad — an organization can author a DNA and get a working GraphQL API without writing schema or resolvers by hand.
- **Deferred to follow-on proposals**: Rule enforcement (`dna.rules[]`), auth, GraphQL subscriptions, multi-tenant-in-one-process, Apollo Federation, production-grade Docker (TLS, secrets), schema hot-reload on DNA file change, DataLoader batching, TypeScript client codegen, Postgres or other backends.
- **Reference**: `examples/registry/operational.json` for the storage shape underneath the API; `packages/adapters/src/integration/neo4j/` for the store contract.
