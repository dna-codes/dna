## 1. `DnaDataStore` interface extension in `dna-core`

- [x] 1.1 Extend `packages/core/src/types/data-store.ts` with new record types: `NounCategory` (`'person' | 'role' | 'group' | 'resource'`), `AttributeSchema` (loose JSON-Schema-shaped structural type), `ResourceType`, `ResourceTypeVersion`, `RelationshipType`, `RelationshipTypeVersion`, `SeedReport`
- [x] 1.2 Extend `DnaDataStore` interface with `resourceType.{create,get,update,delete,list,versions}` per design.md D1
- [x] 1.3 Extend `DnaDataStore` interface with `relationshipType.{create,get,update,delete,list,versions}` (same shape)
- [x] 1.4 Add `seedFromDna(dna): Promise<SeedReport>` and `hasBeenSeeded(): Promise<boolean>` methods
- [x] 1.5 Add `_schemaVersion: number` to the `InstanceRecord` and `LinkRecord` shapes (return values from `instance.get` and `link.list`); `instance.create`/`update` and `link.create` continue to NOT require the version in the input — it's stamped by the adapter at write time
- [x] 1.6 Export the new types from `packages/core/src/index.ts`
- [x] 1.7 Update the data-store type-test (`packages/core/src/types/data-store.test.ts`) to cover the new method signatures
- [x] 1.8 Bump `@dna-codes/dna-core` to `0.9.0`

## 2. `integration/memory` — metadata CRUD, versioning, seeding

- [x] 2.1 Extend the in-memory client with `resourceType` and `relationshipType` registries — `Map<id, ResourceType>` and a separate `Map<resourceTypeId, ResourceTypeVersion[]>` for history (insertion-order, latest at index 0)
- [x] 2.2 Implement `resourceType.create` — generates UUID, writes the live record with `current_version: 1` and an initial version record; rejects on duplicate `name` with a clear error
- [x] 2.3 Implement `resourceType.update` — bumps `current_version` and appends a new version record; rejects if `name` is changed (`name` is the stable identifier)
- [x] 2.4 Implement `resourceType.get` and `resourceType.list({ category? })`
- [x] 2.5 Implement `resourceType.delete(id, opts)` — rejects with `TypeInUseError` if any `Instance` of that type exists, unless `opts.cascade === true`. With cascade, remove all matching Instances + adjacent Links + the type + its versions in one in-memory pass
- [x] 2.6 Implement `resourceType.versions(id)` — returns history in descending version order
- [x] 2.7 Mirror §2.2–§2.6 for `relationshipType.*`
- [x] 2.8 Implement `seedFromDna(dna)` — writes the four foundational ResourceTypes (`Person`, `Role`, `Group`, `Resource`) with `is_seed: true` and empty `attribute_schema`, then walks `dna.domain.{persons,roles,groups,resources}` and `dna.relationships[]`. Idempotent on `name`. Returns a `SeedReport` summarizing created vs. skipped counts
- [x] 2.9 Add a `seedMarker` field on the in-memory client (boolean) and implement `hasBeenSeeded()`; set the marker after the first successful seed
- [x] 2.10 Stamp `_schemaVersion` on every `instance.create` and `instance.update` from the relevant ResourceType's `current_version`; stamp on every `link.create` from the RelationshipType's `current_version`
- [x] 2.11 Update `instance.create` to also accept Instances whose typeName does NOT have a corresponding ResourceType — write the record but stamp `_schemaVersion: 0` (or document that the typeName must exist; lean toward requiring it, fail fast)
- [x] 2.12 Tests covering every new path: create/get/update/delete for both resourceType and relationshipType, cascade vs non-cascade delete, version history accuracy, seeding idempotency, seed marker behavior, version stamp on Instance writes, same-id-across-types still works
- [x] 2.13 Update the existing `index.test.ts` registry-fixture round-trip to assert ResourceType records are seeded correctly

## 3. `integration/neo4j` — metadata CRUD, label renames, versioning

- [x] 3.1 Update `cypher.ts` constants — `METADATA_SCHEMA_CYPHER` now creates uniqueness constraints on `(:ResourceType.name)`, `(:RelationshipType.name)`, `(:ResourceTypeVersion.id)`, `(:RelationshipTypeVersion.id)`
- [x] 3.2 New Cypher snippets in `cypher.ts`: `CREATE_RESOURCE_TYPE`, `CREATE_RESOURCE_TYPE_VERSION`, `UPDATE_RESOURCE_TYPE`, `GET_RESOURCE_TYPE`, `LIST_RESOURCE_TYPES` (with optional category filter), `DELETE_RESOURCE_TYPE`, `LIST_RESOURCE_TYPE_VERSIONS`; same set for RelationshipType
- [x] 3.3 `client.ts` — implement `resourceType.create` per §2.2 semantics using a single Cypher transaction that writes the `:ResourceType` node, the `:ResourceTypeVersion {version:1}` node, and the `[:VERSION_OF]` edge
- [x] 3.4 `client.ts` — implement `resourceType.update` — opens a transaction, reads current_version, writes a new `:ResourceTypeVersion`, and bumps the live `:ResourceType.current_version`. Mirror for `relationshipType`
- [x] 3.5 `client.ts` — implement `resourceType.delete(id, opts)`:
  - [x] 3.5a Without cascade: `MATCH (rt:ResourceType {id: $id}) MATCH (n) WHERE labels(n) CONTAINS rt.name RETURN count(n) AS inUse`. If `inUse > 0`, reject
  - [x] 3.5b With cascade: `DETACH DELETE` matching Instance nodes by label, then `DETACH DELETE` the `:ResourceType` and its `:ResourceTypeVersion` history
  - [x] 3.5c Drop the per-typename `_id`-uniqueness constraint when the type is deleted (`DROP CONSTRAINT <name>_id_unique IF EXISTS`)
- [x] 3.6 `client.ts` — implement `resourceType.create` side effect of `CREATE CONSTRAINT <typename>_id_unique IF NOT EXISTS FOR (n:<typename>) REQUIRE n._id IS UNIQUE` (label is validated by `validateLabel` from `cypher.ts`)
- [x] 3.7 `client.ts` — implement `resourceType.versions(id)` and `relationshipType.versions(id)`
- [x] 3.8 `client.ts` — implement `seedFromDna(dna)`:
  - [x] 3.8a Write four foundational `:ResourceType` records (`Person`, `Role`, `Group`, `Resource`) with `is_seed: true`
  - [x] 3.8b Walk `dna.domain.{persons,roles,groups,resources}`, MERGE-on-name with a small Cypher snippet that skips if the type already exists (idempotent)
  - [x] 3.8c Walk `dna.relationships[]`, same MERGE-on-name pattern
  - [x] 3.8d Write `:SeedMarker {createdAt: $now, dnaHash: $sha256}` node (the hash supports drift detection)
  - [x] 3.8e Return a `SeedReport` with `created` and `skipped` counts per kind
- [x] 3.9 `client.ts` — implement `hasBeenSeeded()` as `MATCH (m:SeedMarker) RETURN m LIMIT 1`
- [x] 3.10 `client.ts` — `migrate()` now ONLY creates the static metadata constraints (`:ResourceType.name`, `:RelationshipType.name`, `:ResourceTypeVersion.id`, `:RelationshipTypeVersion.id`, the `LINK._id` index). Per-typename Instance constraints are created on `resourceType.create` (not on migrate)
- [x] 3.11 `client.ts` — stamp `_schemaVersion` on every `instance.create` / `instance.update` by reading the live `:ResourceType.current_version` in the same transaction
- [x] 3.12 Update the existing Cypher unit tests (`cypher.test.ts`) — assert new snippets compile, labels are correctly interpolated, version snippets are right
- [x] 3.13 Update the live integration tests (`index.test.ts`) — they're gated on `NEO4J_URI`; add cases for ResourceType CRUD, version history, cascade delete, seed marker behavior. Existing Instance CRUD tests stay; they get a new `_schemaVersion` assertion
- [x] 3.14 README + AGENTS.md updates: rename `:TypeDefinition` → `:ResourceType` everywhere in the docs; document the new CRUD surface and version semantics
- [x] 3.15 Bump `@dna-codes/dna-adapters` to `0.9.0`

## 4. `dna-api` — pivot to registry-native shape

- [x] 4.1 Add `ajv` and `ajv-formats` to `packages/api/package.json#dependencies`
- [x] 4.2 Create `packages/api/src/validation/attribute-schema-to-jsonschema.ts` — translates a `ResourceType.attribute_schema` (DNA-flavored) into a strict JSON Schema for ajv compilation. v1 identity-translates the shape
- [x] 4.3 Create `packages/api/src/validation/validator-cache.ts` — keyed by `(resourceTypeId, version)`; compiles ajv validators on demand; invalidates entries on `ResourceType` update
- [x] 4.4 Create `packages/api/src/schema/registry-types.ts` — fixed top-level GraphQL types for `ResourceType`, `ResourceTypeVersion`, `RelationshipType`, `RelationshipTypeVersion`, plus their `Input` types and `NounCategory` enum
- [x] 4.5 Create `packages/api/src/schema/registry-fields.ts` — top-level Query and Mutation fields for ResourceType and RelationshipType CRUD. Resolvers route through the injected `DnaDataStore`
- [x] 4.6 Update `packages/api/src/schema/types.ts` — instead of walking `dna.domain.*`, walk `dataStore.resourceType.list()` (await-able). Each ResourceType → GraphQL type + input + per-attribute enums. Read the version stamp into a `_schemaVersion: Int!` field
- [x] 4.7 Update `packages/api/src/schema/relationships.ts` — walks `dataStore.relationshipType.list()` instead of `dna.relationships[]`. Same single-vs-list cardinality logic
- [x] 4.8 Update `packages/api/src/schema/crud.ts` — registers per-type CRUD; the resolvers now call into the data store with validation via `validator-cache` before write
- [x] 4.9 Delete `packages/api/src/schema/operations.ts` and its test — DNA Operations are out of scope per D8
- [x] 4.10 Refactor `packages/api/src/schema/index.ts` into a `buildRegistrySchema({ dataStore })` async function that composes registry-types + dynamic per-type fields + CRUD into a single `GraphQLSchema`
- [x] 4.11 Create `packages/api/src/schema/schema-manager.ts` — the in-process `SchemaManager` class per D5. Holds the current schema; `rebuild()` reconstructs it from the data store; exposes `getSchema()` and `onChange(fn)` subscription
- [x] 4.12 Update `packages/api/src/resolvers/instance.ts` — the `create` and `update` resolvers now look up the relevant `ResourceType`, compile/get the validator from the cache, validate input, and call the store with the validated data
- [x] 4.13 Update `packages/api/src/resolvers/relationships.ts` — call `dataStore.relationshipType.get(name)` to determine cardinality at resolve time (in case it changed) — or pass cardinality at codegen time (cleaner). Recommendation: codegen-time pass — the schema rebuild on RelationshipType update ensures the resolver matches the live type
- [x] 4.14 Add registry-CRUD resolvers in a new file `packages/api/src/resolvers/registry.ts`:
  - [x] 4.14a `createResourceType`, `updateResourceType`, `deleteResourceType` (with `cascade` arg)
  - [x] 4.14b `createRelationshipType`, `updateRelationshipType`, `deleteRelationshipType`
  - [x] 4.14c Every successful mutation calls `schemaManager.rebuild()` before returning
- [x] 4.15 Update `packages/api/src/server.ts` — `createServer({ dna, dataStore })` now:
  - [x] 4.15a Calls `dataStore.migrate()` (constraints only)
  - [x] 4.15b Calls `dataStore.hasBeenSeeded()`; if false, calls `dataStore.seedFromDna(dna)`
  - [x] 4.15c Instantiates the `SchemaManager` with `{ dataStore }`; calls `schemaManager.rebuild()` for the initial schema
  - [x] 4.15d Wires `schemaManager.onChange(newSchema)` to swap the Apollo server (D5 — restart pattern: stop + new ApolloServer + start + re-mount expressMiddleware at `/graphql`)
  - [x] 4.15e Mounts `/healthz` (unchanged)
- [x] 4.16 Update `packages/api/src/cli.ts` — minor changes:
  - [x] 4.16a The `--dna` flag is still required (used for the first-boot seed path); on subsequent boots it's read but only used to compute a drift warning
  - [x] 4.16b If `hasBeenSeeded()` returns true AND the DNA file's hash differs from the seed marker's stored hash, log a warning to stderr but continue
- [x] 4.17 Delete the `dna-shapes.ts` types that referenced DNA Resource/Person/etc. directly (those live entirely upstream now); the schema codegen only needs `ResourceType` / `RelationshipType` shapes from `dna-core`
- [x] 4.18 Update `packages/api/src/index.ts` exports to reflect the new public surface
- [x] 4.19 Bump `@dna-codes/dna-api` to `0.2.0`

## 5. Migration script for existing data

- [x] 5.1 Create `packages/api/scripts/migrate-to-registry.ts` — invoked manually once per Neo4j instance to migrate data written by `add-dna-api`:
  - [x] 5.1a Connect via `NEO4J_URI` / `NEO4J_USERNAME` / `NEO4J_PASSWORD` env vars
  - [x] 5.1b Rename labels: `MATCH (n:TypeDefinition) REMOVE n:TypeDefinition SET n:ResourceType, n.current_version = 1, n.is_seed = false`. Same for `:RelationshipDef` → `:RelationshipType`
  - [x] 5.1c For every renamed ResourceType, create a `:ResourceTypeVersion {version: 1, ...}` node + `[:VERSION_OF]` edge using the existing `attribute_schema`. Same for RelationshipType
  - [x] 5.1d Stamp `_schemaVersion: 1` on every existing Instance node (across all per-typename labels) and every `:LINK` edge
  - [x] 5.1e Write a `:SeedMarker` node so subsequent boots skip seeding
  - [x] 5.1f Idempotent — re-running is a no-op once labels are renamed
- [x] 5.2 README runbook: a "Migrating from v0.1.0 to v0.2.0" section in `packages/api/README.md` documenting the script invocation

## 6. Tests

- [x] 6.1 Unit tests for `attribute-schema-to-jsonschema.ts` — identity translation + edge cases
- [x] 6.2 Unit tests for `validator-cache.ts` — caching, invalidation on update
- [x] 6.3 Update `schema/types.test.ts` to work against an in-memory data store rather than a synthetic DNA. Asserts the same mappings hold
- [x] 6.4 Update `schema/relationships.test.ts` similarly
- [x] 6.5 Update `schema/crud.test.ts` — assert per-type CRUD generated correctly from a populated data store
- [x] 6.6 Delete `schema/operations.test.ts`
- [x] 6.7 New `schema/registry-types.test.ts` — assert the fixed top-level types are present and correctly typed
- [x] 6.8 New `schema/registry-fields.test.ts` — assert top-level Query + Mutation fields for ResourceType + RelationshipType CRUD
- [x] 6.9 New `schema/schema-manager.test.ts` — assert rebuild() reflects data-store state, onChange listeners fire, multiple rebuilds compose cleanly
- [x] 6.10 Update `resolvers/instance.test.ts` — assert validation happens before store writes
- [x] 6.11 Update `resolvers/relationships.test.ts` — unchanged semantically
- [x] 6.12 Delete `resolvers/operations.test.ts`
- [x] 6.13 New `resolvers/registry.test.ts` — assert registry-CRUD resolvers call data-store methods and trigger SchemaManager.rebuild()
- [x] 6.14 Update `server.test.ts`:
  - [x] 6.14a First-boot seed flow: empty store → createServer with DNA → migrate + seedFromDna called → introspection reflects seeded types
  - [x] 6.14b Subsequent boot: seeded store → createServer → seedFromDna NOT called
  - [x] 6.14c Schema hot-reload: `createResourceType` mutation → next request sees the new GraphQL type
  - [x] 6.14d Validation: invalid `createLoan` input rejected with clear error
  - [x] 6.14e Health endpoint still returns 200
- [x] 6.15 Update `cli.test.ts`:
  - [x] 6.15a Help text references `--dna` (still required for seed), `--port`, env vars
  - [x] 6.15b Missing DNA exits non-zero
  - [x] 6.15c Missing Neo4j creds exits non-zero

## 7. Documentation

- [x] 7.1 Rewrite `packages/api/README.md`:
  - [x] 7.1a Lead with "DNA seeds the type system; the API serves it" — make clear the runtime-configurable model
  - [x] 7.1b Quick-start carries forward (Docker compose unchanged); add a `createResourceType` GraphQL example
  - [x] 7.1c "How the type system works" section: ResourceType / RelationshipType records, versioning, what the four foundational types are, what `is_seed` means
  - [x] 7.1d v1 limitations (no auth, no Rule enforcement, no retroactive migration, sub-second unavailability during schema hot-reload, no DNA hot-reload)
  - [x] 7.1e Migration runbook for v0.1.0 → v0.2.0 (point at `scripts/migrate-to-registry.ts`)
  - [x] 7.1f Production-out-of-scope notes carry forward
- [x] 7.2 Update `packages/api/AGENTS.md` to reflect the new module layout and the data-store-driven codegen
- [x] 7.3 Update root `README.md` — `dna-api` row mentions "registry-native" rather than "DNA-derived" and notes the runtime-configurable shape
- [x] 7.4 Update `packages/adapters/src/integration/neo4j/README.md` and `AGENTS.md` to reflect the renamed labels and the new metadata-CRUD surface
- [x] 7.5 Update `packages/adapters/src/integration/memory/README.md` and `AGENTS.md` similarly

## 8. Release

- [x] 8.1 Confirm bumps applied: `dna-core@0.9.0`, `dna-adapters@0.9.0`, `dna-api@0.2.0` (actual versions now higher: core@0.11.0, adapters@0.10.0, api@0.3.0 — bumped further since)
- [x] 8.2 Smoke build: `npm run build --workspaces --if-present` succeeds across all four packages
- [x] 8.3 Smoke test: full workspace `npm test` passes (memory tests will cover everything except live Neo4j; that gate continues to skip when `NEO4J_URI` is unset)
- [ ] 8.4 Pause before tagging — confirm with user that release is wanted (STOPPED HERE per user: archive at built & tested, do not release)
- [ ] 8.5 Tag and push (triggers publish workflow)
- [ ] 8.6 Post-release smoke test: install all three bumped packages in a scratch project; run the API CLI against a fixture DNA + `integration/memory`; introspect the schema; verify `createResourceType` works via GraphQL and a new typed type appears in subsequent introspection
