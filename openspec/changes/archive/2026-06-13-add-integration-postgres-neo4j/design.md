## Context

The builders + queries change gives `dna-core` a complete in-memory API over `OperationalDNA`. Any transport wrapper that exposes that API needs to load and save DNA from somewhere. Without a shared persistence contract, each transport invents its own — picking its own serialization, its own DB client, its own error handling. The `DnaStore` interface + two concrete implementations closes that gap before the first transport wrapper is built.

Postgres and Neo4j cover the two primary storage models:

- **Postgres**: stores the whole `OperationalDNA` document as a JSONB blob, keyed by a caller-assigned string ID. Simple, transactional, easy to operate. The right default for any deployment that already runs Postgres.
- **Neo4j**: maps DNA primitives to labeled nodes and DNA cross-references to typed edges. Enables graph traversal — Cypher queries that span the DNA structure natively. The right choice when the agent platform layer needs to reason about reachability, role → operation → resource chains, etc.

The existing integration pattern (pure I/O, `fetch(uri) → bytes`, `write(target, bytes)`) was designed for external systems like Jira and Notion, where the integration fetches foreign content and input adapters translate it into DNA. Postgres and Neo4j are different: their purpose is to persist `OperationalDNA` itself. Making them bytes-only would mean callers handle `JSON.parse` + type casting at every call site — boilerplate with no isolation benefit. Both integrations are explicitly DNA-aware.

## Goals / Non-Goals

**Goals:**

- `DnaStore` interface in `dna-core`: `get`, `save`, `list`, `delete`. Typed against `OperationalDNA`. Transport wrappers depend on this interface, not on a concrete implementation.
- `integration/postgres`: implements `DnaStore` with a single JSONB table. Ships `client.migrate()` for table + index creation. Upsert semantics on `save`.
- `integration/neo4j`: implements `DnaStore` with a property graph. Each top-level DNA primitive is a labeled node; string cross-references are typed edges. Ships `client.migrate()` for constraints + indexes.
- `integration/memory`: implements `DnaStore` with an in-memory map. Zero dependencies. Default for tests across all transport wrappers.
- All three expose `createClient(opts)` returning the `DnaStore` interface.
- All three have a `cli.ts` following the existing integration CLI convention: `get`, `save`, `list`, `delete`, `migrate` commands; env-driven credentials.

**Non-Goals:**

- Versioning / snapshot history. `save` is upsert — replaces the existing document. A `versions` table or append-only log can layer on top in a separate change.
- Partial updates. `save` always writes the full `OperationalDNA`. Per-primitive writes through the store are out of scope; callers use the query API to read, builders to mutate, then `save` the full result.
- Product-layer / Technical-layer persistence. Store accepts `OperationalDNA` only; extending to other layers is a separate change when those layers stabilize.
- Neo4j `ProcessStep` as nodes (see D5).
- Connection pooling configuration beyond what `pg` and `neo4j-driver` provide by default.

## Decisions

### D1: `DnaStore` interface lives in `dna-core`

```ts
// packages/core/src/types/store.ts
export interface DnaStore {
  get(id: string): Promise<OperationalDNA | null>
  save(id: string, dna: OperationalDNA): Promise<void>
  list(): Promise<Array<{ id: string; name: string }>>
  delete(id: string): Promise<void>
}
```

**Why `dna-core`**: `DnaStore` depends on `OperationalDNA` (defined in core) and has no relationship to the ingest pipeline. `dna-core` already exports shared adapter contracts (`ParseResult`, `Style`, etc.) — `DnaStore` is the same kind of shared contract. Transport wrappers depend only on `dna-core`, not on `dna-adapters`, so the interface must live there.

**Why not `dna-ingest`**: `dna-ingest` owns the `Integration` and `InputAdapter` ports, which are about the ingest pipeline. `DnaStore` is a persistence contract, orthogonal to ingestion.

### D2: Postgres — single JSONB table, upsert on `save`

Schema:

```sql
CREATE TABLE IF NOT EXISTS dna_documents (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  document    JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dna_documents_name ON dna_documents (name);
```

- `name` is extracted from `dna.domain.name` at save time and stored as a top-level column for efficient `list()` queries without scanning JSONB.
- `save` upserts: `INSERT ... ON CONFLICT (id) DO UPDATE SET document = $2, name = $3, updated_at = NOW()`.
- `get` returns `null` on missing `id` — no throw.
- `migrate()` runs the `CREATE TABLE IF NOT EXISTS` + index statements. Idempotent; safe to call on every startup.
- Runtime dep: `pg`. No ORM — direct parameterized queries only.

**Why JSONB over relational tables**: DNA schemas evolve. A JSONB column means schema changes in `@dna-codes/dna-schemas` don't require DB migrations. The relational model (one table per primitive) would require a migration every time a new field or primitive is added. JSONB round-trips cleanly with the existing TypeScript types; validation is `dna-core`'s job before save.

### D3: Neo4j — nodes per primitive, edges per cross-reference

Top-level DNA primitives map to labeled nodes. Each node carries its scalar properties from the DNA shape. String cross-references become typed edges:

| DNA field | Edge |
|---|---|
| `operation.target` | `(Operation)-[:TARGETS]->(Resource\|Person\|Role\|Group)` |
| `rule.operation` | `(Rule)-[:GOVERNS]->(Operation)` |
| `rule.allow[].role` | `(Rule)-[:ALLOWS]->(Role)` |
| `rule.allow[].person` | `(Rule)-[:ALLOWS]->(Person)` |
| `trigger.operation` | `(Trigger)-[:FIRES]->(Operation)` |
| `trigger.process` | `(Trigger)-[:FIRES]->(Process)` |
| `task.operation` | `(Task)-[:PERFORMS]->(Operation)` |
| `task.actor` (role) | `(Task)-[:ACTOR]->(Role)` |
| `task.actor` (person) | `(Task)-[:ACTOR]->(Person)` |
| `membership.person` | `(Membership)-[:PERSON]->(Person)` |
| `membership.role` | `(Membership)-[:ROLE]->(Role)` |
| `membership.group` | `(Membership)-[:GROUP]->(Group)` |
| `role.scope` | `(Role)-[:SCOPED_TO]->(Group\|Person)` |

All nodes also carry a `_dnaId` property (the caller-assigned store ID) to scope queries to a single DNA document. This allows multiple DNA documents to coexist in one Neo4j database.

`save` is a Cypher `MERGE` upsert: `MERGE (n:Resource {name: $name, _dnaId: $id}) SET n += $props`.

`get` reconstructs `OperationalDNA` by reading all nodes with the given `_dnaId` and their edges, then assembling the in-memory shape. This is the only place in the integration where DNA structure is explicitly understood.

`migrate()` creates uniqueness constraints and indexes:
```cypher
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Resource) REQUIRE (n._dnaId, n.name) IS UNIQUE;
-- repeated for each node label
CREATE INDEX IF NOT EXISTS FOR (n:Resource) ON (n._dnaId);
```

Runtime dep: `neo4j-driver`.

### D4: `integration/memory` — in-memory map, zero deps

```ts
export function createClient(): DnaStore {
  const store = new Map<string, OperationalDNA>()
  return {
    async get(id) { return store.get(id) ?? null },
    async save(id, dna) { store.set(id, dna) },
    async list() {
      return [...store.entries()].map(([id, dna]) => ({ id, name: dna.domain.name }))
    },
    async delete(id) { store.delete(id) },
  }
}
```

No `migrate()` — nothing to migrate. Included in this change (not a separate one) because transport wrapper tests need a `DnaStore` test double the moment any transport wrapper is written; shipping the interface without a test double leaves every downstream package to write its own.

### D5: `ProcessStep` stored as JSON property on `Process` node (Neo4j)

`ProcessStep` is not a top-level DNA primitive — it is a sub-object of `Process` with its own cross-references (`task`, `depends_on[]`, `conditions[]`, `else`). Representing steps as first-class Neo4j nodes (with `(Process)-[:HAS_STEP]->(Step)-[:TASK]->(Task)` edges) would enable full DAG traversal in Cypher but requires a more complex `get` reconstruction pass.

For v1: steps are stored as a `steps` JSON property on the `Process` node. The `task` cross-references within steps are not materialized as edges. This is explicitly parked — a follow-on change can promote steps to nodes once there is a concrete traversal use case that requires it.

**Why**: The `get` round-trip is the binding constraint. Every node-level property must be reconstructable back to the exact `OperationalDNA` shape. Steps-as-nodes adds reconstruction complexity (ordering, `depends_on` graph rebuild) without a current use case. YAGNI.

### D6: CLI per integration — `get`, `save`, `list`, `delete`, `migrate` commands

Each integration's `cli.ts` follows the existing pattern from `integration/jira/cli.ts`:

- Commands: `migrate`, `list`, `get --id <id>`, `save --id <id> --in <dna.json>`, `delete --id <id>`
- Credentials from environment variables, never flags
- `migrate` is safe to call repeatedly (idempotent)

CLI is the composition layer — it is the only place in each integration package that imports from `dna-core` for JSON parsing and validation. (The library API also imports `OperationalDNA` from `dna-core` for types, but the CLI additionally calls `DnaValidator` before `save`.)

### D7: Sequencing — `DnaStore` in `dna-core` first, then adapters

Implementation order:
1. Add `DnaStore` to `dna-core` + bump core
2. Implement `integration/memory` (no external deps, proves the interface)
3. Implement `integration/postgres`
4. Implement `integration/neo4j`

Steps 2–4 can be done in a single adapters bump since they share no code and don't depend on each other.

## Risks / Trade-offs

- **[Risk]** Neo4j `get` reconstruction is the only place that must understand every DNA cross-reference. If a new cross-reference is added to the DNA schema, `get` must be updated to reconstruct it from edges. → **Mitigation**: round-trip tests (`save` then `get` then deep-equal) against all canonical fixtures (`examples/lending`, `examples/manufacturing`, etc.) catch any gap immediately.
- **[Risk]** Postgres JSONB means no DB-level enforcement of DNA schema validity. An invalid document could be written if the caller bypasses `DnaValidator`. → **Mitigation**: the CLI's `save` command validates before writing. Library callers who skip validation own that risk — documented in the README.
- **[Trade-off]** `ProcessStep` not as Neo4j nodes means DAG traversal in Cypher is not available in v1. This is a known limitation, documented in both the README and the parked design decision. Transport wrappers that need process-step traversal use the in-memory query API (`getProcess`, `getTasksForOperation`) after loading from the store.
- **[Trade-off]** `save` is always a full document replace. Callers who want to update one operation must `get` → mutate via builders → `save`. This is intentional — partial updates require merging semantics that already exist in `dna-core`'s `merge()`, but exposing them through the store adds significant complexity. Callers compose the operations themselves.

## Open Questions

- **Q1**: Should `DnaStore` include a `migrate()` method on the interface, or should `migrate()` only exist on the concrete client types? Leaning toward keeping `migrate()` off the interface — it's a setup concern, not a runtime concern; transport wrappers that depend on `DnaStore` shouldn't need to know about migrations.
- **Q2**: Should `save` call `DnaValidator` internally (like builders default to validating), or trust the caller? Leaning toward trusting the caller in the library — validation is `dna-core`'s job; the CLI layer validates before calling `save`. Keeps the store a thin persistence layer.
