## 1. Neo4j adapter: clear the graph

- [x] 1.1 Added `CLEAR_GRAPH_CYPHER` (`MATCH (n) DETACH DELETE n`) and a `clear()` method on the Neo4j store (deletes all nodes incl. type metadata, instances, the `:SeedMarker`, and their relationships); constraints survive. Exposed a `Neo4jStore` type (`DnaDataStore` + `clear()`) from `integration/neo4j`.
- [x] 1.2 Post-clear state verified: `hasBeenSeeded()` is false and type/instance/link listings are empty; re-`migrate()` + reseed works.

## 2. MCP bin: Neo4j-aware reset

- [x] 2.1 Refactored `bin.ts`: a single `main()` picks the store by env, keeps the Neo4j client in scope; first boot against an empty Neo4j DB seeds the pack, an existing graph is kept.
- [x] 2.2 `createFreshStore(pack)` for Neo4j **reuses** the existing client — `clear()` → `migrate()` → `seedPack` → returns the Neo4j store (not in-memory). In-memory branch unchanged.

## 3. Local Neo4j dev setup

- [x] 3.1 Reused the existing `packages/api/docker-compose.yml` `neo4j` service (`neo4j:5.24-community`, persistent `/data` volume, Bolt `7687`); documented `docker compose -f packages/api/docker-compose.yml up -d neo4j` rather than duplicating a compose file.
- [x] 3.2 Documented the MCP env (`NEO4J_URI`/`USERNAME`/`PASSWORD`) and run flow in the dna-mcp and dna-agent READMEs; updated the dna-agent `.env.example` (note + `devpassword`).

## 4. Tests & docs

- [x] 4.1 `cypher.test.ts` asserts `CLEAR_GRAPH_CYPHER`; `index.test.ts` adds a gated live test (`describeNeo4j`) that seeds, clears (empty + `hasBeenSeeded()` false), and re-migrate+reseeds.
- [x] 4.2 Reset semantics documented as destructive (wipes the DB, reseeds, stays on Neo4j) in the dna-mcp/dna-agent READMEs; the "returns a Neo4j store, not in-memory" behavior is covered by the live `clear()` test + the `bin.ts` reuse path.
