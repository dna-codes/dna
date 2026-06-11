import type { DnaDataStore } from '@dna-codes/dna-core'

let _client: DnaDataStore | null = null

export function getDb(): DnaDataStore | null {
  const uri = process.env.NEO4J_URI
  const username = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !username || !password) return null

  if (!_client) {
    // Lazy require to avoid loading neo4j-driver unless env vars are set
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@dna-codes/dna-adapters/integration/neo4j')
    // Pass an empty DNA shell; the real DNA is loaded per-request
    _client = createClient({ uri, username, password }, { domain: { name: 'studio' }, memberships: [] })
  }

  return _client
}
