> **SUPERSEDED (2026-05-23) by `add-integration-neo4j-data`.** Original scope (Postgres + Neo4j as document/graph stores for the OperationalDNA *descriptor*, Layer A) was rescoped after design discussion to a Neo4j-only Layer B runtime-data store using the registry triad (TypeDefinition / Instance / Link). Postgres is deferred — likely as a CQRS-style projected read model fed from Neo4j, but the design is not committed. `DnaStore` descriptor persistence is also dropped from this line of work; transport wrappers load DNA from a file at startup until a future descriptor-storage proposal lands. This folder is preserved in place for design-history; do not implement.

## Why

The builders and queries give a complete in-memory read/write API over `OperationalDNA`. Without a persistence layer, every transport wrapper (`dna-mcp`, `dna-api`, `dna-cli`) has to invent its own — rolling its own serialization, file I/O, or DB client. That's the same fragmentation problem builders solved on the write side.

Two natural targets cover the primary use cases:

- **Postgres** — document-oriented storage with ACID transactions; the right default for most deployments. DNA documents are stored as JSONB, queryable by ID or name.
- **Neo4j** — graph storage where DNA cross-references become first-class edges. The right choice when traversal across primitives matters: "find all operations reachable by role X," "which processes touch this resource," etc.

Both share a common `DnaStore` interface defined in `dna-core`, so transport wrappers depend on the interface, not the implementation.

## What Changes

- **NEW** `DnaStore` interface in `@dna-codes/dna-core` (`src/types/store.ts`), exported from the package entry point. Defines the contract both integrations implement and that transport wrappers type against.
- **NEW** `@dna-codes/dna-adapters/integration/postgres` — DNA-aware integration. `createClient(opts)` returns a `DnaStore` backed by a single `dna_documents` table with a `JSONB` document column. Includes `client.migrate()` to create the table and indexes.
- **NEW** `@dna-codes/dna-adapters/integration/neo4j` — DNA-aware integration. `createClient(opts)` returns a `DnaStore` backed by a graph where each top-level DNA primitive is a labeled node and string cross-references become typed edges. Includes `client.migrate()` to create constraints and indexes via Cypher.
- **NEW** `@dna-codes/dna-adapters/integration/memory` — in-memory `DnaStore` implementation. Zero dependencies. Used by tests across all transport wrappers that depend on `DnaStore`; ships alongside postgres and neo4j so consumers have a drop-in test double without importing a real DB client.
- **MODIFIED** `@dna-codes/dna-core` — gains `DnaStore` type export. Patch bump.
- **MODIFIED** `@dna-codes/dna-adapters` — gains three new `integration/` subpaths and corresponding `exports` map entries.

**Deliberate exception to the integration "pure I/O" rule:** The existing rule ("integrations MUST NOT take or return DNA shapes on their library API") was written for external-system integrations — Jira, Notion, Google Drive — where DNA translation belongs in a separate input adapter. Postgres and Neo4j are DNA persistence stores; DNA awareness is their entire purpose. Both integrations import `OperationalDNA` and `DnaStore` from `@dna-codes/dna-core`. This exception is documented in both adapters' `AGENTS.md` files.

**Out of scope** (deferred): versioning / history (multiple DNA snapshots per ID), partial updates (save one primitive without replacing the full document), Product-layer / Technical-layer persistence, Neo4j `ProcessStep` as nodes (parked per design decision D5).

## Capabilities

### New Capabilities

- `DnaStore` — shared interface in `dna-core` for any DNA persistence adapter. Transport wrappers depend on this type, not on a concrete implementation.
- `integration/postgres` — persist and retrieve `OperationalDNA` documents in Postgres as JSONB. ACID transactions, `migrate()` for table creation, upsert semantics on `save`.
- `integration/neo4j` — persist and retrieve `OperationalDNA` documents in Neo4j as a property graph. DNA primitives as labeled nodes, cross-references as typed edges, `migrate()` for constraints and indexes.
- `integration/memory` — in-memory `DnaStore` for tests and local development. No external dependencies.

### Modified Capabilities

<!-- None. This is purely additive for all existing consumers. -->

## Impact

- **`@dna-codes/dna-core`**: gains `DnaStore` type. Backwards-compatible. Patch bump.
- **`@dna-codes/dna-adapters`**: gains three new `integration/` subpaths. New runtime dependencies: `pg` (postgres), `neo4j-driver` (neo4j) — scoped to their respective subpaths; consumers who don't import those subpaths install nothing extra.
- **All other packages**: no required changes.
- **Unblocks**: `dna-mcp`, `dna-api`, `dna-cli` — each declares a `DnaStore` dependency and accepts any implementation at construction time; `integration/memory` is their default in tests.
