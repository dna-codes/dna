# @dna-codes/dna-api

Registry-native GraphQL API server. Tenants get a runtime-configurable
type system — `ResourceType` and `RelationshipType` records *are* the
schema. Admins author types through the API; the GraphQL schema
regenerates and hot-swaps to reflect them. The DNA file is a *seed* for
the foundational types on first boot; after that, storage is the source
of truth.

```
┌────────────────┐  first boot only   ┌────────────────────────┐
│ OperationalDNA │ ──────────────────▶│ ResourceTypes (seeded) │
└────────────────┘                    └───────┬────────────────┘
                                              │
                                       admin API mutations
                                              │
                                              ▼
                                    ┌──────────────────────┐
                                    │     GraphQL API      │
                                    └────────┬─────────────┘
                                             │
                                       DnaDataStore
                                             │
                                             ▼
                                       ┌────────┐
                                       │ Neo4j  │
                                       └────────┘
```

Built on top of `@dna-codes/dna-adapters/integration/neo4j`, which
persists everything (`ResourceType`, `RelationshipType`, `Instance`,
`Link`) using a single storage layer with versioned history.

## Quick start — single-org Docker

From the repo root:

```sh
# Pick any DNA — it just seeds the foundational types on first boot:
cp examples/lending/operational.json packages/api/dna.json

docker compose -f packages/api/docker-compose.yml up
```

Then in another terminal:

```sh
# Health check
curl -s http://localhost:4000/healthz

# Schema introspection — see the registry-native CRUD surface
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ resourceTypes { id name category currentVersion isSeed } }"}'

# Author a new ResourceType (the tenant adds their own domain type)
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { createResourceType(input: { name: \"Account\", category: RESOURCE, attributeSchema: [{ name: \"balance\", type: NUMBER, required: true }] }) { id name currentVersion } }"}'

# Now the schema has an Account type. Create an instance:
curl -s http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"mutation { createAccount(input: { balance: 5000 }) { id balance _schemaVersion } }"}'
```

The Neo4j Browser at `http://localhost:7474` (`neo4j` / `devpassword`)
shows the storage shape — `:ResourceType` nodes, `:ResourceTypeVersion`
history, and per-typename Instance nodes (`:Loan`, `:Borrower`, …).

## Quick start — multi-example-org Docker

Three example DNAs running as fully isolated per-org stacks:

```sh
docker compose -f packages/api/docker-compose.examples.yml up
```

| Org | API endpoint | Neo4j HTTP | Neo4j Bolt | Schema seeded from |
|---|---|---|---|---|
| `lending` | `http://localhost:4001/graphql` | `:7475` | `:7688` | [`examples/lending`](../../examples/lending) |
| `registry` | `http://localhost:4002/graphql` | `:7476` | `:7689` | [`examples/registry`](../../examples/registry) |
| `mass-tort` | `http://localhost:4003/graphql` | `:7477` | `:7690` | [`examples/mass-tort`](../../examples/mass-tort) |

> Docker setup is **local-dev only**. No TLS, no secret rotation, no
> production hardening. See "Out of scope" below.

## Quick start — CLI without Docker

```sh
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=devpassword \
node packages/api/bin/dna-api.js serve --dna ./examples/lending/operational.json --port 4000
```

## How the type system works

### First-boot seeding

On startup, the CLI checks `dataStore.hasBeenSeeded()`. If false, it
calls `dataStore.seedFromDna(dna)`, which writes:

1. **Four foundational `ResourceType` records** — `Person`, `Role`,
   `Group`, `Resource`. These are the noun-categories tenant-defined
   types specialize into. All marked `is_seed: true`.
2. **One `ResourceType` per `dna.domain.{persons,roles,groups,resources}` entry.**
   The DNA's `Loan` and `Borrower` become tenant-domain `ResourceType` records.
3. **One `RelationshipType` per `dna.relationships[]` entry.** Same `is_seed: true` flag.
4. **A `:SeedMarker`** sentinel node so subsequent boots skip seeding.

After first boot, the DNA file is no longer load-bearing. The CLI
continues to require `--dna` (or `DNA_FILE`) at every startup so it
can compute a drift warning if the file has changed since the seed —
but no re-seed runs.

### Versioning

Each `ResourceType.attribute_schema` change creates a new immutable
`ResourceTypeVersion` record and bumps the live record's
`current_version`. Every `Resource` write stamps `_schemaVersion =
current_version`. Reads return the stamped version unchanged.

v1 does NOT retroactively migrate or revalidate existing data when a
schema changes. The version stamp is the contract — tenants migrate
data explicitly via `update<Type>` mutations.

### Schema hot-reload

`createResourceType` / `updateResourceType` / `deleteResourceType` (and
the same for `RelationshipType`) trigger a `SchemaManager.rebuild()` in
the resolver. The Apollo Server instance is recreated with the fresh
schema; in-flight requests started before the swap complete against
the prior schema. Expect a sub-second window of 5xx during the swap on
the rare schema-mutation event.

### Foundational types are deletable (with cascade)

`is_seed: true` records can be deleted — but `delete<Type>(id)` without
`cascade: true` returns an error if the type is seeded. Pass `cascade:
true` to confirm; the resolver cascades into Instance deletion before
removing the type and its versions.

## v1 limitations

All documented, all queued as follow-on proposals:

- **Authentication / authorization** — wide-open admin CRUD in v1.
- **Rule enforcement** (`dna.rules[]`) — not consulted by resolvers.
- **GraphQL subscriptions / federation** — not in v1.
- **Retroactive schema migration** — existing Resources keep their
  write-time `_schemaVersion` after a type update. No automatic backfill.
- **DNA hot-reload** — schema changes happen through the API, not by
  editing the DNA file.
- **Multi-tenancy in a single process** — one DNA seed per process;
  multi-org via multiple processes / containers.
- **Naive pluralization** — `Person → persons` is wired; other
  irregulars need a one-line override map addition.
- **Dates as `String`** — custom scalars deferred to v2.
- **DataLoader batching** — queue after a benchmark.
- **DNA `Operation` codegen** — dropped from v1. Operations may
  return as a fifth top-level type in a future proposal.

## Out of scope (production hardening)

The Docker assets are **local-dev only**. They explicitly do NOT
provide TLS termination, secret management beyond env vars,
readiness gating, structured observability, Neo4j backup/restore, or
multi-replica scaling. These belong in a deployment story owned by
the operator.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DNA_FILE` | yes (or `--dna`) | Path to a seed `OperationalDNA` JSON document. Used for first-boot seeding; drift-checked on subsequent boots. |
| `NEO4J_URI` | yes | Bolt URI, e.g. `bolt://localhost:7687` |
| `NEO4J_USERNAME` | yes | Basic-auth username |
| `NEO4J_PASSWORD` | yes | Basic-auth password |
| `NEO4J_DATABASE` | no | Database name (driver default if unset) |
| `PORT` | no | HTTP port (default `4000`) |

## Migrating from v0.1.0 → v0.2.0

If you ran the prior `@dna-codes/dna-api@0.1.0`, run the migration
script ONCE per Neo4j instance before deploying v0.2.0:

```sh
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=devpassword \
npx ts-node packages/api/scripts/migrate-to-registry.ts
```

The script:

1. Renames `:TypeDefinition` → `:ResourceType` (stamps `current_version: 1`, `is_seed: false`).
2. Same for `:RelationshipDef` → `:RelationshipType`.
3. Writes initial `:ResourceTypeVersion` / `:RelationshipTypeVersion` history records.
4. Stamps `_schemaVersion: 1` on every Instance node and `:LINK` edge.
5. Writes a `:SeedMarker` so the next API boot skips re-seeding.

Idempotent — re-running after success is a no-op.

## Releasing

See the root [`README.md`](../../README.md). Tag-driven release
publishes `@dna-codes/dna-core`, `@dna-codes/dna-adapters`, and this
package together.
