import http from 'http'
import { randomUUID } from 'crypto'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import type { McpServerOptions, SessionMode, PatchOp, PatchResult, PatchError, AuthMiddleware } from './types.js'
import { patchGraphInputShape } from './patch-schema.js'
import { WIDGET_KINDS } from './widgets.js'
import { buildOrgChart } from './lenses/org-chart.js'
import { buildPeoplePositions } from './lenses/people-positions.js'
import { buildReportingChains } from './lenses/reporting-chains.js'
import { buildSpanOfControl } from './lenses/span-of-control.js'
import { buildGraphData } from './lenses/graph-data.js'
import { buildJobDescriptions } from './lenses/job-descriptions.js'
import { buildProcessFlow } from './lenses/process-flow.js'
import { buildPipeline } from './lenses/pipeline.js'
import { buildAccounts } from './lenses/accounts.js'
import { buildTypeRegistryGraph } from './lenses/type-registry.js'
import { buildProductAppPreview } from './lenses/product-app-preview.js'
import type { DnaDataStore } from '@dna-codes/dna-core'

export { McpServerOptions }

const passthroughAuth: AuthMiddleware = (_req, _res, next) => next()

// ── Validation helpers ────────────────────────────────────────────────────────

export async function validatePatchOps(
  ops: PatchOp[],
  store: DnaDataStore,
  mode: SessionMode = 'build',
): Promise<string[]> {
  // Locking is derived from mode: Operate is locked, Build is open.
  const locked = mode === 'operate'
  const violations: string[] = []
  const [rtList, relTypeList] = await Promise.all([
    store.resourceType.list(),
    store.relationshipType.list(),
  ])
  const rtNames = new Set(rtList.map(r => r.name))
  const relNames = new Set(relTypeList.map(r => r.name))

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (locked && (op.op === 'add_resource_type' || op.op === 'add_relationship_type')) {
      violations.push(`op[${i}]: Type registry is locked in Operate mode — switch to Build mode to add or change types.`)
      continue
    }
    if (op.op === 'add_instance') {
      if (!rtNames.has(op.type)) {
        violations.push(`op[${i}]: unknown ResourceType "${op.type}"`)
      }
    } else if (op.op === 'add_link') {
      if (!relNames.has(op.type)) {
        violations.push(`op[${i}]: unknown RelationshipType "${op.type}"`)
      } else {
        const relType = relTypeList.find(r => r.name === op.type)!
        // Resolve from/to instances to check type constraints
        const [fromTypeName, toTypeName] = await Promise.all([
          resolveInstanceTypeName(op.from, store),
          resolveInstanceTypeName(op.to, store),
        ])
        if (fromTypeName && relType.from !== '*' && fromTypeName !== relType.from) {
          violations.push(`op[${i}]: "${op.type}" expects from="${relType.from}" but got "${fromTypeName}"`)
        }
        if (toTypeName && relType.to !== '*' && toTypeName !== relType.to) {
          violations.push(`op[${i}]: "${op.type}" expects to="${relType.to}" but got "${toTypeName}"`)
        }
      }
    } else if (op.op === 'add_resource_type') {
      if (rtNames.has(op.name)) {
        violations.push(`op[${i}]: ResourceType "${op.name}" already exists`)
      }
    } else if (op.op === 'add_relationship_type') {
      if (relNames.has(op.name)) {
        violations.push(`op[${i}]: RelationshipType "${op.name}" already exists`)
      }
      if (!rtNames.has(op.from_type)) {
        violations.push(`op[${i}]: from_type "${op.from_type}" is not a registered ResourceType`)
      }
      if (!rtNames.has(op.to_type)) {
        violations.push(`op[${i}]: to_type "${op.to_type}" is not a registered ResourceType`)
      }
    }
  }
  return violations
}

async function resolveInstanceTypeName(id: string, store: DnaDataStore): Promise<string | null> {
  const rtList = await store.resourceType.list()
  for (const rt of rtList) {
    const inst = await store.instance.get(rt.name, id)
    if (inst) return rt.name
  }
  return null
}

async function applyPatchOps(
  ops: PatchOp[],
  store: DnaDataStore,
): Promise<PatchResult> {
  const ids: Record<number, string> = {}
  let applied = 0

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op.op === 'add_instance') {
      const { id } = await store.instance.create(op.type, { name: op.name, ...op.attributes })
      ids[i] = id
    } else if (op.op === 'remove_instance') {
      await store.instance.delete(op.type, op.id)
    } else if (op.op === 'update_instance') {
      await store.instance.update(op.type, op.id, op.attributes)
    } else if (op.op === 'add_link') {
      const fromTypeName = await resolveInstanceTypeName(op.from, store)
      const toTypeName = await resolveInstanceTypeName(op.to, store)
      if (!fromTypeName || !toTypeName) continue
      const { id } = await store.link.create(
        { typeName: fromTypeName, id: op.from },
        { typeName: toTypeName, id: op.to },
        { role: op.type },
      )
      ids[i] = id
    } else if (op.op === 'remove_link') {
      await store.link.delete(op.id)
    } else if (op.op === 'add_resource_type') {
      const { id } = await store.resourceType.create({
        name: op.name,
        category: op.category,
        description: op.description,
        stability: op.stability ?? 'experimental',
        attribute_schema: op.attribute_schema ?? [],
      })
      ids[i] = id
    } else if (op.op === 'add_relationship_type') {
      const { id } = await store.relationshipType.create({
        name: op.name,
        from: op.from_type,
        to: op.to_type,
        description: op.description,
        stability: op.stability ?? 'experimental',
        cardinality: 'many-to-many',
        attribute: op.name.toLowerCase(),
      })
      ids[i] = id
    }
    applied++
  }

  return { applied, ids }
}

// ── Per-request MCP instance ──────────────────────────────────────────────────
// McpServer allows only one active transport at a time, so we create a fresh
// instance for every HTTP request (stateless mode).

function buildMcpInstance(dataStore: DnaDataStore, mode: SessionMode): McpServer {
  const mcp = new McpServer({ name: 'dna-mcp', version: '0.1.0' })
  registerHandlers(mcp, dataStore, mode)
  return mcp
}

function registerHandlers(mcp: McpServer, dataStore: DnaDataStore, mode: SessionMode): void {
  // ── Resources ──────────────────────────────────────────────────────────────

  mcp.resource(
    'resource-types',
    new ResourceTemplate('dna://schema/resource-types', { list: undefined }),
    async () => {
      const types = await dataStore.resourceType.list()
      return {
        contents: [{ uri: 'dna://schema/resource-types', text: JSON.stringify(types, null, 2), mimeType: 'application/json' }],
      }
    },
  )

  mcp.resource(
    'relationship-types',
    new ResourceTemplate('dna://schema/relationship-types', { list: undefined }),
    async () => {
      const types = await dataStore.relationshipType.list()
      return {
        contents: [{ uri: 'dna://schema/relationship-types', text: JSON.stringify(types, null, 2), mimeType: 'application/json' }],
      }
    },
  )

  // ── Tools ──────────────────────────────────────────────────────────────────

  mcp.tool('get_type_registry', 'Returns all ResourceType and RelationshipType records in one call.', {}, async () => {
    const [resourceTypes, relationshipTypes] = await Promise.all([
      dataStore.resourceType.list(),
      dataStore.relationshipType.list(),
    ])
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ resourceTypes, relationshipTypes }, null, 2) }],
    }
  })

  mcp.tool(
    'query_instances',
    'Find instances filtered by type name and/or name substring.',
    {
      type: z.string().optional().describe('ResourceType name to filter by'),
      nameContains: z.string().optional().describe('Case-insensitive substring to match against instance name'),
      limit: z.number().int().positive().optional().describe('Maximum results to return'),
    },
    async ({ type, nameContains, limit }) => {
      const rtList = type
        ? (await dataStore.resourceType.list()).filter(r => r.name === type)
        : await dataStore.resourceType.list()

      const results: unknown[] = []
      for (const rt of rtList) {
        const instances = await dataStore.instance.list(rt.name)
        for (const inst of instances) {
          const name = String((inst as Record<string, unknown>).name ?? '')
          if (nameContains && !name.toLowerCase().includes(nameContains.toLowerCase())) continue
          results.push({ ...inst, _typeName: rt.name })
          if (limit && results.length >= limit) break
        }
        if (limit && results.length >= limit) break
      }

      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] }
    },
  )

  mcp.tool(
    'get_links',
    'Return links originating from a given instance, optionally filtered by relationship type.',
    {
      fromId: z.string().describe('ID of the source instance'),
      relationshipType: z.string().optional().describe('RelationshipType name to filter by'),
    },
    async ({ fromId, relationshipType }) => {
      const fromTypeName = await resolveInstanceTypeName(fromId, dataStore)
      if (!fromTypeName) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Instance "${fromId}" not found` }) }], isError: true }
      }

      const relTypes = await dataStore.relationshipType.list()
      const matchingRelTypes = relationshipType
        ? relTypes.filter(r => r.name === relationshipType && r.from === fromTypeName)
        : relTypes.filter(r => r.from === fromTypeName)

      const links = await dataStore.link.list({ from: { typeName: fromTypeName, id: fromId } })
      const filtered = matchingRelTypes.length
        ? links.filter(l => matchingRelTypes.some(r => r.from === l.from.typeName && r.to === l.to.typeName))
        : links

      return { content: [{ type: 'text' as const, text: JSON.stringify(filtered, null, 2) }] }
    },
  )

  mcp.tool(
    'get_lens',
    'Run a lens transform over the graph and return the view-model. Supported: org-chart.',
    {
      name: z.string().describe('Lens name (e.g. "org-chart")'),
    },
    async ({ name }) => {
      if (name === 'org-chart') {
        const viewModel = await buildOrgChart(dataStore)
        return { content: [{ type: 'text' as const, text: JSON.stringify(viewModel, null, 2) }] }
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown lens "${name}". Supported: org-chart` }) }],
        isError: true,
      }
    },
  )

  mcp.tool(
    'patch_graph',
    'Validate and apply a list of graph mutation operations atomically.',
    patchGraphInputShape,
    async ({ ops }) => {
      const patchOps = ops as unknown as PatchOp[]
      const violations = await validatePatchOps(patchOps, dataStore, mode)
      if (violations.length > 0) {
        const err: PatchError = { error: 'Patch validation failed', violations }
        return { content: [{ type: 'text' as const, text: JSON.stringify(err) }], isError: true }
      }
      const result = await applyPatchOps(patchOps, dataStore)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  mcp.tool(
    'activate_lens',
    'Switch the right-panel lens tab to the given tab ID. Use when the user asks to see a specific view or after building/querying data that maps to a lens.',
    {
      lensId: z.string().describe('The tab ID to activate (e.g. "org-chart", "pipeline", "job-descriptions")'),
    },
    async () => {
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ok: true }) }] }
    },
  )

  mcp.tool(
    'render_widget',
    'Render an inline UI widget in the chat. Use to surface visual summaries after building or querying the graph.',
    {
      kind: z.enum(['stat-row', 'record-table', 'record-card', 'badge-list']).describe('Widget type'),
      stats: z.array(z.object({
        label: z.string(),
        value: z.string(),
        accent: z.string().optional(),
      })).optional().describe('stat-row: array of stat tiles'),
      columns: z.array(z.string()).optional().describe('record-table: column headers'),
      rows: z.array(z.array(z.string())).optional().describe('record-table: data rows'),
      title: z.string().optional().describe('record-card: card title'),
      subtitle: z.string().optional().describe('record-card: optional subtitle'),
      fields: z.array(z.object({
        label: z.string(),
        value: z.string(),
      })).optional().describe('record-card: label/value field pairs'),
      label: z.string().optional().describe('badge-list: optional section label'),
      items: z.array(z.object({
        text: z.string(),
        variant: z.enum(['neutral', 'success', 'warning']).optional(),
      })).optional().describe('badge-list: badge items'),
    },
    async (input) => {
      const { kind } = input
      if (!WIDGET_KINDS.includes(kind as typeof WIDGET_KINDS[number])) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Unknown widget kind "${kind}"` }) }],
          isError: true,
        }
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify({ ok: true, kind }) }] }
    },
  )

}

// ── Server factory ────────────────────────────────────────────────────────────

export function createMcpServer(options: McpServerOptions): http.Server {
  const { authMiddleware = passthroughAuth } = options

  // Mutable refs — replaced atomically on reset
  const store = { current: options.dataStore }
  const config = {
    pack: options.initialPack ?? 'operational',
    mode: options.initialMode ?? 'build' as SessionMode,
  }

  // Session store: one McpServer + Transport per connected client
  const sessions = new Map<string, StreamableHTTPServerTransport>()

  const server = http.createServer((req, res) => {
    authMiddleware(req, res, async () => {
      // Reset — wipe store and evict all sessions so next request starts fresh
      if (req.method === 'POST' && req.url === '/reset') {
        if (!options.createFreshStore) {
          res.writeHead(501)
          res.end(JSON.stringify({ error: 'Reset not configured' }))
          return
        }
        try {
          let body = ''
          for await (const chunk of req) body += chunk
          const parsed = body ? JSON.parse(body) : {}
          const newPack = parsed.pack ?? config.pack
          const newMode: SessionMode = parsed.mode === 'operate' ? 'operate' : 'build'
          store.current = await options.createFreshStore(newPack)
          config.pack = newPack
          config.mode = newMode
          for (const transport of sessions.values()) {
            await transport.close().catch(() => {})
          }
          sessions.clear()
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify({ ok: true, pack: config.pack, mode: config.mode }))
        } catch (err) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: String(err) }))
        }
        return
      }

      // Session config — read and update pack/mode state
      if (req.method === 'GET' && req.url === '/session-config') {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.writeHead(200)
        res.end(JSON.stringify({ pack: config.pack, mode: config.mode }))
        return
      }
      if (req.method === 'POST' && req.url === '/session-config') {
        try {
          let body = ''
          for await (const chunk of req) body += chunk
          const parsed = JSON.parse(body)
          if (parsed.mode === 'build' || parsed.mode === 'operate') config.mode = parsed.mode
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.writeHead(200)
          res.end(JSON.stringify({ pack: config.pack, mode: config.mode }))
        } catch (err) {
          res.writeHead(400)
          res.end(JSON.stringify({ error: String(err) }))
        }
        return
      }

      // Simple REST endpoints — consumed by the Next.js UI
      if (req.method === 'GET' && req.url?.startsWith('/lens/')) {
        const lensName = req.url.replace('/lens/', '')
        handleLensRequest(lensName, store.current, res)
        return
      }
      if (req.method === 'GET' && req.url === '/graph') {
        handleGraphRequest(store.current, res)
        return
      }

      const sessionId = (req.headers['mcp-session-id'] as string | undefined)

      // Route existing sessions to their persistent transport
      if (sessionId && sessions.has(sessionId)) {
        sessions.get(sessionId)!.handleRequest(req, res).catch(err => {
          res.writeHead(500)
          res.end(JSON.stringify({ error: String(err) }))
        })
        return
      }

      // New session: create McpServer + Transport, connect, then handle
      const mcp = buildMcpInstance(store.current, config.mode)
      const newSessionId = randomUUID()
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          sessions.set(id, transport)
          transport.onclose = () => sessions.delete(id)
        },
      })
      mcp.connect(transport).then(() => transport.handleRequest(req, res)).catch(err => {
        res.writeHead(500)
        res.end(JSON.stringify({ error: String(err) }))
      })
    })
  })

  return server
}

/** The REST lens builders, keyed by URL name. Each maps a store to a JSON view model. */
const LENS_BUILDERS: Record<string, (store: DnaDataStore) => Promise<unknown>> = {
  'org-chart': buildOrgChart,
  'people-positions': buildPeoplePositions,
  'reporting-chains': buildReportingChains,
  'span-of-control': buildSpanOfControl,
  'job-descriptions': buildJobDescriptions,
  'process-flow': buildProcessFlow,
  'pipeline': buildPipeline,
  'accounts': buildAccounts,
  'type-registry': buildTypeRegistryGraph,
  'product-app-preview': buildProductAppPreview,
}

async function handleLensRequest(
  lensName: string,
  dataStore: DnaDataStore,
  res: http.ServerResponse,
): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const builder = LENS_BUILDERS[lensName]
  if (!builder) {
    res.writeHead(404)
    res.end(JSON.stringify({ error: `Unknown lens "${lensName}"` }))
    return
  }

  try {
    // Build (and serialize) the body BEFORE sending headers, so a builder error
    // can return a clean 500 rather than throwing ERR_HTTP_HEADERS_SENT.
    const body = JSON.stringify(await builder(dataStore))
    res.writeHead(200)
    res.end(body)
  } catch (err) {
    console.error(`Lens "${lensName}" failed:`, err)
    res.writeHead(500)
    res.end(JSON.stringify({ error: String(err) }))
  }
}

async function handleGraphRequest(
  dataStore: DnaDataStore,
  res: http.ServerResponse,
): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    res.writeHead(200)
    res.end(JSON.stringify(await buildGraphData(dataStore)))
  } catch (err) {
    res.writeHead(500)
    res.end(JSON.stringify({ error: String(err) }))
  }
}
