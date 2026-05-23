## Context

`add-integration-neo4j-data` landed a `DnaDataStore` contract in `dna-core` plus two implementations (`integration/neo4j`, `integration/memory`). That change deliberately stopped at the contract — the consumer story ("transport wrappers depend on `DnaDataStore`") was deferred to follow-ons. This proposal is the first follow-on: a GraphQL API server that consumes the contract.

The product framing is "DNA in, API out." An organization authors an `OperationalDNA` describing its domain (Resources, Persons, Roles, Relationships, Operations). The API loads that DNA, generates a GraphQL schema from it, wires resolvers through a `DnaDataStore`, and serves the API. Everything is derived; nothing is hand-written per-domain.

Constraints from the prior conversation:
- **Monorepo package**, not a separate repo. Lives at `packages/api/` → `@dna-codes/dna-api`. Easier to iterate against the upstream contract; can be extracted later.
- **DNA-derived GraphQL schema**, not hand-written. The DNA's noun primitives ARE the seeds for the GraphQL type system; users layer their own primitives on top by editing the DNA.
- **Rule enforcement deferred.** `dna.rules[]` is read by the codegen for informational metadata, but no access enforcement is wired in v1. Authentication / authorization deferred with it.
- **Docker for local dev only.** Production hardening (TLS, secrets, observability) is out of scope.

The user has also asked for "a few instances of orgs based on example DNA" — concrete demonstrations that the per-org shape works. This becomes a docker-compose profile spinning up lending / registry / mass-tort stacks in parallel.

## Goals / Non-Goals

**Goals:**
- One TypeScript package, `@dna-codes/dna-api`, that on startup loads an `OperationalDNA`, generates a GraphQL schema, and serves Apollo Server.
- Schema generation is **DNA-derived end to end**: noun primitives → GraphQL types, attributes → fields/scalars/enums, relationships → fields with cardinality, operations → mutations.
- Type-generic CRUD floor (`<type>(id)`, `<type>s`, `create<Type>`, `update<Type>`, `delete<Type>`) plus a domain-specific mutation per DNA `Operation` (`Loan.Apply` → `loanApply`).
- Every resolver routes through an injected `DnaDataStore`; no Neo4j-driver imports in the API. Tests inject `integration/memory`; production injects `integration/neo4j`.
- A CLI (`bin/dna-api`) and a Docker setup (`Dockerfile` + two compose files) for local dev. The "examples" compose file demonstrates 2–3 parallel org stacks.
- The package and the underlying contract are forward-compatible with the deferred work (rule enforcement, auth, subscriptions) — they go in as additive changes, not rewrites.

**Non-Goals:**
- Rule enforcement, authentication, or authorization. The `dna.rules[]` entries are not consulted by resolvers in v1.
- GraphQL subscriptions, federation, or live-query semantics.
- Multi-tenancy in a single process. v1 is one DNA per process. Multi-org via multiple processes / containers.
- DataLoader / per-request batching. Resolvers issue one store call per field; perf is "good enough for example data and small orgs."
- TypeScript client codegen (`graphql-codegen` runs against the API, but the API doesn't ship a client).
- Production-grade Docker — no TLS, no secrets manager integration, no health-check beyond a stub `/healthz`.
- Hot-reload of the GraphQL schema when the DNA file changes. Process restart is the supported workflow.
- Postgres or any non-Neo4j backend. v1 is Neo4j (plus `integration/memory` for tests).

## Decisions

### D1: Attribute type → GraphQL scalar/enum mapping

DNA's `AttributeType` enum (`string | text | number | boolean | date | datetime | enum | reference`) maps to GraphQL as:

| DNA type | GraphQL | Notes |
|---|---|---|
| `string` | `String` | Built-in. |
| `text` | `String` | Same as `string` in GraphQL; the DNA distinction (long-form vs short) is informational only. |
| `number` | `Float` | Default. JSON `number` covers both int and float; `Float` is the lossless choice. (No `Int` discrimination in v1.) |
| `boolean` | `Boolean` | Built-in. |
| `date` | `String` | ISO-8601 date string. Custom scalars deferred to v2. |
| `datetime` | `String` | ISO-8601 timestamp. Same deferral. |
| `enum` | per-attribute GraphQL `enum` | Name: `<TypeName><AttributeName>` PascalCased (e.g. `LoanStatus`). Values come from the DNA `attribute.values[]`. |
| `reference` | GraphQL type of the referenced Resource | The DNA `attribute.resource` field names the target. Resolved at schema-build time. |

`required: true` on the attribute → GraphQL non-null (`String!`, `Float!`, etc.).

**Why `String` for date/datetime in v1**: a custom scalar (`DateTime`) is the canonical GraphQL pattern, but it requires registering the scalar at server-config time and either picking a library (graphql-scalars) or writing a parser. ISO strings are unambiguous, work with every client, and let v2 introduce custom scalars as a pure additive change (`String` → `DateTime` is a field-type change that's only "breaking" for clients that introspect — the over-the-wire JSON shape is identical).

**Resolves Q1** (in the proposal).

### D2: Reference attributes and Relationships both surface as GraphQL fields

DNA models references in two complementary ways:

- **`Attribute` with `type: 'reference'`**: a foreign-key style field on a Resource (e.g. `Loan.borrower_id`). The DNA stores the target Resource in `attribute.resource`.
- **`Relationship` primitive**: a declared connection between two Resources with cardinality + an `attribute` link back to the FK (e.g. `Loan.borrower` from=`Loan`, to=`Borrower`, cardinality=`many-to-one`, attribute=`borrower_id`).

Both translate to GraphQL fields on the `from` Resource's type, but with different semantics:

- The **reference attribute** itself becomes a scalar field returning the target Instance's ID: `borrower_id: ID`. Cheap; resolved from the local record.
- The **`Relationship`** becomes an *expanded* field returning the target Resource's GraphQL type: `borrower: Borrower`. Cardinality drives single-vs-list:
  - `one-to-one` / `many-to-one` → `borrower: Borrower` (nullable type, single)
  - `one-to-many` / `many-to-many` → `borrowers: [Borrower!]` (nullable list of non-null elements)

The relationship resolver issues a `store.link.list({ from: { typeName: 'Loan', id }, role: 'borrower' })` call. If the DNA has a matching `Relationship`, the codegen registers the resolver; otherwise the field is omitted. Resources without a declared `Relationship` get the FK scalar but no expansion field.

**Why both surfaces**: the FK scalar is a cheap escape hatch when callers already know the ID; the expansion field is the ergonomic default. GraphQL resolves laziness — adding the field doesn't cost anything unless it's requested.

**Resolves Q2.**

### D3: Operation mutations supplement CRUD; collisions resolve to the Operation

The codegen registers two mutation families per Resource:

- **Generic CRUD**: `create<Type>(input: <Type>Input!): <Type>!`, `update<Type>(id: ID!, input: <Type>Input!): <Type>!`, `delete<Type>(id: ID!): Boolean!`. Always present.
- **DNA-declared Operations**: one mutation per `Operation` entry. Naming: camelCase of `<target><Action>` (e.g. `Loan.Apply` → `loanApply`, `Loan.Approve` → `loanApprove`).

If a DNA-declared Operation has the same camelCase name as a generic CRUD mutation (e.g. a DNA Operation `Loan.Create` → `loanCreate`, while CRUD generates `createLoan` — different names, no collision in practice), the codegen prefers the DNA Operation and **skips the colliding CRUD mutation**. Operation semantics are richer (they may apply `changes[]` to attributes, fire triggers downstream) and the DNA-declared shape wins.

Operations from the DNA do NOT yet apply their `changes[]` server-side in v1 — the mutation accepts an `id`-and-`input` shape and delegates to `store.instance.update(typeName, id, input)`. State-machine enforcement (e.g. "Loan.Approve only runs when `status === 'pending'`") is part of rule enforcement and is deferred.

**Why supplement instead of override**: CRUD is the type-generic floor; DNA Operations are domain verbs. Most domains will declare a couple of Operations and lean on CRUD for the rest. Forcing "Operations only" would force every DNA to declare lifecycle mutations for every Resource, which is busywork.

**Resolves Q3.**

### D4: DNA source — env var + CLI flag, with file path the only v1 input

Startup looks up the DNA file via:

1. `--dna <path>` flag on the CLI (highest precedence).
2. `DNA_FILE` env var.
3. Error: "Set DNA_FILE or pass --dna <path>" — exit non-zero with a clear message.

Docker compose mounts a host-side DNA JSON file into the container at `/app/dna.json` and sets `DNA_FILE=/app/dna.json`. The compose files demonstrate this.

URL-based loading (HTTP, S3, etc.) is out of scope. If callers need it, they fetch the DNA themselves and write it to a file before invoking the API.

**Resolves Q4.**

### D5: Docker — three parallel stacks for examples, one each per org

`docker-compose.examples.yml` defines three full stacks side-by-side, each on different ports:

| Stack | API port | Neo4j HTTP / Bolt ports | DNA mount |
|---|---|---|---|
| `lending` | 4001 | 7475 / 7688 | `examples/lending/operational.json` |
| `registry` | 4002 | 7476 / 7689 | `examples/registry/operational.json` |
| `mass-tort` | 4003 | 7477 / 7690 | `examples/mass-tort/operational.json` |

Each stack has its own `neo4j-<org>` and `api-<org>` services. No shared Neo4j: it would require multi-database (an Enterprise feature) or `_dnaId` namespacing that conflicts with the existing per-Instance `_id` convention.

The single-org `docker-compose.yml` is the canonical local-dev shape (one Neo4j + one API). The examples file is for showcasing — `docker compose -f docker-compose.examples.yml up` brings everything up.

**Why three full stacks**: honest about the "per-org deployable" framing. Anyone reading the docker-compose can see the topology. A shared Neo4j would obscure the isolation story without saving meaningful resources at this scale.

**Resolves Q5.**

### D6: `DnaDataStore` injected via a factory; CLI wires it from env

The API's `createServer(opts: { dna, dataStore })` factory accepts a `DnaDataStore` directly. Tests pass `integration/memory.createClient(dna)`. Production code in `cli.ts` instantiates `integration/neo4j.createClient(neo4jOpts, dna)` from environment variables (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`).

The schema generator (`schema/index.ts`) does not touch the store directly. It returns a `GraphQLSchema`; resolvers in `resolvers/*` close over the injected `DnaDataStore`. This keeps the codegen pure (DNA → schema, no side effects) and isolates the store dependency to one composition point.

**Resolves Q6.**

### D7: Apollo Server v4 + Express for HTTP

Apollo Server v4 is the de facto choice. The package depends on:

- `@apollo/server` (the GraphQL server)
- `graphql` (the runtime)
- `express` + `cors` + `body-parser` for the HTTP integration (Apollo v4 unbundled the HTTP layer)
- `@dna-codes/dna-core` and `@dna-codes/dna-adapters`

Subscriptions, federation, persisted queries, and Apollo Studio integration are all deferred.

A `/healthz` endpoint returns `200 OK` for liveness checks. No readiness gating in v1.

### D8: Type / field naming conventions

| DNA name | GraphQL name | Example |
|---|---|---|
| Resource / Person / Role / Group | type name (PascalCase, as-is) | `Loan`, `Borrower`, `Underwriter`, `BankDepartment` |
| Attribute | field (snake_case → camelCase) | `borrower_id` → `borrowerId` |
| Enum attribute values | enum value (UPPER_SNAKE_CASE) | `pending` → `PENDING`, `repaid` → `REPAID` |
| Generated enum type | `<Type><Attribute>` | `Loan.status` → `LoanStatus` |
| Relationship-field | the `Relationship.attribute` field, stripped of `_id` suffix if present, camelCased | `Loan.borrower` (relationship attribute `borrower_id`) → field `borrower` |
| CRUD query (single) | camelCase singular | `loan(id: ID!): Loan` |
| CRUD query (plural) | camelCase plural (naive `+ s`) | `loans: [Loan!]!` |
| CRUD mutation | `<verb><Type>` | `createLoan`, `updateLoan`, `deleteLoan` |
| Operation mutation | camelCase of `<target><Action>` | `Loan.Apply` → `loanApply` |
| Input type | `<Type>Input` (CRUD) | `LoanInput` |

Pluralization is naive (`+ s`) in v1. Irregular plurals (Person → People) are handled with a small exceptions map (`person → persons` not `peoples`); we use `persons` for consistency with the DNA's `dna.domain.persons[]` field name.

### D9: Resolver behavior matrix

For each generated query/mutation, the resolver calls `DnaDataStore` directly:

| GraphQL operation | Store call |
|---|---|
| `loan(id: "x")` | `store.instance.get('Loan', 'x')` |
| `loans` | `store.instance.list('Loan')` |
| `createLoan(input)` | `store.instance.create('Loan', input)` then `store.instance.get('Loan', id)` |
| `updateLoan(id, input)` | `store.instance.update('Loan', id, input)` then `store.instance.get('Loan', id)` |
| `deleteLoan(id)` | `store.instance.delete('Loan', id)` returns `true` |
| `Loan.borrower` field resolver | `store.link.list({ from: { typeName: 'Loan', id }, role: 'borrower' })` → resolve first match's `to.id` via `store.instance.get('Borrower', id)` |
| `loanApply(id, input)` | same as `updateLoan` for v1; Operation semantics deferred |

CRUD mutations DO NOT auto-create Links. If a caller wants a Loan with a Borrower attached, they create the Borrower first, then create the Loan with `borrower_id` set, then call a `createLink` mutation (not in v1 — covered by the implicit "scalar FK is the v1 contract"). Link CRUD via GraphQL is itself deferred to a follow-on; in v1 the relationship field is read-only.

**Why read-only relationships in v1**: writes that span multiple records need transactional semantics that the v1 store doesn't expose. Adding `createLink` / `deleteLink` mutations is straightforward additive work for a follow-on once the read path is proven.

### D10: Startup contract

`createServer({ dna, dataStore }) → { schema, expressApp, listen(port) }`. The factory:

1. Validates `dna` via `DnaValidator` from `dna-core`. Fails fast on invalid input.
2. Generates the schema (pure, no I/O).
3. Calls `dataStore.migrate()` so the Neo4j (or memory) backend is ready before requests arrive.
4. Returns the composed server.

`cli.ts` adds the env-loading layer (read `DNA_FILE`, read Neo4j creds, instantiate the right store), then calls `createServer`. The CLI is the only file that imports both `integration/neo4j` and `createServer`.

## Risks / Trade-offs

- **[Risk]** Schema generation is startup-only; DNA changes require a process restart. → **Mitigation**: documented as the supported workflow; hot-reload is a known follow-on. Most consumers will rebuild containers on DNA change anyway.
- **[Risk]** v1 read-only relationships could surprise users who expect to attach a Borrower via `createLoan`. → **Mitigation**: README documents the v1 contract explicitly. Link-write mutations are a queued follow-on.
- **[Risk]** Operation mutations (`loanApply`) accept and forward the input but don't enforce DNA `changes[]` or `rules[]`. A naive caller may believe the API enforces them. → **Mitigation**: README's "v1 limitations" section spells this out. Rule enforcement is the next-largest follow-on after this proposal.
- **[Risk]** Naive pluralization (`+ s`) breaks for irregular plurals nobody warned us about (`Person → Persons` is fine since the DNA uses `persons`; `Mouse`, `Child`, etc. would be wrong). → **Mitigation**: small exceptions map; if a DNA hits one we don't handle, callers add it to the map in a one-line PR.
- **[Risk]** Three full stacks in `docker-compose.examples.yml` pull three Neo4j images and three API containers — heavy on disk and RAM for a demo. → **Mitigation**: documented in the examples README; users start them individually with `docker compose up api-lending neo4j-lending` if they only want one.
- **[Trade-off]** Apollo Server v4 vs Yoga: Yoga is leaner. Apollo is more documented and the de facto choice in 2026. Going with Apollo; ejecting later is a single-file change in `src/server.ts`.
- **[Trade-off]** Date/datetime as `String` instead of a custom scalar costs schema introspection accuracy (clients see `String`, not `DateTime`). The over-the-wire JSON is identical. Custom scalars are deferred to v2 as a pure additive change.
- **[Trade-off]** No DataLoader means N+1 queries on nested relationship fields. Acceptable at example-data scale; a benchmark-driven follow-on can introduce batching.

## Migration Plan

Purely additive. No consumer of this package exists yet, so there's nothing to migrate.

1. Land `packages/api/` with all files (schema codegen, resolvers, CLI, Docker assets, README, AGENTS.md).
2. Add `packages/api` to the root `package.json#workspaces`.
3. Add a row to the root `README.md` Packages section.
4. Smoke test locally: `docker compose -f packages/api/docker-compose.examples.yml up`; query the three example stacks via their respective ports.

Rollback: revert the commit. Nothing depends on the new package yet.

## Open Questions

All six questions from the proposal brief are resolved in the decisions above:

- **Q1 → D1**: attribute type mapping table.
- **Q2 → D2**: reference attributes surface as FK scalars; Relationships surface as expansion fields.
- **Q3 → D3**: Operations supplement CRUD; same-name collisions resolve to the Operation.
- **Q4 → D4**: `--dna` flag wins, `DNA_FILE` env is the fallback.
- **Q5 → D5**: three parallel stacks in the examples compose file, one each per org.
- **Q6 → D6**: factory-injected `DnaDataStore`; CLI wires from env.

No remaining open questions blocking implementation.
