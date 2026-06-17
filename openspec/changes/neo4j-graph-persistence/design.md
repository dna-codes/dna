## Context

`createMcpServer` takes `options.dataStore` and a `options.createFreshStore(pack)` factory used by `POST /reset`. `bin.ts` picks the store: when `NEO4J_URI/USERNAME/PASSWORD` are set it builds a Neo4j `DnaDataStore` (`createClient(opts)` → `migrate()`), else a fresh in-memory adapter seeded with the pack.

The Neo4j adapter (`integration/neo4j/client.ts`) already implements the full `DnaDataStore` contract: `migrate()` creates constraints, `seedFromDna()` writes seed records behind a `:SeedMarker` sentinel, type/instance/link CRUD run Cypher, and per-type delete uses `MATCH (n:<Type>) DETACH DELETE n`. What it lacks is a **whole-graph clear**. `packages/api/docker-compose.yml` already runs `neo4j:5.24-community` (auth `neo4j/devpassword`), and the dna-agent `.env.example` already lists the (commented) `NEO4J_*` vars.

The bug: `bin.ts`'s `createFreshStore` *always* returns a new in-memory store. So resetting a Neo4j-backed server abandons Neo4j (the next requests hit a volatile in-memory store) and never clears the database — the Neo4j data is still there on restart, stale.

## Goals / Non-Goals

**Goals:**
- Graph survives MCP-server restarts via Neo4j (already true for reads/writes once `NEO4J_*` is set).
- Reset clears the Neo4j graph and reseeds the pack, **staying on Neo4j**.
- A turnkey local Neo4j for the agent dev flow (compose + documented env).
- In-memory remains the zero-config default; the `DnaDataStore` contract is unchanged.

**Non-Goals:**
- Dropping Neo4j constraints/indexes on reset (re-`migrate()` is idempotent; keep them).
- Multi-database / per-session isolation, auth hardening, or production ops guidance.
- Changing the HTTP `/reset` API or the dna-agent reset flow.
- Migrating existing Neo4j data between schema versions.

## Decisions

### Decision: add a graph-clear operation to the Neo4j adapter, exposed for the reset flow

Add an exported `clearGraph(store)` (or a `reset()` method on the Neo4j store) that, in one transaction where possible, runs `MATCH (n) DETACH DELETE n` — removing all nodes (type-metadata nodes, instance nodes, the `:SeedMarker`) and their relationships. Constraints/indexes are schema, not data, so they survive; a follow-up `migrate()` is idempotent. After clear, the caller re-`migrate()`s and reseeds.

*Alternative considered:* iterate registered types and `DETACH DELETE` per label (the existing per-type-delete pattern). Rejected — it misses untyped/marker nodes and is slower; a single `MATCH (n) DETACH DELETE n` is the standard full wipe and is correct because the MCP server owns the whole database.

*Alternative considered:* drop and recreate the Neo4j database. Rejected — requires admin/`system` database access and the Enterprise multi-db feature; `DETACH DELETE` works on Community.

### Decision: `createFreshStore` clears + reseeds Neo4j when `NEO4J_*` is set

`bin.ts` gains a single `buildStore()` that both the initial `dataStore` and `createFreshStore` use:
- `NEO4J_*` set → a Neo4j store. `createFreshStore(pack)` reuses (or recreates) the Neo4j client, calls `clearGraph`, `migrate()`, then `seedPack(store, pack)`, and returns the Neo4j store.
- else → the current in-memory path (fresh `createClient()` → `migrate()` → `seedPack`), unchanged.

So reset wipes the actual database and the server keeps using Neo4j. Reusing one client across resets avoids leaking drivers; if a new client is created, the old one is `close()`d.

### Decision: turnkey local Neo4j reuses the existing image/credentials

Provide a compose service (or document reusing `packages/api/docker-compose.yml`'s `neo4j`) on `neo4j:5.24-community` with `neo4j/devpassword`, exposing `7687` (Bolt) and `7474` (browser), with a named volume for `/data` so the graph persists across `docker compose` restarts. Document the matching MCP env: `NEO4J_URI=bolt://localhost:7687`, `NEO4J_USERNAME=neo4j`, `NEO4J_PASSWORD=devpassword`. The dna-agent already proxies to the MCP server, so it needs no new env.

## Risks / Trade-offs

- **`MATCH (n) DETACH DELETE n` on a very large graph** can be heavy/long → fine at dev scale; if needed later, batch with `CALL { … } IN TRANSACTIONS`. Documented, not implemented now.
- **Reset is destructive and irreversible** (the whole Neo4j graph is wiped) → that is the intended semantics; the data volume persists across normal restarts, only `/reset` clears it.
- **Connecting to a Neo4j that is still starting** (compose healthcheck race) → document `depends_on: condition: service_healthy` (already used by the api compose) and a clear connection-error message at MCP startup.
- **Driver lifecycle across resets** → reuse one client (preferred) or `close()` the previous before replacing, to avoid connection leaks.

## Resolved Questions

- **Reset client lifecycle** → `createFreshStore` **reuses** the existing Neo4j client and clears in place (`clearGraph` → `migrate()` → `seedPack`). Simplest, no driver/connection leak.
- **Local Neo4j location** → **reuse** the existing `packages/api/docker-compose.yml` `neo4j` service (image `neo4j:5.24-community`, `neo4j/devpassword`, persistent volume); docs point at it rather than duplicating a second compose file.
