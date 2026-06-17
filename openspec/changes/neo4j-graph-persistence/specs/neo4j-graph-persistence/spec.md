## ADDED Requirements

### Requirement: The MCP server persists its graph in Neo4j when configured

When `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` are set, the MCP server SHALL use the Neo4j adapter as its `DnaDataStore` for all reads and writes, so the graph persists across server restarts. When those variables are absent, the server SHALL use the pure in-memory store as before.

#### Scenario: Graph survives a restart

- **WHEN** instances and links are created against a Neo4j-backed server, the process exits, and a new process starts pointed at the same Neo4j database
- **THEN** the previously created instances and links are present in the new process's store

#### Scenario: In-memory remains the default

- **WHEN** the `NEO4J_*` variables are not set
- **THEN** the server uses a pure in-memory store and connects to no database

### Requirement: Reset clears the Neo4j graph and reseeds, staying on Neo4j

A reset (`createFreshStore(pack)` / `POST /reset`) against a Neo4j-backed server SHALL clear the entire Neo4j graph, re-apply schema migration, reseed the configured pack, and continue serving from Neo4j (not from a substituted in-memory store). The existing dna-agent `POST /api/reset` flow SHALL continue to work unchanged.

#### Scenario: Reset wipes persisted data and reseeds

- **WHEN** a Neo4j-backed graph with user-created instances is reset via `POST /reset`
- **THEN** the Neo4j database afterward contains only the freshly seeded pack, with the user-created instances gone

#### Scenario: Reset keeps serving from Neo4j

- **WHEN** a Neo4j-backed server is reset and the process is then restarted against the same database
- **THEN** the restarted server reads the reseeded pack from Neo4j (the reset did not silently fall back to an in-memory store)

### Requirement: A local Neo4j is available for the dev flow

The repository SHALL provide a turnkey local Neo4j (a docker-compose service on the `neo4j:5.24-community` image with a persistent data volume) and document the matching MCP environment (`NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`) so a developer can run the dna-agent against a persistent graph without provisioning a database by hand.

#### Scenario: Bring up local Neo4j and connect

- **WHEN** a developer starts the documented Neo4j compose service and runs the MCP server with the documented `NEO4J_*` values
- **THEN** the MCP server connects to that Neo4j and persists the graph across restarts
