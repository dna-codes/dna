## Why

Every DNA primitive today has a unique shape with no shared identity contract, making it impossible to store primitives uniformly across data stores (Neo4j, Postgres, document stores) or address them stably across systems. Adding a consistent base-level contract — `id`, `type`, `name`, `version`, `description` — gives every primitive a universal node shape while keeping type-specific fields as queryable node properties, enabling graph-native storage and schema evolution without a `properties` envelope that would break Cypher traversal.

## What Changes

- **BREAKING** All Operational DNA primitives gain four new base-level fields: `id` (UUID, required), `type` (primitive discriminator, required), `version` (semver string, required), and `name` is promoted to a required base-level field (already present on most primitives, enforced uniformly here).
- **BREAKING** `description` is standardized as an optional base-level field across all primitives (it was already present informally; this makes it a declared contract field at the base schema level).
- **NEW** `@dna-codes/dna-schemas` gains a shared `base` JSON Schema (`$defs` or standalone) that all per-primitive schemas extend via `allOf`.
- **NEW** `@dna-codes/dna-core` builders auto-assign `id` (UUID v4) and `type` on `add*` calls when not supplied by the caller; `version` defaults to the current schema version for that primitive.
- **NEW** `@dna-codes/dna-core` queries updated to treat `id`, `type`, `name`, `version` as guaranteed present on every returned primitive.
- The `domain` field that currently appears informally on most primitives is **not** part of the base contract — it becomes a graph relationship (`[:BELONGS_TO]`) in Neo4j consumers; no change to the JSON schema for `domain` in this refactor (deferred to a separate Neo4j adapter change).
- All existing `examples/` JSON documents and the `bookshopInput` fixture are migrated to include the new required base fields.

## Capabilities

### New Capabilities

- `primitive-base-contract`: A universal base schema contract (`id`, `type`, `name`, `version`, `description`) shared by every Operational DNA primitive. Enables uniform storage in any data store, stable UUID-based addressing, and per-primitive schema version tracking. The base contract is enforced at the JSON Schema level via `allOf` composition in every per-primitive schema.

### Modified Capabilities

<!-- None — no existing spec-level behavior changes. The builders, queries, and validator continue to behave as before; this is an additive contract change to the primitive shapes themselves. -->

## Impact

- **`@dna-codes/dna-schemas`**: Every Operational primitive schema (`resource.json`, `operation.json`, `role.json`, etc.) gains three required fields (`id`, `type`, `version`) via a shared base definition. **Breaking** — existing documents without these fields will fail validation.
- **`@dna-codes/dna-core` builders**: Each `add*` function auto-generates `id` (UUID v4) and stamps `type` and `version` when not provided. `createOperationalDna` gains a `version` parameter.
- **`@dna-codes/dna-core` queries**: No logic changes — base fields are now guaranteed present on returned objects, which simplifies consumer type assertions.
- **`@dna-codes/dna-core` types**: `OperationalDNA` and per-primitive TypeScript types gain `id`, `type`, and `version` as required fields.
- **`@dna-codes/dna-core` validator**: Cross-layer checks that resolve by `name` are unaffected; the new base fields are validated by the updated JSON Schemas automatically.
- **All `examples/` documents**: Must be migrated to include the three new required base fields.
- **`bookshopInput` fixture**: Must be migrated.
- **Input adapters (`dna-input-*`)**: Any adapter that constructs raw JSON primitives without using the builders must be updated to emit the base fields. Adapters using builders get this for free.
- **Output adapters (`output/markdown`, `output/mermaid`)**: Read-only traversal; no changes required unless they render the new fields.
- **`@dna-codes/dna-merge`**: Merge identity is currently by `name`; `id` becomes an additional identity signal — same-named primitives from different sources that carry different UUIDs should surface as a conflict. Merge logic update required.
