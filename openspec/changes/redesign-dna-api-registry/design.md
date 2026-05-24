## Context

`add-dna-api` shipped a working GraphQL server that treats the `OperationalDNA` document as the source of truth: the DNA's noun primitives become frozen GraphQL types, and changes require a redeploy. The follow-on design conversation surfaced a different product shape — tenant admins need **runtime-configurable types**. They author a "Loan" type, an admin UI surfaces it, instances flow against it. The DNA file becomes a *seed*; storage becomes the source of truth.

Two concrete decisions framed this proposal:

1. **Path B — dynamic typed GraphQL types.** Not free-form `JSON`. Every `ResourceType` produces a typed GraphQL `type` with first-class fields. The schema regenerates and atomically swaps on type mutations. This keeps the ergonomics of `add-dna-api` (introspection works, GraphQL clients see real types) while making the type system editable through the API.
2. **Versioned schemas.** Each `attribute_schema` change creates an immutable `ResourceTypeVersion`. `Resource` records carry the version they were written against. v1 is no-backfill — admins migrate via explicit updates.

The user also asked to **pull the storage-adapter changes into this same proposal**: the `DnaDataStore` interface expands with metadata CRUD, Neo4j and memory adapters implement the new methods, and storage labels rename for clarity.

The current `add-dna-api` work (commit `383a87b`) and `add-integration-neo4j-data` (commit `2e952eb`) stay in git history. This proposal is a forward pivot, not a revert — the server scaffolding, CLI, Docker assets, Apollo wiring, ajv setup, signal handlers, and naming-convention helpers all carry over. The schema-codegen modules and resolver shape change substantially.

## Goals / Non-Goals

**Goals:**

- Tenant admins can `createResourceType`, `updateResourceType`, `deleteResourceType` via the API. Same for `RelationshipType`.
- The GraphQL schema reflects current `ResourceType` state — when a new type is created, its first-class GraphQL `type` and CRUD mutations appear within a request boundary.
- `Resource` and `Relationship` records validate against the `attribute_schema` at the `schema_version` they were written against. Version stamps stay immutable; data writes against the current version unless an explicit override is passed.
- DNA seeding runs at first boot only. Subsequent boots skip seeding (idempotent if invoked) and warn if the DNA file has drifted from the stored seed.
- `DnaDataStore`'s contract expansion is consistent across `integration/neo4j` and `integration/memory`. The memory adapter is the canonical test double; behaviors that pass against memory predict Neo4j.
- The package's container shape (Dockerfile, compose files, env vars) stays the same. Operators don't relearn deployment.

**Non-Goals:**

- Authentication / authorization — `createResourceType` is open in v1. Wiring auth lands in a separate proposal.
- Rule enforcement (`dna.rules[]`). Same deferral as `add-dna-api`.
- Retroactive schema migration. When `attribute_schema` changes, existing `Resource` records keep their `schema_version` and the data the validator accepted at that version. v1 does not rewrite existing rows.
- DNA hot-reload from disk. Schema changes only happen via the API.
- GraphQL subscriptions, federation, persisted queries.
- DNA `Operation` primitives. They were domain verbs in the frozen-type model; the registry-native model doesn't have a direct slot for them. Future proposals can introduce `OperationType` if needed.
- DataLoader / batching. Dynamic schema makes this slightly trickier; queue it after a benchmark.
- Custom scalars (`DateTime`, `JSON`). Strings for now.
- Cross-instance referential integrity beyond per-typename label uniqueness.
- Multi-tenant in a single process. v1 is still one DNA seed per process.

## Decisions

### D1: `ResourceType` and `RelationshipType` as first-class records with versioned history

```ts
// packages/core/src/types/data-store.ts (additions)

export type NounCategory = 'person' | 'role' | 'group' | 'resource'

export interface ResourceType {
  id: string
  name: string                  // PascalCase, e.g. "Loan"
  category: NounCategory        // foundational kind
  current_version: number       // latest version number
  attribute_schema: AttributeSchema  // JSON-Schema-shaped object
  description?: string
  is_seed: boolean              // true iff created by seedFromDna
}

export interface ResourceTypeVersion {
  id: string                    // unique per version
  resource_type_id: string
  version: number               // monotonic per resource_type
  attribute_schema: AttributeSchema
  created_at: string            // ISO-8601
}

export interface RelationshipType {
  id: string
  name: string                  // e.g. "Loan.borrower"
  from: string                  // ResourceType name
  to: string                    // ResourceType name
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
  current_version: number
  attribute_schema?: AttributeSchema  // optional payload on the relationship itself
  description?: string
  is_seed: boolean
}

export interface RelationshipTypeVersion {
  id: string
  relationship_type_id: string
  version: number
  attribute_schema?: AttributeSchema
  created_at: string
}
```

The `attribute_schema` is a strict subset of JSON Schema — enough to describe attribute name + type + required + enum values + reference target. The shape mirrors `dna.domain.resources[].attributes[]` from `@dna-codes/dna-schemas` so seed translation is trivial.

**Why versioned**: schema evolution is real and we can't promise tenant admins "your attribute changes will gracefully migrate every existing record." Stamping a version on every `Resource` write gives the API a tractable contract: "this row validated under version N." Migration tools can layer on top later (read every row, validate against current, prompt admin for fixes). v1 ships the stamp without the tooling.

**Why `is_seed`**: lets the admin UI distinguish foundational seeded types from tenant-authored ones, and lets a `delete` mutation surface a warning. Seed types are not protected — admins can delete them — but the API tells them what they're doing.

### D2: Storage shape — Neo4j labels and edge semantics

Storage labels:

| Concept | Neo4j shape | Notes |
|---|---|---|
| `ResourceType` | `:ResourceType` node | Renamed from `:TypeDefinition` |
| `ResourceTypeVersion` | `:ResourceTypeVersion` node + `[:VERSION_OF]` edge → `:ResourceType` | Append-only, never updated |
| `RelationshipType` | `:RelationshipType` node | Renamed from `:RelationshipDef` |
| `RelationshipTypeVersion` | `:RelationshipTypeVersion` node + `[:VERSION_OF]` edge → `:RelationshipType` | Append-only |
| `Resource` (instance) | per-typename labeled node (`:Loan`, `:Borrower`, …) | Same as `add-integration-neo4j-data`. Carries `_schemaVersion: int` property. |
| `Relationship` (link) | `[:LINK]` edge with `_typeName` + `_schemaVersion` properties | Same edge shape as today; new properties |

**Constraints**:
- `(:ResourceType) REQUIRE name IS UNIQUE`
- `(:RelationshipType) REQUIRE name IS UNIQUE`
- `(:ResourceTypeVersion) REQUIRE id IS UNIQUE`
- Per-typename: `(:Loan) REQUIRE _id IS UNIQUE` (created on demand when a `ResourceType` is created)

**Why labels per typename for instances**: Path B requires the GraphQL schema to expose `type Loan` with first-class fields. The cleanest way to query "all Loans" is `MATCH (n:Loan)`. We could store everything as `:Resource` with a `_typeName` property, but that loses the indexing locality. Keeping per-typename labels means the storage and the GraphQL surface line up.

**Constraint creation on demand**: when `createResourceType` is invoked, the API resolver calls `dataStore.resourceType.create(input)`, which (a) writes the `:ResourceType` and initial `:ResourceTypeVersion` nodes, and (b) creates the `:<TypeName>) REQUIRE _id IS UNIQUE` constraint via Cypher. The constraint creation is idempotent (`IF NOT EXISTS`).

**Cascade-delete**: `resourceType.delete(id, opts)` rejects with a `TypeInUseError` if any `:<TypeName>` Instance node exists, unless `opts.cascade === true`. With cascade, the API deletes all matching Instances first, then the `:ResourceType` and its versions. Same shape for `RelationshipType`.

Resolves Q1 (storage shape) per the proposal brief.

### D3: Versioning semantics

- **Create**: writes the `:ResourceType` node with `current_version: 1` and a `:ResourceTypeVersion {version: 1, ...}` node + `[:VERSION_OF]` edge.
- **Update**: writes a new `:ResourceTypeVersion {version: N+1, ...}` node, bumps `(:ResourceType).current_version` to `N+1`, updates the live node's `attribute_schema` to the new value.
- **Resource writes**: stamp `_schemaVersion: <current_version>` at create / update time. Reads return the stamp on the record.
- **Resource validation on create / update**: validate `data` against the current `attribute_schema`. v1 does NOT validate against historical schemas — if an admin wants the safety, they call `updateResourceType` to bump the version first and then write data against the new shape.
- **Reads**: every `Resource` carries its `_schemaVersion`; clients that care can fetch the specific `ResourceTypeVersion` to see what attribute_schema applied at write time.

Why no retroactive validation: the version stamp tells the truth about what the data accepted when it was written. Forcing existing rows to revalidate against a new schema is the kind of thing that crashes admin UIs at the worst moment. Future proposals can layer migration tools that opt-in to revalidation.

### D4: `seedFromDna` and first-boot detection

`dataStore.seedFromDna(dna): Promise<SeedReport>` translates the DNA into seed records:

- Four foundational `ResourceType` records always created (`Person`, `Role`, `Group`, `Resource`) with `is_seed: true` and an empty `attribute_schema` (no fields). These are the noun-category anchors.
- Each entry in `dna.domain.persons[]` → `ResourceType { category: person, is_seed: true, ... }`. Same for `roles`, `groups`, `resources`.
- Each entry in `dna.relationships[]` → `RelationshipType { is_seed: true, ... }`.

Seeding is **idempotent on name**: if a `ResourceType` with the same `name` already exists, the seeder skips it (does not overwrite). This means re-running the seed against a populated store is safe — it only fills in missing types — but it ALSO means once an admin edits a seeded type, subsequent boots won't reset it.

**First-boot detection**: a sentinel `:SeedMarker` node written at seed time. The CLI's startup flow:

1. Open the data store, call `migrate()` (constraints/indexes only).
2. Check `dataStore.hasBeenSeeded()` → returns true iff `:SeedMarker` exists.
3. If false, load the DNA file and call `dataStore.seedFromDna(dna)`. The adapter writes seed records and then the `:SeedMarker` node.
4. If true, skip seeding. Optionally hash the DNA file and compare against a hash stored on `:SeedMarker` to warn if the file drifted (Q3 — lean: warn only, never refuse to start).

**Why the sentinel** (Q4): "any `:ResourceType` exists" isn't safe — admins could delete every type and we'd re-seed against their intent. A dedicated marker captures "seeded, period" and survives admin actions.

### D5: Schema hot-reload mechanism

`SchemaManager` is the in-process owner of the current `GraphQLSchema`:

```ts
class SchemaManager {
  private current: GraphQLSchema
  private listeners: Set<(schema: GraphQLSchema) => void> = new Set()
  async rebuild(): Promise<void> {
    this.current = await buildRegistrySchema({ dataStore: this.store })
    for (const fn of this.listeners) fn(this.current)
  }
  getSchema(): GraphQLSchema { return this.current }
  onChange(fn): () => void { /* subscribe */ }
}
```

After a successful `createResourceType` / `updateResourceType` / `deleteResourceType` / `createRelationshipType` / etc., the resolver awaits `schemaManager.rebuild()` before returning to the client. The next request observes the new schema.

**Apollo Server v5 integration**: Apollo's `ApolloServer` doesn't expose a clean "swap schema" API. Two pragmatic mechanisms (Q2):

- (a) **Restart pattern**: on rebuild, `apolloServer.stop()` → construct a new `ApolloServer({ schema: newSchema })` → `apolloServer.start()`. Brief unavailability window (sub-second on typical hardware).
- (b) **Express middleware re-mount**: keep the Apollo server instance but re-mount the `expressMiddleware(apolloServer)` at `/graphql` with the new schema-using server. Re-uses the existing HTTP server; slightly more code.

Lean: **(a) for v1**. Type mutations are rare admin operations; sub-second unavailability is acceptable; the code stays simple. The Express app stays up, only the GraphQL middleware bounces. Document the brief window in the README.

In-flight requests started before the swap complete against the prior schema; this is fine because Apollo holds the schema reference for the lifetime of the request, not per-resolver.

### D6: Per-Resource data validation with `ajv`

`Resource.data` is validated by `ajv` against the relevant `ResourceType.attribute_schema`:

- On `createResource`: validate against `ResourceType.current_version`'s schema; stamp `_schemaVersion = current_version` on the new record.
- On `updateResource`: validate against the current schema; stamp `_schemaVersion = current_version` (so updates always migrate the row to the latest version semantically — they don't retain the old version).
- On `readResource`: return `_schemaVersion` alongside the data. No validation on read.

Validator cache: `ajv` compilation is non-trivial. The API caches compiled validators by `(resourceTypeId, version)` and invalidates the cache entry on every successful `updateResourceType`.

The `attribute_schema` is translated to a real JSON-Schema fragment before being passed to ajv. Translation lives in `src/validation/attribute-schema-to-jsonschema.ts` — taking the DNA-flavored shape and emitting strict JSON Schema with `additionalProperties: false`.

### D7: Per-`ResourceType` GraphQL typing

Every `ResourceType` produces:

- A GraphQL `type <Name>` with `id: ID!`, `_schemaVersion: Int!`, and one field per `attribute` (mapped per the same table as `add-dna-api` — string/text → `String`, number → `Float`, etc.).
- A `<Name>Input` input type for create/update.
- Top-level `Query` fields: `<name>(id: ID!): <Name>`, `<name>s: [<Name>!]!`.
- Top-level `Mutation` fields: `create<Name>(input: <Name>Input!): <Name>!`, `update<Name>(id: ID!, input: <Name>Input!): <Name>!`, `delete<Name>(id: ID!): Boolean!`.
- Relationship expansion fields for every `RelationshipType` whose `from` matches this `ResourceType.name`.

The codegen reuses `naming.ts`, the attribute-type mapping table from `packages/api/src/schema/types.ts`, and the resolver factories from `packages/api/src/resolvers/instance.ts` with minor adjustments for the data-validation hook. Pluralization stays naive (`+ s`) with the `Person → persons` override.

If a `ResourceType` has zero attributes, its `<Name>Input` carries only the optional `id: ID` field — same fix from `add-dna-api`.

### D8: `Operation` codegen removed

DNA `Operation` records do not produce GraphQL mutations in v1. The frozen-type rationale (Operations as domain verbs paired with first-class types) doesn't survive the registry-native pivot — Operations would need their own `OperationType` records that admins also CRUD, and their semantics (state-machine enforcement, `changes[]`) are tightly coupled to Rule enforcement which is deferred. Dropping the codegen module entirely is cleaner than keeping a half-finished surface.

Resolves Q7 per the proposal brief.

### D9: Foundational types are deletable but warn

Seeded `ResourceType` records carry `is_seed: true`. The `delete` mutation's resolver:

- If `is_seed === true` AND no `cascade: true` flag, return an error: `Cannot delete seed type "<name>" — pass cascade: true to confirm.`
- If `cascade: true`, proceed (subject to the standard cascade-delete rules around existing Resources).

Tenant-defined types follow the same rules but without the seed-specific framing.

Resolves Q5.

### D10: `ResourceTypeVersion` GraphQL surface

Versions are reachable two ways:

- As a field on `ResourceType`: `versions: [ResourceTypeVersion!]!` (returns history in version order, descending).
- As a top-level query: `resourceTypeVersion(id: ID!): ResourceTypeVersion`.

This mirrors how the Neo4j storage exposes them (a node + a relationship to the live `ResourceType`) — both Cypher and GraphQL queries work the same way.

Resolves Q6.

### D11: Event hooks for schema rebuild

The `SchemaManager.rebuild()` call is wired into the resolvers via a single `onTypeChange` callback exposed by the manager. Resolvers for the four mutating endpoints (`createResourceType`, `updateResourceType`, `deleteResourceType`, `createRelationshipType`, `updateRelationshipType`, `deleteRelationshipType`) await `schemaManager.rebuild()` before returning. No per-mutation hooks — the SchemaManager treats every successful type write as the same event.

Resolves Q8.

## Risks / Trade-offs

- **[Risk]** Schema hot-reload via the Apollo restart pattern causes a brief request window (typically sub-second) where the API returns 5xx. → **Mitigation**: documented in the README; type mutations are rare; clients can retry. If this becomes painful, swap to the Express-middleware re-mount pattern as a follow-on (the SchemaManager abstraction makes the swap a single-file change in `src/server.ts`).
- **[Risk]** `ajv` validator cache grows unbounded if admins frequently bump versions. → **Mitigation**: the cache is bounded by `(resourceTypeId × version)` count; in practice a tenant has dozens of types and a few versions each. Add an LRU bound if a benchmark says we need it.
- **[Risk]** Cascade-delete on a `ResourceType` with thousands of Instances becomes a long transaction. → **Mitigation**: v1 ships a simple unbounded transaction; the README warns operators that cascade-delete on large populations may take time. Batching is a follow-on.
- **[Risk]** Renaming `:TypeDefinition` → `:ResourceType` breaks any consumer that queries Neo4j directly via Cypher. → **Mitigation**: no such consumer exists outside this monorepo; the rename is documented in the release notes. (If we ship a `dna-mcp` or external consumer later, they query through `DnaDataStore`, not raw Cypher.)
- **[Risk]** Versioning means admins can change the GraphQL field shape underneath an existing client without warning. A client that issued `{ loan(id) { interestRate } }` before an admin removed the `interest_rate` attribute would error on next query. → **Mitigation**: GraphQL clients receive a clear "Cannot query field" error. v2 can add a `ResourceTypeVersion` query parameter to retrieve records under a frozen schema view, but v1 ships current-only.
- **[Trade-off]** Path B (dynamic typed GraphQL) is more work than free-form JSON would be. The win is real (typed introspection, generated TS clients, validated mutations) and the architecture supports it. Free-form JSON was the leaner choice; we picked typed deliberately.
- **[Trade-off]** Dropping DNA `Operation` codegen means a regression from `add-dna-api` (you used to get `loanApply` for free; now you don't). The new model wouldn't have surfaced them usefully without state-machine semantics anyway, and they can return as a fifth CRUD surface later if the product needs them.

## Migration Plan

This proposal is additive at the package surface for new tenants and migratable for existing tenants who used `add-dna-api`.

For existing data (anyone running `add-dna-api`):

1. **Stop the API** running on the prior version.
2. **Run a one-shot migration script** (`packages/api/scripts/migrate-to-registry.ts`, shipped with this proposal) that:
   - Renames `:TypeDefinition` labels to `:ResourceType` via `MATCH (n:TypeDefinition) REMOVE n:TypeDefinition SET n:ResourceType, n.current_version = 1`.
   - Same for `:RelationshipDef` → `:RelationshipType`.
   - Creates `:ResourceTypeVersion` history nodes for each renamed type (one each, version 1).
   - Stamps `_schemaVersion: 1` on every existing `:Resource` Instance node and every `:LINK` edge.
   - Writes the `:SeedMarker` node so subsequent boots skip seeding.
3. **Deploy the new API**. It picks up where the old one left off; admins can now CRUD types via the API.

The migration script is a stand-alone Node script invoked once per Neo4j instance; it's idempotent (re-running it is a no-op once the labels are renamed). The README covers the runbook.

For brand-new deployments: no migration. First boot seeds from the DNA as documented.

Rollback: revert the three commits in this proposal. The schema-codegen modules from `add-dna-api` are reachable in `git log`. Existing Neo4j data needs the reverse migration (run a reverse script — also shipped if requested), but for v1 we lean on "v0.2.0 is a forward-only pivot; downgrade requires data reset."

## Open Questions

All eight questions from the proposal brief are resolved in the decisions above:

- **Q1 → D2/D3**: separate `:ResourceTypeVersion` history nodes.
- **Q2 → D5**: Apollo restart pattern for v1.
- **Q3 → D4**: warn on DNA drift, never refuse to start.
- **Q4 → D4**: `:SeedMarker` sentinel node.
- **Q5 → D9**: seeded types deletable with `cascade: true`; warn on attempt.
- **Q6 → D10**: versions reachable both as a field on the parent and as a top-level query.
- **Q7 → D8**: `Operation` codegen removed entirely.
- **Q8 → D11**: single `onTypeChange` callback on the SchemaManager.

One remaining question to confirm during implementation:

- **Q9**: how strictly does the `attribute_schema` JSON-Schema mirror match `@dna-codes/dna-schemas`'s attribute shape? Implementation will keep the surface identical for v1 (same `type` enum, same `required` semantics, same `values` for enums, same `resource` for references). Drift between the two would surface as a translation layer in `src/validation/attribute-schema-to-jsonschema.ts`; for v1, the translation is the identity transform.
