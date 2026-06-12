#!/usr/bin/env node
/**
 * DNA MCP Server standalone entry point.
 *
 * Reads NEO4J_URI / NEO4J_USERNAME / NEO4J_PASSWORD from env for production.
 * Falls back to in-memory store if Neo4j env vars are absent (dev/test mode).
 *
 * Usage:
 *   DNA_MCP_PORT=3300 node dist/bin.js
 */

import { createMcpServer } from './server.js'
import { seedPack, DEFAULT_PACK } from './packs/seed.js'
import type { PackName } from './packs/index.js'

async function main() {
  const port = parseInt(process.env.DNA_MCP_PORT ?? '3300', 10)
  const packName = (process.env.DNA_PACK ?? DEFAULT_PACK) as PackName

  let dataStore: import('@dna-codes/dna-core').DnaDataStore

  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env
  if (NEO4J_URI && NEO4J_USERNAME && NEO4J_PASSWORD) {
    const { createClient } = await import('@dna-codes/dna-adapters/integration/neo4j')
    dataStore = createClient({ uri: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD }, { domain: { name: 'agent' }, memberships: [] })
    console.log('DNA MCP Server: using Neo4j at', NEO4J_URI)
  } else {
    const { createClient } = await import('@dna-codes/dna-adapters/integration/memory')
    dataStore = createClient()
    await dataStore.migrate()
    await seedPack(dataStore, packName)
    console.log('DNA MCP Server: using in-memory store (set NEO4J_* env vars for production)')
  }

  const server = createMcpServer({
    dataStore,
    initialPack: packName,
    createFreshStore: async (pack) => {
      const { createClient } = await import('@dna-codes/dna-adapters/integration/memory')
      const fresh = createClient()
      await fresh.migrate()
      await seedPack(fresh, (pack ?? packName) as PackName)
      return fresh
    },
  })
  server.listen(port, () => {
    console.log(`DNA MCP Server listening on http://localhost:${port}`)
    console.log(`  MCP endpoint: http://localhost:${port}/mcp`)
    console.log(`  Lens endpoint: http://localhost:${port}/lens/org-chart`)
  })
}

main().catch(err => {
  console.error('Failed to start DNA MCP Server:', err)
  process.exit(1)
})
