## 1. Pre-implementation (open questions resolved in design.md)

- [ ] 1.1 Resolve Q1: confirm `migrate()` stays off the `DnaStore` interface — verify no transport wrapper prototype needs to call `migrate()` through the interface before locking this in.
- [ ] 1.2 Resolve Q2: confirm `save` trusts the caller for validation in the library API — document the contract clearly in both READMEs so callers know validation is their responsibility.

## 2. `DnaStore` interface in `dna-core`

- [ ] 2.1 Create `packages/core/src/types/store.ts` with the `DnaStore` interface (`get`, `save`, `list`, `delete`)
- [ ] 2.2 Export `DnaStore` from `packages/core/src/index.ts` alongside existing adapter type exports
- [ ] 2.3 Add a type test confirming `DnaStore` methods accept `OperationalDNA` and return the correct promise shapes
- [ ] 2.4 Bump `@dna-codes/dna-core` patch version

## 3. `integration/memory`

- [ ] 3.1 Create `packages/adapters/src/integration/memory/index.ts` — `createClient(): DnaStore` backed by a `Map<string, OperationalDNA>`
- [ ] 3.2 Add `types.ts` with `MemoryClient` type alias (re-export of `DnaStore` — no extra surface)
- [ ] 3.3 Tests: `save` then `get` round-trips, `list` returns all, `delete` removes, `get` on missing ID returns `null`
- [ ] 3.4 Add `./integration/memory` to `packages/adapters/package.json#exports`
- [ ] 3.5 `README.md` and `AGENTS.md` — note this is the recommended test double for any package that depends on `DnaStore`

## 4. `integration/postgres`

- [ ] 4.1 Create `packages/adapters/src/integration/postgres/` directory
- [ ] 4.2 `types.ts` — `PostgresClientOptions` (`connectionString`, optional `ssl`), `PostgresClient` interface (extends `DnaStore`, adds `migrate(): Promise<void>`, `close(): Promise<void>`)
- [ ] 4.3 `client.ts` — `createClient(opts: PostgresClientOptions): PostgresClient`
  - [ ] 4.3a `migrate()` — runs `CREATE TABLE IF NOT EXISTS dna_documents (...)` + `CREATE INDEX IF NOT EXISTS ...`; idempotent
  - [ ] 4.3b `save(id, dna)` — upserts: extracts `dna.domain.name` for the `name` column; `INSERT ... ON CONFLICT (id) DO UPDATE SET document = $2, name = $3, updated_at = NOW()`
  - [ ] 4.3c `get(id)` — `SELECT document FROM dna_documents WHERE id = $1`; returns `null` on miss
  - [ ] 4.3d `list()` — `SELECT id, name FROM dna_documents ORDER BY name`
  - [ ] 4.3e `delete(id)` — `DELETE FROM dna_documents WHERE id = $1`
  - [ ] 4.3f `close()` — ends the `pg.Pool`
- [ ] 4.4 `index.ts` — re-exports `createClient` and types
- [ ] 4.5 `cli.ts` — `migrate`, `list`, `get --id`, `save --id --in`, `delete --id` commands; credentials from `POSTGRES_CONNECTION_STRING` env var; `save` calls `DnaValidator` before writing
- [ ] 4.6 Tests (against a real Postgres instance via `DATABASE_URL` env var; skip if not set):
  - [ ] 4.6a `migrate()` is idempotent
  - [ ] 4.6b `save` + `get` round-trips a full `OperationalDNA` (use `bookshopInput` fixture + all `examples/` fixtures)
  - [ ] 4.6c `list` returns correct `id` + `name` entries
  - [ ] 4.6d `delete` removes document; subsequent `get` returns `null`
  - [ ] 4.6e `save` on existing `id` replaces document (upsert)
- [ ] 4.7 Add `./integration/postgres` to `packages/adapters/package.json#exports`
- [ ] 4.8 Add `pg` to `packages/adapters/package.json#dependencies`; verify it does not affect subpaths that don't import it
- [ ] 4.9 `README.md` — schema, env vars, `migrate()` usage, validation contract (caller's responsibility)
- [ ] 4.10 `AGENTS.md` — note the deliberate DNA-awareness exception to the pure-I/O rule, with rationale

## 5. `integration/neo4j`

- [ ] 5.1 Create `packages/adapters/src/integration/neo4j/` directory
- [ ] 5.2 `types.ts` — `Neo4jClientOptions` (`uri`, `username`, `password`, optional `database`), `Neo4jClient` interface (extends `DnaStore`, adds `migrate(): Promise<void>`, `close(): Promise<void>`)
- [ ] 5.3 `mapper.ts` — pure functions (no I/O) for DNA ↔ graph mapping:
  - [ ] 5.3a `dnaToNodes(id, dna)` — returns array of `{ label, props }` for each top-level primitive
  - [ ] 5.3b `dnaToEdges(id, dna)` — returns array of `{ from, rel, to }` for each cross-reference (see design.md D3 table); skips dangling references silently
  - [ ] 5.3c `nodesToDna(nodes, edges)` — reconstructs `OperationalDNA` from node props + edges; inverse of `dnaToNodes` + `dnaToEdges`; `ProcessStep` rebuilt from the `steps` JSON property on `Process` nodes
- [ ] 5.4 `client.ts` — `createClient(opts: Neo4jClientOptions): Neo4jClient`
  - [ ] 5.4a `migrate()` — creates uniqueness constraints and indexes per node label via Cypher `CREATE CONSTRAINT IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`
  - [ ] 5.4b `save(id, dna)` — MERGE all nodes (`MERGE (n:Label {name: $name, _dnaId: $id}) SET n += $props`); MERGE all edges; delete stale nodes/edges from a previous version of this DNA ID
  - [ ] 5.4c `get(id)` — `MATCH (n {_dnaId: $id}) RETURN n, labels(n)` + edge query; passes to `nodesToDna`; returns `null` if no nodes found
  - [ ] 5.4d `list()` — `MATCH (d:Domain {_dnaId: $id}) RETURN d._dnaId, d.name` (Domain node is the anchor)
  - [ ] 5.4e `delete(id)` — `MATCH (n {_dnaId: $id}) DETACH DELETE n`
  - [ ] 5.4f `close()` — closes the `neo4j-driver` session
- [ ] 5.5 `index.ts` — re-exports `createClient` and types
- [ ] 5.6 `cli.ts` — same commands as postgres (`migrate`, `list`, `get`, `save`, `delete`); credentials from `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` env vars; `save` calls `DnaValidator` before writing
- [ ] 5.7 Tests (against a real Neo4j instance via `NEO4J_URI` env var; skip if not set):
  - [ ] 5.7a `mapper.ts` unit tests — `dnaToNodes` + `dnaToEdges` + `nodesToDna` round-trip for all `examples/` fixtures; no DB required
  - [ ] 5.7b `migrate()` is idempotent
  - [ ] 5.7c `save` + `get` round-trips `OperationalDNA` exactly (deep-equal) for all `examples/` fixtures
  - [ ] 5.7d `save` on existing `id` replaces all nodes and edges cleanly (no stale nodes)
  - [ ] 5.7e `delete` removes all nodes with `_dnaId`; subsequent `get` returns `null`
  - [ ] 5.7f Edge coverage: at least one fixture per edge type in the D3 table (use `examples/lending` for Rule/Operation/Role edges; `examples/manufacturing` for system Role + schedule Trigger edges)
- [ ] 5.8 Add `./integration/neo4j` to `packages/adapters/package.json#exports`
- [ ] 5.9 Add `neo4j-driver` to `packages/adapters/package.json#dependencies`
- [ ] 5.10 `README.md` — graph model, env vars, `migrate()` usage, `ProcessStep` limitation (D5), validation contract
- [ ] 5.11 `AGENTS.md` — note deliberate DNA-awareness exception; document `ProcessStep` as parked node promotion

## 6. Documentation

- [ ] 6.1 Update root `README.md` — add `integration/postgres`, `integration/neo4j`, `integration/memory` rows to the Adapters table
- [ ] 6.2 Update `packages/ingest/AGENTS.md` — note that database integrations are a DNA-aware exception to the pure-I/O rule; point to these adapters as the reference pattern
- [ ] 6.3 Update `packages/adapters/src/integration/example/AGENTS.md` — add a note distinguishing external-system integrations (pure I/O) from persistence integrations (DNA-aware); link to `integration/postgres` as the reference for the latter

## 7. Release

- [ ] 7.1 Bump `@dna-codes/dna-core` patch version (§2 — `DnaStore` type addition)
- [ ] 7.2 Bump `@dna-codes/dna-adapters` minor version (new subpaths + new runtime deps)
- [ ] 7.3 Tag and push (pause before this — triggers publish workflow)
- [ ] 7.4 Smoke-test: install bumped packages in a scratch project; call `integration/memory` `save` + `get` round-trip; confirm `DnaStore` type is importable from `@dna-codes/dna-core`
