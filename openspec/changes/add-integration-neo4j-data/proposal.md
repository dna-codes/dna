## Why

Transport wrappers (`dna-mcp`, `dna-api`, `dna-cli`) and DNA-driven applications need a place to persist the *runtime data* described by an `OperationalDNA` — actual Loan records, Borrower records, the Links between them. Today there is no such adapter; every consumer would invent its own. A graph database with a registry-style storage shape (TypeDefinition / Instance / Link, as demonstrated by `examples/registry`) lets us absorb arbitrary DNA-defined domains without per-domain schema work — the user's type system is data, not DDL.

This change supersedes `add-integration-postgres-neo4j`. That proposal targeted descriptor storage (Layer A — "where does the `OperationalDNA` document live"). After design discussion we rescoped to runtime data (Layer B — "where do rows of the *things* the DNA describes live"), narrowed to Neo4j only, and committed to the registry triad as the storage shape. Postgres is deferred — the likely future story is a CQRS-style projected read model with generated per-Resource tables, fed from Neo4j, but the design is not committed and is out of scope here. Descriptor persistence is also deferred — transport wrappers load DNA from a file at startup until a future proposal addresses it.

## What Changes

- **NEW** `@dna-codes/dna-adapters/integration/neo4j` — runtime-data store backed by Neo4j. `createClient(opts, dna)` returns a client whose stored shape is the registry triad: TypeDefinitions seeded from the DNA's noun primitives, Instances as labeled nodes for runtime records, Links as the typed connections between them. Ships `client.migrate()` for constraints/indexes and seeding TypeDefinitions; per-Instance CRUD and Link CRUD on the client surface.
- **NEW** `@dna-codes/dna-adapters/integration/memory` — zero-dep in-memory implementation of the same runtime-data interface. The recommended test double for any package that depends on the interface, and the local-development substitute when Neo4j is unavailable.
- **NEW** shared runtime-data interface (`DnaDataStore` or equivalent — exact name and home decided in design.md Q1). Both adapters implement it; transport wrappers depend on the interface, not a concrete implementation.
- **MODIFIED** `@dna-codes/dna-adapters` — gains two new `integration/` subpaths and corresponding `exports` map entries. New runtime dep `neo4j-driver` scoped to the `neo4j` subpath only; the `memory` subpath has no new dependencies.
- **MODIFIED** `@dna-codes/dna-core` — only modified if Q1 (interface location) lands on "shared interface in core". Otherwise untouched.

**Deliberate exception to the integration "pure I/O" rule:** The existing rule ("integrations MUST NOT take or return DNA shapes on their library API") was written for external-system integrations — Jira, Notion, Google Drive — where DNA translation belongs in a separate input adapter. The Neo4j and memory adapters here are DNA-aware storage by design: they take an `OperationalDNA` at construction time to know the type system. This exception mirrors the one carved out for the superseded postgres-neo4j proposal and is documented in both adapters' `AGENTS.md` files.

**Out of scope** (deferred): Postgres adapter (any layer); `DnaStore` descriptor persistence interface; two-way sync between stores; storage of the DNA document itself as graph nodes (the descriptor is *input* to `migrate()`, not data stored by this adapter); `ProcessStep` as nodes (same rationale as the superseded proposal's D5); custom Cypher query passthrough (structured methods only in v1); per-Resource projected read-model tables in Postgres.

## Capabilities

### New Capabilities

- `integration-neo4j-data`: Neo4j-backed runtime-data store using the registry triad — TypeDefinitions seeded from the DNA's noun primitives, Instances as runtime records, Links as typed connections. Schema-flex without DDL.
- `integration-memory-data`: in-memory implementation of the same runtime-data interface. Zero dependencies. Default test double for any consumer depending on the interface.

### Modified Capabilities

<!-- None. This is purely additive. The superseded `add-integration-postgres-neo4j` change introduced no specs (its `specs/` was never written), so there is nothing to modify. -->

## Impact

- **`@dna-codes/dna-adapters`**: gains two new `integration/` subpaths. New runtime dep `neo4j-driver` scoped to the `neo4j` subpath only — consumers who don't import that subpath install nothing extra. Minor version bump.
- **`@dna-codes/dna-core`**: untouched unless design.md Q1 lands on "shared interface in core" — in which case a patch bump adds the interface type export, fully backwards-compatible.
- **All other packages**: no required changes.
- **Unblocks**: transport wrappers (`dna-mcp`, `dna-api`, `dna-cli`) and any DNA-driven application can adopt a runtime-data store with one constructor call; `integration/memory` is the default in their tests.
- **Reference**: `examples/registry/operational.json` and `examples/registry/README.md` document the triad semantics in DNA terms. The *shape* of stored data mirrors that example; the adapter is not hard-coded to a registry-named domain.
