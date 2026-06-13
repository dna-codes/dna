## Why

The `add-dna-api` change (commit `383a87b`) landed a working GraphQL server that derives its schema from a frozen `OperationalDNA` at startup. The follow-on design conversation made clear that's not the actual product shape. Tenant admins need a runtime-configurable type system — a "schema as data" model — so they can author `ResourceType` and `RelationshipType` records through an admin UI without redeploys. The DNA file becomes a *seed*, not the source of truth; after first boot, storage holds the live type system.

The four foundational DNA noun primitives (Person, Role, Group, Resource) ship as seeded `ResourceType` records that categorize tenant-defined types. A `Loan` is a tenant-authored `ResourceType` with `category: resource`; a `Borrower` is `category: person`. Admins can override, extend, or replace any of the seeds.

Two architectural calls drove this proposal:

- **Path B (dynamic typed GraphQL types, not free-form `JSON`).** Every `ResourceType` produces a typed GraphQL `type` with first-class fields derived from its `attribute_schema`. When admins create or edit a `ResourceType`, the schema regenerates and hot-swaps. This preserves the developer ergonomics of the original dna-api while making the type system editable at runtime.
- **Versioned schemas.** Each `ResourceType.attribute_schema` change creates a new immutable `ResourceTypeVersion`. Existing `Resource` records carry the `schema_version` they were written against. No retroactive backfill — the version stamp is the contract.

The user also asked to bundle the storage-adapter changes into this same proposal (extending `DnaDataStore`, renaming storage labels, adding `seedFromDna`), so this is one cohesive change across three packages.

## What Changes

- **MODIFIED** `@dna-codes/dna-core`'s `DnaDataStore` interface (in `src/types/data-store.ts`):
  - **NEW** `resourceType.{create,get,update,delete,list}` CRUD surface with versioning semantics — each `update` writes a new immutable `ResourceTypeVersion` record and bumps `current_version`.
  - **NEW** `relationshipType.{create,get,update,delete,list}` surface, same versioning shape.
  - **NEW** `seedFromDna(dna)` method — idempotent on first boot (skips already-present types by name).
  - **NEW** record types: `ResourceType`, `ResourceTypeVersion`, `RelationshipType`, `RelationshipTypeVersion`.
  - **MODIFIED** `Resource` and `Relationship` records gain a `schema_version: number` field stamped at write time.
  - `migrate()` no longer seeds from the DNA — its only job is constraint/index creation. Seeding moves to `seedFromDna`.
- **MODIFIED** `@dna-codes/dna-adapters/integration/neo4j`:
  - Implement the new metadata-CRUD methods.
  - **BREAKING** Rename storage labels: `:TypeDefinition` → `:ResourceType`, `:RelationshipDef` → `:RelationshipType`. (Instance node labels — `:Loan`, `:Borrower`, etc. — stay the same.)
  - **NEW** `:ResourceTypeVersion` and `:RelationshipTypeVersion` history nodes; each update creates one and bumps the live type's `current_version`.
  - Cascade-delete: `resourceType.delete(id)` rejects if any `:Resource` of that type exists, unless `cascade: true`.
- **MODIFIED** `@dna-codes/dna-adapters/integration/memory`: same expansion in-memory.
- **MODIFIED** `@dna-codes/dna-api` — fundamental pivot:
  - **NEW** Fixed top-level schema for `ResourceType`, `ResourceTypeVersion` (read-only), `RelationshipType`, `RelationshipTypeVersion` (read-only).
  - **NEW** Dynamic per-type GraphQL types generated from the current `ResourceType` state. Schema regenerates and atomically swaps on every successful `ResourceType` / `RelationshipType` mutation.
  - **NEW** `ajv`-based per-`Resource.data` validation against the `ResourceType.attribute_schema` at the version stamped on the Resource.
  - **NEW** First-boot DNA seeding via `dataStore.seedFromDna(dna)`. Subsequent boots ignore the DNA (still required at the `--dna` flag for the seed path, but warned on data drift).
  - **REMOVED** DNA `Operation`-to-mutation codegen. Operations were domain verbs paired with the frozen-type model; they don't fit the registry-native shape. (They may return as a fifth top-level type in a future proposal.)
- **MODIFIED** Capability specs to reflect the new contract — all delta operations in this proposal use `## ADDED Requirements` since the superseded `add-dna-api` and `add-integration-neo4j-data` changes are still in-flight and not yet archived. Once this proposal lands and those changes are archived together with it, the capability specs that get merged into `openspec/specs/` will reflect the registry-native shape.

**Supersedes**: parts of `add-dna-api` (the schema-codegen modules and resolver shape are rewritten) and parts of `add-integration-neo4j-data` (the storage adapter's metadata story expands). The prior commits stay in history; this proposal is a forward pivot, not a revert.

## Capabilities

### New Capabilities

- `dna-api`: registry-native GraphQL API server. Loads a DNA at startup for first-boot seeding, then serves a runtime-configurable GraphQL schema where `ResourceType` and `RelationshipType` records ARE the type system. Dynamic per-type GraphQL types with hot-swap on schema mutations.
- `dna-api-docker`: unchanged from `add-dna-api` — same Dockerfile, same compose files, same per-org-stack pattern. The package's runtime behavior changes but the container shape does not.
- `integration-neo4j-data`: Neo4j-backed `DnaDataStore` with the expanded contract (resource-type / relationship-type CRUD, versioning, `seedFromDna`).
- `integration-memory-data`: same expansion in-memory.

### Modified Capabilities

<!-- None — prior capability specs from add-dna-api / add-integration-neo4j-data are still in-flight (not in openspec/specs/), so this proposal uses ADDED Requirements throughout and supersedes the earlier changes on archive. -->

## Impact

- **`@dna-codes/dna-core`**: minor bump 0.8.1 → 0.9.0. The `DnaDataStore` interface gains four new method surfaces and four new record types. Existing `instance.*` and `link.*` methods unchanged but gain a `schema_version` field on returned records.
- **`@dna-codes/dna-adapters`**: minor bump 0.8.0 → 0.9.0. Both `integration/neo4j` and `integration/memory` implement the new methods. Storage label rename is **breaking for any consumer that queries Neo4j directly via Cypher** — no such consumer exists yet outside this monorepo, so the impact is internal.
- **`@dna-codes/dna-api`**: minor bump 0.1.0 → 0.2.0. The package's CRUD surface for tenant-defined types stays nearly identical (`createLoan(input)` etc. still works), but the source of truth for which types exist shifts from the DNA file to the storage. New mutations expose `createResourceType` / `updateResourceType` / etc.
- **Unblocks**: tenant admin UIs that need to introspect or mutate the type system at runtime. ServiceNow-style configurable platforms, low-code workflow builders, and any deployment where the type system is end-user content.
- **Documented limitations** carried forward from `add-dna-api`: read-only relationships, no Rule enforcement, no auth, no GraphQL subscriptions, naive pluralization. Added in this proposal: no retroactive schema-evolution backfill (versioning stamps the contract; admins migrate data explicitly via update mutations), no DNA hot-reload (seeds at first boot only).
- **Reference**: `examples/registry/operational.json` is the canonical pattern this proposal codifies into the API layer; `add-dna-api` proposal for the prior frozen-schema design; `add-integration-neo4j-data` proposal for the storage adapter we're extending.
