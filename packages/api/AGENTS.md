# AGENTS.md — `@dna-codes/dna-api`

Guidance for AI agents extending the DNA-derived GraphQL API server.

## What this package is

"DNA in, API out." The package takes an `OperationalDNA` at startup,
generates a GraphQL schema from it, and serves resolvers backed by a
`DnaDataStore` (the contract from `@dna-codes/dna-core`).

It is the first transport wrapper sitting on top of the runtime-data
store contract. The package does NOT own the data layer — that lives in
[`@dna-codes/dna-adapters/integration/neo4j`](../adapters/src/integration/neo4j).
The package's job is **codegen + transport**, nothing else.

## Module layout — one responsibility per file

```
src/schema/
  types.ts          DNA noun primitive → GraphQL type + input + per-attribute enums
  relationships.ts  DNA Relationship → expansion field on the `from` type
  crud.ts           Type-generic CRUD queries + mutations
  operations.ts     DNA Operation → domain-specific mutation
  naming.ts         Casing helpers (snake_case → camelCase, enum casing, pluralization)
  index.ts          Composes the four above + DNA validation + resolver wiring
src/resolvers/
  instance.ts       Get / list / create / update / delete (close over DnaDataStore)
  relationships.ts  Link-list-then-instance-get
  operations.ts     v1 update-and-re-read
src/server.ts       Apollo Server v5 + Express + /healthz
src/cli.ts          `serve` command; env-driven creds; signal handlers
src/index.ts        Package surface — createServer, runCli, buildSchema
```

When you change codegen behavior, the change usually touches one file in
`src/schema/` plus matching resolver behavior in `src/resolvers/`. The
composer (`src/schema/index.ts`) is rarely the right place to edit —
it's just glue.

## Hard rules

- **No backend imports.** This package MUST NOT import `neo4j-driver` or
  any other DB client directly. Every read or write goes through the
  injected `DnaDataStore`. The CLI is the only file that imports
  `@dna-codes/dna-adapters/integration/neo4j`.
- **Codegen modules stay pure** (no I/O, no `process.env`, no
  filesystem). They take a DNA + a resolver factory and return GraphQL
  type configs. The composer wires the dependencies.
- **Resolver factories accept `{ dataStore, typeName }` (or similar)
  and return a `GraphQLFieldResolver`.** This keeps the schema codegen
  testable without a real store and lets the schema composer be the only
  thing that knows about the store.
- **Validation runs at DNA-load time, not per request.** `DnaValidator`
  is invoked in `buildSchema` once. Resolvers do NOT validate request
  payloads against per-Resource attribute schemas — that responsibility
  belongs to a Rule-enforcement layer (deferred).
- **Tests use `@dna-codes/dna-adapters/integration/memory`.** Live
  Neo4j integration tests live in the adapter, not here.

## What changes propagate where

When you add a new DNA primitive or attribute type:

| Change | Update |
|---|---|
| New `AttributeType` value | `src/schema/types.ts` (mapping) + `src/schema/dna-shapes.ts` |
| New `Relationship.cardinality` value | `src/schema/relationships.ts` (single-vs-list logic) |
| New base-contract field | `src/schema/types.ts` (skip / surface decision) |
| New Operation semantics (e.g. apply `changes[]` server-side) | `src/resolvers/operations.ts` + Rule-enforcement proposal |
| New CRUD method (e.g. `findBy<Attribute>`) | `src/schema/crud.ts` + `src/resolvers/instance.ts` |

Renames in `@dna-codes/dna-core`'s types (Resource, Operation, etc.)
need a matching pass through `src/schema/types.ts` and the resolver
files.

## Test discipline

- Unit tests live next to source files (`*.test.ts`).
- Schema codegen tests use synthetic DNAs and assert structure; the
  composition smoke test (`src/schema/index.test.ts`) runs against
  `examples/lending`.
- Server tests use `supertest` against the Express app (no actual port
  binding required — supertest spins up the server on an ephemeral
  port per request).
- CLI tests assert exit codes and error messages; they MUST NOT try to
  bind to a real port or call out to Neo4j.

## Where to push back

A few things you might be tempted to add that belong **elsewhere**:

- **Custom GraphQL scalars** (`DateTime`, `JSON`) — deferred to v2. Adds
  noise without solving a current problem; ISO strings work today.
- **Subscriptions / federation / Apollo Studio** — separate proposals.
- **Multi-tenancy via per-request DNA dispatch** — fundamentally changes
  the schema-build contract; would be a major redesign.
- **DataLoader batching** — wait until a benchmark says it matters. The
  resolver shape is amenable to adding it later without rewrites.
- **Rule enforcement / auth** — bundled into a single follow-on. Not
  here. Even if you have a one-line `if (!user) throw` itch.

## Releasing

Bump the patch version in `packages/api/package.json` when fixing bugs
or shipping small additive features. Bump the minor when adding a new
DNA construct's codegen path. The package is on a 0.x line — breaking
changes are still acceptable until 1.0.
