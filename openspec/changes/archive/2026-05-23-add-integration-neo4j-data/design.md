## Context

This change replaces the superseded `add-integration-postgres-neo4j` proposal. That proposal targeted *descriptor storage* (Layer A — "where does the `OperationalDNA` document live"). After design discussion we rescoped to *runtime data* (Layer B — "where do rows of the *things* the DNA describes live"), narrowed to Neo4j only, and committed to the registry triad as the storage shape.

The registry triad is documented in `examples/registry/operational.json` and `examples/registry/README.md`. Three Resources — `TypeDefinition`, `Instance`, `Link` — express a generic config-vs-instance pattern in DNA's own primitives: TypeDefinitions are class/template records, Instances are runtime records validated against a TypeDefinition, Links are typed connections between Instances. The pattern absorbs arbitrary user-defined type systems without schema additions to DNA itself.

A graph database is the right home for this pattern because the "type system as data" property maps naturally onto labeled nodes and typed edges, and because schema evolution is free — adding a new TypeDefinition is a write, not a DDL change. A future projected read model in Postgres (CQRS-style, with generated per-Resource tables fed from Neo4j) is anticipated but deferred to a separate proposal.

The two implementations in this change — Neo4j and an in-memory variant — share one interface. The memory adapter exists primarily as a test double for transport wrappers (`dna-mcp`, `dna-api`, `dna-cli`) and as a local-development substitute when Neo4j is unavailable.

## Goals / Non-Goals

**Goals:**

- One shared runtime-data interface (`DnaDataStore`, name pending Q1) covering: client construction with an `OperationalDNA`, `migrate()` to seed type metadata, per-Instance CRUD scoped by `typeName`, Link CRUD with `from`/`to`/`role`/`attributes`, simple Link queries.
- `integration/neo4j` — backed by `neo4j-driver`. Stores Instances as labeled nodes (label = Resource/Person/Role/Group name), Links as typed edges between Instance nodes carrying `role` and `attributes` properties. `migrate()` seeds TypeDefinition nodes from the DNA's noun primitives and creates uniqueness constraints/indexes; idempotent.
- `integration/memory` — backed by in-memory maps. Zero dependencies. Implements the same interface; the recommended test double.
- Each integration ships a `cli.ts` following the existing convention (`migrate`, instance CRUD, link CRUD), with env-driven credentials.
- Round-trip tests cover the full CRUD + Link surface against the `examples/registry` and `examples/lending` fixtures.

**Non-Goals:**

- Postgres adapter, in any form. The eventual CQRS projection is acknowledged but not scoped.
- `DnaStore` descriptor-persistence interface. Transport wrappers load `OperationalDNA` from a file at startup; a future proposal can introduce descriptor persistence as a separate contract.
- Two-way sync between stores.
- Storing the DNA document itself as graph nodes. The DNA is *input* to `migrate()`, not data stored by the adapter.
- `ProcessStep` as nodes (same rationale as the superseded proposal's D5 — YAGNI).
- Custom Cypher query passthrough. The adapter exposes structured methods only in v1; consumers needing raw Cypher can drop down to `neo4j-driver` themselves.
- Validating that `data` payloads conform to the relevant Resource's attribute schema in the library API (see D3).
- Schema-evolution semantics for TypeDefinitions. If the DNA changes between `migrate()` calls, the adapter updates TypeDefinition properties but does not migrate existing Instance data. Reprojection is the caller's responsibility.

## Decisions

### D1: Shared interface (`DnaDataStore`) lives in `@dna-codes/dna-core`

```ts
// packages/core/src/types/data-store.ts
export interface DnaDataStore {
  migrate(): Promise<void>
  instance: {
    create(typeName: string, data: Record<string, unknown> & { id?: string }): Promise<{ id: string }>
    get(typeName: string, id: string): Promise<Record<string, unknown> | null>
    update(typeName: string, id: string, patch: Record<string, unknown>): Promise<void>
    delete(typeName: string, id: string): Promise<void>
    list(typeName: string): Promise<Array<{ id: string } & Record<string, unknown>>>
  }
  link: {
    create(from: { typeName: string; id: string }, to: { typeName: string; id: string }, opts?: { role?: string; attributes?: Record<string, unknown> }): Promise<{ id: string }>
    delete(linkId: string): Promise<void>
    list(filter?: { from?: { typeName: string; id: string }; to?: { typeName: string; id: string }; role?: string }): Promise<Array<{ id: string; from: { typeName: string; id: string }; to: { typeName: string; id: string }; role?: string; attributes?: Record<string, unknown> }>>
  }
  close(): Promise<void>
}
```

**Why `dna-core`**: `DnaDataStore` depends on `OperationalDNA` at construction time (via `createClient(opts, dna)`), and transport wrappers will depend on the interface, not on a concrete implementation. `dna-core` already exports shared adapter contracts (`ParseResult`, `Style`, etc.); this is the same kind of contract. Putting it in `dna-adapters` would force `dna-mcp`/`dna-api`/`dna-cli` to depend on the adapters package just for the type.

**Why not `dna-adapters`**: `dna-adapters` is for concrete implementations of contracts owned by other packages. The contract belongs upstream.

**Alternative considered**: keep the interface in `dna-adapters` until a non-adapters consumer arrives. Rejected because transport-wrapper work is the next obvious thing, and pulling the interface into `dna-core` later would be a churn-y reshuffle.

### D2: Storage shape — Instances as labeled nodes, Links as typed edges

Instances become labeled Neo4j nodes:

- **Label** = the Resource/Person/Role/Group name from the DNA (e.g., `:Loan`, `:Borrower`).
- **Properties** = the `data` payload, flattened. Reserved props: `_id` (the Instance ID), `_typeName` (redundant with label, kept for explicit queries), `_createdAt`, `_updatedAt`.
- **Constraint**: `(:Label) REQUIRE _id IS UNIQUE` per type label.
- **Index**: `(:Label) ON _typeName` for type-scoped scans.

TypeDefinition metadata becomes its own labeled nodes:

- `:TypeDefinition` nodes carry `name`, `category` (`resource | person | role | group`), `attributes` (the attribute schema serialized as JSON), `createdAt`.
- One node per Resource/Person/Role/Group declared in the DNA.
- Constraint: `(:TypeDefinition) REQUIRE name IS UNIQUE`.

Relationship metadata (`dna.relationships[]`) becomes its own labeled nodes:

- `:RelationshipDef` nodes carry `name`, `from`, `to`, `cardinality`, `attribute`, `inverse?`.
- Constraint: `(:RelationshipDef) REQUIRE name IS UNIQUE`.
- These are reference-only in v1 — the adapter does not enforce that Link creation respects them. Validation against RelationshipDefs is a future concern.

Links between Instances are stored as edges:

```cypher
(from:Instance)-[:LINK {_id, role, attributes, createdAt}]->(to:Instance)
```

- One edge per Link. `_id` is the Link ID (caller-provided or adapter-generated UUID).
- `role` is optional; absent for plain references, present for role assignments (matching the registry example's `Link.role`).
- `attributes` is an optional serialized JSON property for role-specific metadata.
- Index: `()-[:LINK]-() ON _id` to support O(1) `link.delete(linkId)`.

**Why edge form for Links instead of intermediate node**: Neo4j edges are first-class, can carry properties, and require one fewer hop per query. The registry example *models* Link as a Resource (a node) because DNA's primitive system has no edge primitive — it's a DNA modeling concession, not a storage requirement. The Neo4j adapter is free to use the database's native edge primitive while preserving the same semantics.

**Trade-off**: edge form makes "list all Links with their attributes irrespective of endpoints" slightly less natural (a relationship scan vs. a node scan). The `link.list(filter)` method covers the common query shapes; full Link-table semantics would push us toward the node form.

**Parked alternative**: intermediate-node form `(:Instance)-[:LINK_FROM]->(:Link)-[:LINK_TO]->(:Instance)`. If a future use case demands Links with their own queryable many-to-many metadata at scale, this can be promoted. Tracked as a known future option, not v1.

### D3: Validation contract — library trusts caller; CLI validates

The library API does not validate `data` payloads against the relevant Resource's attribute schema. Callers who want validation invoke `DnaValidator` (or equivalent) from `dna-core` themselves before calling `instance.create` / `instance.update`. The CLI (`cli.ts`) validates before every write.

**Why**: Same rationale as the superseded proposal's Q2. The library is a thin persistence layer; validation is `dna-core`'s job. Building validation into every write would force callers who already validated (in transport-wrapper request handlers, for example) to pay the cost twice. The CLI is the composition layer and is the right place for "validate then write" defaults.

**Trade-off**: a buggy library caller can write malformed Instance data into Neo4j. Mitigated by documenting the contract clearly in both READMEs.

### D4: Instance and Link IDs — hybrid (caller-provided or adapter-generated UUIDv4)

`instance.create(typeName, data)`:
- If `data.id` is present, use it (the adapter MUST throw on collision with an existing Instance of the same type).
- If absent, the adapter generates a UUIDv4 and writes it to the `_id` property.
- Either way, the create response includes the resolved `id`.

Same contract for `link.create` (caller-provided ID via an `opts.id` field, or adapter-generated).

**Why hybrid**: matches the registry example (every Instance has an explicit `id` attribute), supports callers that already manage IDs upstream, but doesn't force callers who don't care about IDs to call `crypto.randomUUID()` themselves.

**Alternative considered**: caller-always-provides. Rejected as friction for transport-wrapper use cases that just want to insert a row.

### D5: `migrate()` is idempotent and seeds metadata only

`migrate()` performs:
1. Create node-uniqueness constraints (`:TypeDefinition`, `:RelationshipDef`, and one constraint per noun-primitive label in the DNA).
2. Create indexes (`:Label ON _typeName` per label; `LINK ON _id`).
3. `MERGE` one `:TypeDefinition` node per Resource/Person/Role/Group in the DNA.
4. `MERGE` one `:RelationshipDef` node per entry in `dna.relationships[]`.

`migrate()` does NOT touch Instance data. If the DNA changes between `migrate()` calls (e.g., a Resource attribute is renamed), the new schema is reflected in `:TypeDefinition` properties but existing Instances retain their old `data` shape. Data migration (rewriting Instance props to match a new attribute schema) is out of scope; if needed, callers reproject by listing Instances, transforming, and updating.

**Why metadata-only**: data migrations are domain-specific and require choices (e.g., default values for newly-required attributes) the adapter has no way to make.

### D6: CLI per integration — `migrate`, instance/link CRUD

`cli.ts` follows the existing `integration/jira/cli.ts` pattern:

- Commands: `migrate`, `instance:create`, `instance:get`, `instance:update`, `instance:delete`, `instance:list`, `link:create`, `link:delete`, `link:list`.
- Inputs: JSON via `--in <file>` for `data` payloads; flags for `--type`, `--id`, etc.
- Credentials (Neo4j only): `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` env vars. No flags.
- DNA loaded from `--dna <file>` (path to a JSON `OperationalDNA` document).
- `instance:create` / `instance:update` / `link:create` validate `data` / `attributes` via `DnaValidator` before calling the library API.

### D7: Memory adapter mirrors Neo4j semantics, not just shape

The memory adapter is not just "a Map<string, unknown>" — it implements the same per-type-label uniqueness, the same `migrate()` seeding (memoized in-process), and the same Link edge semantics (stored as a flat list of edge records). This means tests written against the memory adapter exercise the same behaviors that the Neo4j adapter promises, modulo network and persistence.

**Why this matters**: transport-wrapper tests that use the memory adapter as a stand-in MUST be representative. If memory diverges in shape from Neo4j, tests pass against memory but fail against Neo4j in CI — the exact failure mode the registry example was designed to prevent.

### D8: Sequencing

1. `DnaDataStore` interface lands in `dna-core` + patch bump.
2. `integration/memory` lands first (no external deps; proves the interface).
3. `integration/neo4j` lands next.

Steps 2 and 3 can share a single `dna-adapters` minor bump.

## Risks / Trade-offs

- **[Risk]** The memory and Neo4j adapters drift in semantics over time, so tests pass against memory and fail against Neo4j. → **Mitigation**: shared test fixtures (`examples/registry`, `examples/lending`) run against both adapters via the same test suite, parameterized by adapter. The Neo4j run is gated on `NEO4J_URI` but the assertions are identical.
- **[Risk]** Link edge form precludes "list all Links" without scanning every node. → **Mitigation**: the v1 `link.list(filter)` covers the common cases (filter by `from`, `to`, or `role`); unfiltered global Link scans are not part of the v1 contract. If they become needed, promote Links to intermediate nodes (a follow-on change, not a breaking one for callers who use `link.list` with filters).
- **[Risk]** The library trusting callers on validation means malformed Instance data can land in Neo4j. → **Mitigation**: the CLI validates by default; library callers who skip validation own that risk; the README documents this clearly.
- **[Trade-off]** Adapter generates Instance/Link IDs by default. Callers who depend on knowing the ID before insert (e.g., to write Links in the same transaction) MUST pass `id` explicitly. Trade-off accepted: simpler default path for transport-wrapper callers who don't manage IDs themselves.
- **[Trade-off]** `migrate()` does not migrate Instance data on attribute-schema changes. Domain-specific data migration is the caller's job. This is consistent with how every other adapter in the repo treats schema evolution.

## Migration Plan

This is purely additive — no existing code is broken.

1. Land the `DnaDataStore` type in `@dna-codes/dna-core` (patch bump).
2. Land `integration/memory` in `@dna-codes/dna-adapters` (minor bump, no new runtime deps).
3. Land `integration/neo4j` in the same `@dna-codes/dna-adapters` minor bump (adds `neo4j-driver` runtime dep, scoped to the subpath).
4. Tag and push; the publish workflow handles release.
5. Smoke test: install bumped packages in a scratch project; round-trip an Instance via the memory adapter; confirm `DnaDataStore` is importable from `@dna-codes/dna-core`.

Rollback: revert the two bumps. No data migration concerns because no consumers depend on the new subpaths yet.

## Open Questions

All four open questions from the proposal brief are resolved in the decisions above:

- **Q1** → D1: interface lives in `@dna-codes/dna-core`.
- **Q2** → D3: library trusts caller; CLI validates.
- **Q3** → D2: Links stored as typed edges with properties; intermediate-node form parked as a follow-on if a future use case demands it.
- **Q4** → D4: hybrid IDs — caller-provided if present, adapter-generated UUIDv4 otherwise.

No remaining open questions blocking implementation.
