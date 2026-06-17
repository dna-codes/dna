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

import { createMcpServer } from './server.js'
import { seedPack, DEFAULT_PACK } from './packs/seed.js'
import type { PackName } from './packs/index.js'
import { seedProductTypes } from '@dna-codes/dna-core'
import type { DnaDataStore } from '@dna-codes/dna-core'
import type { Neo4jStore } from '@dna-codes/dna-adapters/integration/neo4j'

async function main() {
  const port = parseInt(process.env.DNA_MCP_PORT ?? '3300', 10)
  const packName = (process.env.DNA_PACK ?? DEFAULT_PACK) as PackName

  const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env

  // Kept in scope so reset can reuse the same Neo4j client (clear in place)
  // rather than opening a new driver each time.
  let neo4jStore: Neo4jStore | null = null
  let dataStore: DnaDataStore

  if (NEO4J_URI && NEO4J_USERNAME && NEO4J_PASSWORD) {
    const { createClient } = await import('@dna-codes/dna-adapters/integration/neo4j')
    neo4jStore = createClient(
      { uri: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD },
      { domain: { name: 'agent' }, memberships: [] },
    )
    await neo4jStore.migrate()
    // First boot against an empty database → seed the pack. If the database
    // already holds a graph, keep it — that is the point of persistence.
    if ((await neo4jStore.resourceType.list()).length === 0) {
      await seedPack(neo4jStore, packName)
    }
    // Always ensure the product UI/API types exist (idempotent) so authored
    // product graphs can be created and the App Preview can render them.
    await seedProductTypes(neo4jStore)
    dataStore = neo4jStore
    console.log('DNA MCP Server: using Neo4j at', NEO4J_URI, '(persistent)')
  } else {
    const { createClient } = await import('@dna-codes/dna-adapters/integration/memory')
    dataStore = createClient()
    await dataStore.migrate()
    await seedPack(dataStore, packName)
    await seedProductTypes(dataStore)
    console.log('DNA MCP Server: using in-memory store (set NEO4J_* env vars for persistence)')
  }

  const server = createMcpServer({
    dataStore,
    initialPack: packName,
    createFreshStore: async (pack) => {
      const resolvedPack = (pack ?? packName) as PackName
      // Neo4j: clear the persisted graph in place and reseed, staying on Neo4j.
      if (neo4jStore) {
        await neo4jStore.clear()
        await neo4jStore.migrate()
        await seedPack(neo4jStore, resolvedPack)
        await seedProductTypes(neo4jStore)
        return neo4jStore
      }
      // In-memory: a fresh seeded store.
      const { createClient } = await import('@dna-codes/dna-adapters/integration/memory')
      const fresh = createClient()
      await fresh.migrate()
      await seedPack(fresh, resolvedPack)
      await seedProductTypes(fresh)
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
