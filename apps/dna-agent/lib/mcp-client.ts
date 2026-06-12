import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

let _client: Client | null = null
let _connecting: Promise<Client> | null = null

async function connect(mcpUrl: string): Promise<Client> {
  const client = new Client({ name: 'dna-agent', version: '0.1.0' })
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl))
  await client.connect(transport)
  return client
}

export async function getMcpClient(): Promise<Client> {
  const mcpUrl = process.env.DNA_MCP_URL
  if (!mcpUrl) throw new Error('DNA_MCP_URL not configured')

  // Return existing healthy connection
  if (_client) return _client

  // Deduplicate concurrent connect attempts
  if (_connecting) return _connecting

  _connecting = connect(mcpUrl).then(client => {
    _client = client
    _connecting = null
    return client
  }).catch(err => {
    _connecting = null
    throw err
  })

  return _connecting
}

export function invalidateMcpClient() {
  _client = null
}
