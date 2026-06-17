#!/usr/bin/env node
/**
 * CLI wrapper for the ecommerce example seed. The graph definition + apply logic
 * live in the app so the CLI and the in-app loader (POST /api/examples) share one
 * source: apps/dna-agent/lib/examples/ecommerce-seed.mjs
 *
 * Usage:  node scripts/seed-ecommerce.mjs [http://localhost:3300]
 *
 * Appends instances, so reset/clear the store first for a clean graph.
 */
import { applyEcommerceSeed } from '../apps/dna-agent/lib/examples/ecommerce-seed.mjs'

const base = (process.argv[2] || process.env.DNA_MCP_BASE || 'http://localhost:3300').replace(/\/mcp$/, '')
console.log('MCP:', base + '/mcp')

applyEcommerceSeed(base, { log: (m) => console.log(m) })
  .then((s) => console.log(`\ndone — App roots: ${s.roots}, tables: ${s.surfaceRecords}, grants: ${s.grants}`))
  .catch((e) => { console.error(e); process.exit(1) })
