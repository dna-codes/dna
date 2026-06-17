#!/usr/bin/env node
/**
 * DNA MCP Server standalone entry point.
 *
 * Store selection (by env):
 *   - NEO4J_URI + NEO4J_USERNAME + NEO4J_PASSWORD → Neo4j (persistent). The graph
 *     survives restarts; first boot against an empty database seeds the pack,
 *     and reset clears the database and reseeds (staying on Neo4j).
 *   - otherwise → in-memory (dev default; data resets on restart).
 *
 * Usage:
 *   DNA_MCP_PORT=3300 node dist/bin.js
 */
export {};
//# sourceMappingURL=bin.d.ts.map