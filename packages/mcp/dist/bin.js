#!/usr/bin/env node
"use strict";
/**
 * DNA MCP Server standalone entry point.
 *
 * Reads NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD from env for production.
 * Falls back to in-memory store if Neo4j env vars are absent (dev/test mode).
 *
 * Usage:
 *   DNA_MCP_PORT=3300 node dist/bin.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
const seed_js_1 = require("./packs/seed.js");
async function main() {
    const port = parseInt(process.env.DNA_MCP_PORT ?? '3300', 10);
    const packName = (process.env.DNA_PACK ?? seed_js_1.DEFAULT_PACK);
    let dataStore;
    const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
    if (NEO4J_URI && NEO4J_USERNAME && NEO4J_PASSWORD) {
        const { createClient } = await import('@dna-codes/dna-adapters/integration/neo4j');
        dataStore = createClient({ uri: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD }, { domain: { name: 'agent' }, memberships: [] });
        console.log('DNA MCP Server: using Neo4j at', NEO4J_URI);
    }
    else {
        const { createClient } = await import('@dna-codes/dna-adapters/integration/memory');
        dataStore = createClient();
        await dataStore.migrate();
        await (0, seed_js_1.seedPack)(dataStore, packName);
        console.log('DNA MCP Server: using in-memory store (set NEO4J_* env vars for production)');
    }
    const server = (0, server_js_1.createMcpServer)({
        dataStore,
        initialPack: packName,
        createFreshStore: async (pack) => {
            const { createClient } = await import('@dna-codes/dna-adapters/integration/memory');
            const fresh = createClient();
            await fresh.migrate();
            await (0, seed_js_1.seedPack)(fresh, (pack ?? packName));
            return fresh;
        },
    });
    server.listen(port, () => {
        console.log(`DNA MCP Server listening on http://localhost:${port}`);
        console.log(`  MCP endpoint: http://localhost:${port}/mcp`);
        console.log(`  Lens endpoint: http://localhost:${port}/lens/org-chart`);
    });
}
main().catch(err => {
    console.error('Failed to start DNA MCP Server:', err);
    process.exit(1);
});
//# sourceMappingURL=bin.js.map