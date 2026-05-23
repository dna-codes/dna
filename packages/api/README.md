# @dna-codes/dna-api

DNA-derived GraphQL API server. Load an `OperationalDNA`, get a GraphQL
schema. The DNA's noun primitives, attributes, relationships, and
operations all become GraphQL types and resolvers — no hand-written
schema, no hand-written queries, no bespoke backend code.

```
┌────────────────┐    DNA-derived schema     ┌────────────────┐
│ OperationalDNA │ ─────────────────────────▶│  GraphQL API   │
└────────────────┘                            └───────┬────────┘
                                                      │
                                              DnaDataStore
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │     Neo4j      │
                                              └────────────────┘
```

Built on top of [`@dna-codes/dna-adapters/integration/neo4j`](../adapters/src/integration/neo4j),
which persists DNA-described data using the registry triad (TypeDefinition
/ Instance / Link) demonstrated in [`examples/registry`](../../examples/registry).

## Quick start — single-org Docker

From the repo root:

```sh
# Put your DNA JSON next to the compose file (or symlink an example):
cp examples/lending/operational.json packages/api/dna.json

docker compose -f packages/api/docker-compose.yml up
```

That brings up:

| Service | Host port | Purpose |
|---|---|---|
| `neo4j` | `7474` (HTTP), `7687` (Bolt) | Runtime data store. Auth: `neo4j` / `devpassword` |
| `api` | `4000` | GraphQL server. `POST /graphql`, `GET /healthz` |

Once running, try an introspection query:

```sh
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __schema { queryType { name } types { name } } }"}'
```

Or a CRUD round-trip (replace the input fields to match your DNA):

```sh
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { createLoan(input: { amount: 1000, interestRate: 0.05, borrowerId: \"b1\", status: PENDING }) { id amount status } }"}'
```

## Quick start — multi-example-org Docker

Three example DNAs (`lending`, `registry`, `mass-tort`) running as fully
isolated per-org stacks:

```sh
docker compose -f packages/api/docker-compose.examples.yml up
```

| Org | API endpoint | Neo4j HTTP | Neo4j Bolt | Schema seeded from |
|---|---|---|---|---|
| `lending` | `http://localhost:4001/graphql` | `:7475` | `:7688` | [`examples/lending`](../../examples/lending) |
| `registry` | `http://localhost:4002/graphql` | `:7476` | `:7689` | [`examples/registry`](../../examples/registry) |
| `mass-tort` | `http://localhost:4003/graphql` | `:7477` | `:7690` | [`examples/mass-tort`](../../examples/mass-tort) |

Each stack has its own dedicated Neo4j (no shared multi-tenancy in v1).
Start a single stack with:

```sh
docker compose -f packages/api/docker-compose.examples.yml up api-lending neo4j-lending
```

> This compose is **local-dev only**. No TLS, no secret rotation, no
> production hardening. See "Out of scope" below.

## Quick start — CLI without Docker

```sh
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=devpassword \
node packages/api/bin/dna-api.js serve --dna ./examples/lending/operational.json --port 4000
```

## Architecture

```
packages/api/src/
├── schema/
│   ├── types.ts          DNA noun → GraphQL type (per noun primitive)
│   ├── relationships.ts  Relationship → expansion field on the `from` type
│   ├── crud.ts           Type-generic CRUD queries + mutations
│   ├── operations.ts     DNA Operation → domain-specific mutation
│   ├── naming.ts         snake_case → camelCase, enum value casing, etc.
│   └── index.ts          Composes the four above into one GraphQLSchema
├── resolvers/
│   ├── instance.ts       CRUD resolvers (close over DnaDataStore)
│   ├── relationships.ts  Link-list-then-instance-get
│   └── operations.ts     v1 update-and-re-read
├── server.ts             Apollo Server v5 + Express + /healthz
├── cli.ts                `serve` command, env-driven creds
└── index.ts              Package exports
```

Resolvers route 100% through the injected `DnaDataStore`. The API package
does NOT import `neo4j-driver` directly. Tests pass
`@dna-codes/dna-adapters/integration/memory`; production code passes
`@dna-codes/dna-adapters/integration/neo4j`.

### Schema codegen rules

| DNA construct | Becomes |
|---|---|
| `Resource` / `Person` / `Role` / `Group` | GraphQL `type` (PascalCase, with `id: ID!`) |
| `Attribute { type: 'string' \| 'text' }` | `String` |
| `Attribute { type: 'number' }` | `Float` |
| `Attribute { type: 'boolean' }` | `Boolean` |
| `Attribute { type: 'date' \| 'datetime' }` | `String` (ISO-8601; custom scalars deferred) |
| `Attribute { type: 'enum' }` | `<Type><Attribute>` enum (e.g. `LoanStatus`); values UPPER_SNAKE_CASE |
| `Attribute { type: 'reference' }` | `ID` scalar (FK only; expansion field comes from a declared `Relationship`) |
| `Attribute { required: true }` | Non-null wrap |
| `Relationship` (many-to-one / one-to-one) | Single nullable field on the `from` type |
| `Relationship` (one-to-many / many-to-many) | `[<Target>!]` on the `from` type |
| `Operation { target: 'Loan', action: 'Apply' }` | Mutation `loanApply(id, input)` |
| Every noun primitive | CRUD: `<type>(id)`, `<type>s`, `create<Type>`, `update<Type>`, `delete<Type>` |

### Storage shape

Under the hood the API persists every Instance and Link via
`@dna-codes/dna-adapters/integration/neo4j`. See that adapter's
[README](../adapters/src/integration/neo4j/README.md) for the Neo4j node
+ edge layout, `migrate()` semantics, and the registry-triad design.

## v1 limitations

These are real and documented; they are intentionally deferred to
follow-on proposals rather than being undone.

- **Relationships are read-only.** Expansion fields surface linked
  records, but there are no `createLink` / `deleteLink` mutations in v1.
  Caller writes only happen against scalar FKs (e.g. `borrowerId`).
- **DNA Rules are not enforced.** `dna.rules[]` (access + condition Rules)
  are not consulted by resolvers. Anyone reaching the API can call any
  mutation. Authentication / authorization sit in the same follow-on.
- **DNA Operations don't apply `changes[]` server-side.** `loanApply` in
  v1 is structurally equivalent to `updateLoan` — it forwards the input.
  State-machine semantics (`Loan.Apply` requires `status === undefined`)
  live with Rule enforcement.
- **No GraphQL subscriptions / federation / persisted queries.**
- **One DNA per process.** Multi-tenant via multiple processes/containers,
  not via per-request DNA dispatch.
- **No schema hot-reload.** Edit your DNA → restart the process.
- **No DataLoader / per-request batching.** Nested relationship fields
  can issue N+1 store calls. Acceptable at example-data scale; a
  benchmark-driven follow-on will introduce batching.
- **Dates are `String`, not a custom scalar.** Migrating to a `DateTime`
  scalar is an additive change for v2.
- **Pluralization is naive** (`+ s`) with a small override map. `Person` →
  `persons` is wired; other irregulars (`Mouse` etc.) need a one-line
  PR adding to the map.

## Out of scope (production hardening)

The Docker assets are **local-dev only**. They explicitly do NOT provide:

- TLS termination
- Secret management (env vars are fine for dev; a real prod story is
  needed)
- Health-check readiness gating beyond `/healthz`
- Observability (no structured logs, metrics, traces)
- Backup / restore for the Neo4j volume
- Multi-replica scaling

These belong in a deployment story owned by the operator, not in this
package.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DNA_FILE` | yes (or `--dna` flag) | Path to the `OperationalDNA` JSON document |
| `NEO4J_URI` | yes | Bolt URI, e.g. `bolt://localhost:7687` |
| `NEO4J_USERNAME` | yes | Basic-auth username |
| `NEO4J_PASSWORD` | yes | Basic-auth password |
| `NEO4J_DATABASE` | no | Database name (defaults to the driver's default) |
| `PORT` | no | HTTP port (default `4000`; falls back to the `--port` flag's value when neither is set) |

## Releasing

See the root [`README.md`](../../README.md) Releasing section. Tag-driven
release publishes both `@dna-codes/dna-core` and `@dna-codes/dna-adapters`
alongside this package when their versions bump.
