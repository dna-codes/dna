## 1. `DnaDataStore` interface in `dna-core`

- [x] 1.1 Create `packages/core/src/types/data-store.ts` with the `DnaDataStore` interface (D1 in design.md) covering `migrate`, `instance.{create,get,update,delete,list}`, `link.{create,delete,list}`, and `close`
- [x] 1.2 Export `DnaDataStore` (and any related option/result types) from `packages/core/src/index.ts`
- [x] 1.3 Add a type-level test confirming the interface signatures (e.g., `tsd` or a `// @ts-expect-error` table) so future changes break the type tests rather than landing silently
- [x] 1.4 Bump `@dna-codes/dna-core` patch version

## 2. `integration/memory`

- [x] 2.1 Create `packages/adapters/src/integration/memory/` with `index.ts`, `client.ts`, `types.ts`
- [x] 2.2 Implement `createClient(dna): DnaDataStore`:
  - [x] 2.2a Internal state: `Map<string, Map<string, Record<string, unknown>>>` keyed by `typeName → id → data`; flat `Array<LinkRecord>` for Links; sets for TypeDefinitions and RelationshipDefs
  - [x] 2.2b `migrate()` seeds TypeDefinition entries from `dna.domain.resources/persons/roles/groups` and RelationshipDef entries from `dna.relationships[]`; idempotent
  - [x] 2.2c `instance.create(typeName, data)` — hybrid ID per D4 (use `data.id` if present, generate UUIDv4 otherwise); throw on collision with same `(typeName, id)`
  - [x] 2.2d `instance.get(typeName, id)` — return stored record or `null`
  - [x] 2.2e `instance.update(typeName, id, patch)` — shallow-merge; throw on missing
  - [x] 2.2f `instance.delete(typeName, id)` — no-throw on missing (idempotent)
  - [x] 2.2g `instance.list(typeName)` — return array of `{ id, ...data }`
  - [x] 2.2h `link.create(from, to, opts?)` — generate `_id` per D4 if not provided; throw on collision
  - [x] 2.2i `link.delete(linkId)` — remove from internal list
  - [x] 2.2j `link.list(filter?)` — filter by any combination of `from`, `to`, `role`
  - [x] 2.2k `close()` — no-op for memory; returns resolved Promise
- [x] 2.3 Tests (Jest, in-process):
  - [x] 2.3a Create-then-get round-trips
  - [x] 2.3b List returns all Instances of a type
  - [x] 2.3c Same `id` across two types does NOT collide
  - [x] 2.3d Update applies patch as shallow merge
  - [x] 2.3e Delete removes; subsequent get returns `null`
  - [x] 2.3f Link create + list by `from`, `to`, `role` filter combinations
  - [x] 2.3g Link delete removes from `link.list()`
  - [x] 2.3h Caller-provided ID collision throws
  - [x] 2.3i Adapter-generated ID matches UUIDv4 regex
  - [x] 2.3j `migrate()` is idempotent
  - [x] 2.3k Round-trip an Instance + Link sequence drawn from `examples/registry/operational.json`
- [x] 2.4 Add `./integration/memory` to `packages/adapters/package.json#exports`
- [x] 2.5 Write `packages/adapters/src/integration/memory/README.md` — minimal example + statement that this is the recommended test double for `DnaDataStore` consumers (per the spec requirement)
- [x] 2.6 Write `packages/adapters/src/integration/memory/AGENTS.md` — note the DNA-awareness exception (takes DNA at construction) and the test-double role

## 3. `integration/neo4j`

- [x] 3.1 Create `packages/adapters/src/integration/neo4j/` directory with `index.ts`, `client.ts`, `types.ts`, `cypher.ts` (Cypher snippets isolated for testability)
- [x] 3.2 `types.ts` — `Neo4jClientOptions` (`uri`, `username`, `password`, optional `database`)
- [x] 3.3 Implement `createClient(opts, dna): DnaDataStore`:
  - [x] 3.3a Construct a `neo4j.driver(opts.uri, neo4j.auth.basic(opts.username, opts.password))` and reuse one session per operation (or pool, per `neo4j-driver` defaults)
  - [x] 3.3b `migrate()`:
    - [x] 3.3b.i Create `UNIQUE` constraint on `(:TypeDefinition) REQUIRE name`
    - [x] 3.3b.ii Create `UNIQUE` constraint on `(:RelationshipDef) REQUIRE name`
    - [x] 3.3b.iii For each distinct noun-primitive label declared in `dna.domain.{resources,persons,roles,groups}`, create `UNIQUE` constraint on `(:Label) REQUIRE _id` and index on `(:Label) ON _typeName`
    - [x] 3.3b.iv Create index on `()-[:LINK]-() ON _id`
    - [x] 3.3b.v `MERGE` one `:TypeDefinition {name, category, attributes, createdAt}` node per Resource/Person/Role/Group
    - [x] 3.3b.vi `MERGE` one `:RelationshipDef {name, from, to, cardinality, attribute, inverse?}` node per entry in `dna.relationships[]`
    - [x] 3.3b.vii All operations wrapped to ensure idempotency (use `CREATE CONSTRAINT IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `MERGE` on the metadata nodes)
  - [x] 3.3c `instance.create(typeName, data)`:
    - [x] 3.3c.i Resolve `_id` per D4
    - [x] 3.3c.ii `CREATE (n:<typeName> {_id, _typeName, _createdAt, _updatedAt, ...data})` — catch unique-constraint violation and rethrow with a clear collision error
  - [x] 3.3d `instance.get(typeName, id)` — `MATCH (n:<typeName> {_id: $id}) RETURN n`; strip reserved props; return `null` on miss
  - [x] 3.3e `instance.update(typeName, id, patch)` — `MATCH (n:<typeName> {_id: $id}) SET n += $patch, n._updatedAt = $now`; throw on missing match
  - [x] 3.3f `instance.delete(typeName, id)` — `MATCH (n:<typeName> {_id: $id}) DETACH DELETE n`
  - [x] 3.3g `instance.list(typeName)` — `MATCH (n:<typeName>) RETURN n`; strip reserved props per record
  - [x] 3.3h `link.create(from, to, opts?)`:
    - [x] 3.3h.i Resolve `_id` per D4
    - [x] 3.3h.ii `MATCH (a:<from.typeName> {_id: $fromId}), (b:<to.typeName> {_id: $toId}) CREATE (a)-[r:LINK {_id, role?, attributes?, createdAt}]->(b)`
    - [x] 3.3h.iii `attributes` MUST be serialized as a JSON string property (Neo4j cannot store nested maps as edge properties)
  - [x] 3.3i `link.delete(linkId)` — `MATCH ()-[r:LINK {_id: $linkId}]->() DELETE r`
  - [x] 3.3j `link.list(filter?)` — compose Cypher per the supplied filter; deserialize `attributes` JSON on the way out
  - [x] 3.3k `close()` — call `driver.close()`
- [x] 3.4 `cli.ts` — implement commands per spec (D6):
  - [x] 3.4a `migrate` — load DNA, call `client.migrate()`
  - [x] 3.4b `instance:create --type <typeName> --in <jsonFile> --dna <dnaFile>` — `DnaValidator` first, then call
  - [x] 3.4c `instance:get --type <typeName> --id <id> --dna <dnaFile>` — print JSON
  - [x] 3.4d `instance:update --type <typeName> --id <id> --in <patchFile> --dna <dnaFile>` — validate, then call
  - [x] 3.4e `instance:delete --type <typeName> --id <id> --dna <dnaFile>`
  - [x] 3.4f `instance:list --type <typeName> --dna <dnaFile>` — print JSON array
  - [x] 3.4g `link:create --from-type --from-id --to-type --to-id [--role] [--attributes <jsonFile>] --dna <dnaFile>` — validate `attributes` payload, then call
  - [x] 3.4h `link:delete --id <linkId> --dna <dnaFile>`
  - [x] 3.4i `link:list [--from-type --from-id] [--to-type --to-id] [--role] --dna <dnaFile>` — print JSON array
  - [x] 3.4j Each command exits non-zero with a clear message when any of `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` is unset
- [x] 3.5 Tests (gated on `NEO4J_URI` env var; skip cleanly when unset):
  - [x] 3.5a `migrate()` is idempotent (run twice, assert constraint/index/node counts unchanged)
  - [x] 3.5b Instance node carries the type name as its label (verify via `MATCH (n:Loan {_id: $id})` after a create)
  - [x] 3.5c Same memory-adapter CRUD test suite runs against Neo4j with identical assertions (parameterize the test runner over `{ memory, neo4j }`)
  - [x] 3.5d Round-trip the `examples/registry` fixture: seed TypeDefinitions via `migrate()`, create Instances of each Resource/Person/Role/Group declared, create Links between them, assert `instance.list` and `link.list` reproduce the inserted records
  - [x] 3.5e Same round-trip for the `examples/lending` fixture
  - [x] 3.5f Link `attributes` payload survives the JSON-serialize-and-back round-trip
  - [x] 3.5g CLI command exits non-zero when `NEO4J_URI` is unset (in-process command test or subprocess assertion)
- [x] 3.6 Add `./integration/neo4j` to `packages/adapters/package.json#exports`
- [x] 3.7 Add `neo4j-driver` to `packages/adapters/package.json#dependencies` (verify it does not appear in builds that don't import the subpath)
- [x] 3.8 Write `packages/adapters/src/integration/neo4j/README.md` — credentials env vars, `migrate()` usage, validation contract (caller's responsibility in the library; CLI validates), Link storage shape (edge form), `ProcessStep`-not-nodes limitation
- [x] 3.9 Write `packages/adapters/src/integration/neo4j/AGENTS.md` — DNA-awareness exception, contrast with external-system integrations

## 4. Documentation

- [x] 4.1 Update root `README.md` — add `integration/neo4j` and `integration/memory` rows to the Adapters table; brief note that this is the runtime-data store (Layer B), not descriptor storage
- [x] 4.2 Update `packages/adapters/src/integration/example/AGENTS.md` — extend the pure-I/O vs DNA-aware integration note to cover the new `neo4j` and `memory` cases
- [x] 4.3 Update `packages/ingest/AGENTS.md` — note that runtime-data integrations are a DNA-aware exception alongside any future persistence integrations

## 5. Release

- [x] 5.1 Bump `@dna-codes/dna-core` patch (§1 — `DnaDataStore` type addition)
- [x] 5.2 Bump `@dna-codes/dna-adapters` minor (new subpaths + new runtime dep)
- [ ] 5.3 Pause before tagging — confirm with user that release is wanted
- [ ] 5.4 Tag and push (triggers publish workflow)
- [ ] 5.5 Smoke test: install bumped packages in a scratch project; round-trip an Instance via the memory adapter; confirm `DnaDataStore` type is importable from `@dna-codes/dna-core`
