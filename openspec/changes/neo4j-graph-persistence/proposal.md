## Why

The dna-agent MCP server's dev mode keeps the whole graph **in memory** — every restart loses the company DNA the user built. A real datastore solves this without a bespoke file format, and the **Neo4j adapter already exists** and is already selected by `bin.ts` when `NEO4J_*` is set. Two gaps stop it from being a usable persistence story: **reset is broken for Neo4j** (`createFreshStore` always returns a *new in-memory* store, silently dropping Neo4j and never clearing the database), and there's **no turnkey local Neo4j** for the agent dev flow. This change makes Neo4j the persistence path that survives restarts *and* still resets cleanly.

## What Changes

- Add a **full-graph clear** to the Neo4j adapter: wipe all nodes, relationships, type metadata, and the seed marker so the database returns to empty, then it can be re-migrated and reseeded.
- Fix the MCP server's reset so a Neo4j-backed server **stays on Neo4j**: `createFreshStore(pack)` clears the Neo4j graph, re-runs `migrate()`, and reseeds the pack against a Neo4j store — instead of swapping in an in-memory store. The existing `POST /reset` / dna-agent `POST /api/reset` flow is otherwise unchanged.
- Provide **turnkey local Neo4j** for the agent dev flow: a docker-compose service (reusing the `neo4j:5.24-community` image already used by `packages/api`) plus documented `NEO4J_URI/USERNAME/PASSWORD` wiring, so the user can bring up Neo4j and point the MCP server at it.
- Precedence in `bin.ts` is unchanged: `NEO4J_*` selects Neo4j (now with working reset); absent it, pure in-memory remains the default.

## Capabilities

### New Capabilities
- `neo4j-graph-persistence`: Neo4j as the MCP server's persistence path for the dna-agent — graph survives restarts, reset clears and reseeds the Neo4j database (staying on Neo4j), with a turnkey local Neo4j dev setup.

### Modified Capabilities
- `integration-neo4j-data`: The Neo4j adapter gains a **clear/reset** operation that wipes the entire graph (nodes, relationships, type metadata, seed marker), the primitive the reset flow builds on.

## Impact

- **`@dna-codes/dna-adapters`** (`integration/neo4j`) — add a graph-clear operation (e.g. `clearGraph(store)` / a `reset()` capability) that runs `MATCH (n) DETACH DELETE n`, drops the seed marker, and leaves constraints intact (re-`migrate()` is idempotent). Additive.
- **`@dna-codes/dna-mcp`** — rewrite `bin.ts` `createFreshStore` so that when `NEO4J_*` is configured it clears + re-migrates + reseeds a Neo4j store; the in-memory branch is unchanged.
- **Local dev** — a docker-compose Neo4j service for the agent flow and README/`.env.example` docs (the dna-agent `.env.example` already lists the `NEO4J_*` vars, commented).
- **No change** to the `DnaDataStore` contract, the pure in-memory default, the Neo4j read/write Cypher, or the HTTP reset API surface.
