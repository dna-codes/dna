/**
 * Pure business→product projection.
 *
 * Walks an evaluated business subgraph by **node type** (a Domain's Processes are
 * the Process-typed nodes adjacent to it, etc. — independent of relationship-type
 * names, so it is robust to whichever vocabulary the graph uses) and derives the
 * product nodes the business implies:
 *
 *   Domain → App        Process → Module     Task → Page     Operation → Component
 *   Domain → Namespace (API)                 Operation → Endpoint (API)
 *
 * Each node carries a stable identity key and a `planned` flag set wherever the
 * forward backing (Domain→Process→Task→Operation→`changes`) is missing. Writes
 * nothing — `apply()` (persistence) is a deferred follow-on.
 */

import type { LensDataResult } from '../lens/types'
import type { ProductLevel, ProductNode, ProductEdge, ProductSubgraph, ProjectOptions } from './types'

const DEFAULT_LEVEL: Record<string, ProductLevel> = {
  domain: 'app',
  process: 'module',
  task: 'page',
  operation: 'component',
}

interface BizNode {
  id: string
  name: string
  type: string
  changes?: unknown
}

export function project(business: LensDataResult, opts: ProjectOptions = {}): ProductSubgraph {
  const byId = new Map<string, BizNode>()
  for (const n of business.nodes) {
    const rec = n as { id: string; name?: unknown; _typeName?: string; changes?: unknown }
    byId.set(rec.id, {
      id: rec.id,
      name: String(rec.name ?? rec.id),
      type: (rec._typeName ?? '').toLowerCase(),
      changes: rec.changes,
    })
  }

  // Undirected adjacency — direction is irrelevant to "is X connected to Y".
  const adj = new Map<string, Set<string>>()
  const connect = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set())
    adj.get(a)!.add(b)
  }
  for (const l of business.links) {
    connect(l.from.id, l.to.id)
    connect(l.to.id, l.from.id)
  }
  const neighborsOfType = (id: string, type: string): BizNode[] =>
    [...(adj.get(id) ?? [])].map(n => byId.get(n)).filter((n): n is BizNode => !!n && n.type === type)

  const nodesByKey = new Map<string, ProductNode>()
  const edges: ProductEdge[] = []
  const key = (realizes: string, level: ProductLevel, parent?: string) => `${level}:${realizes}:${parent ?? 'root'}`
  const levelFor = (id: string, def: ProductLevel): ProductLevel => opts.levelOverrides?.[id] ?? def

  const emit = (node: ProductNode) => { if (!nodesByKey.has(node.key)) nodesByKey.set(node.key, node) }
  const edge = (from: string, to: string, via: ProductEdge['via']) => { edges.push({ from, to, via }) }

  for (const domain of [...byId.values()].filter(n => n.type === 'domain')) {
    const processes = neighborsOfType(domain.id, 'process')
    const appLevel = levelFor(domain.id, DEFAULT_LEVEL.domain)
    const appKey = key(domain.id, appLevel)
    emit({ key: appKey, level: appLevel, name: domain.name, realizes: domain.id, planned: processes.length === 0 })
    edge(appKey, domain.id, 'realized_as')

    // API: one Namespace per Domain, grouping the domain's endpoints.
    const nsKey = key(domain.id, 'namespace')
    emit({ key: nsKey, level: 'namespace', name: domain.name, realizes: domain.id, planned: processes.length === 0 })
    edge(nsKey, domain.id, 'realized_as')

    for (const proc of processes) {
      const tasks = neighborsOfType(proc.id, 'task')
      const modLevel = levelFor(proc.id, DEFAULT_LEVEL.process)
      const modKey = key(proc.id, modLevel, appKey)
      emit({ key: modKey, level: modLevel, name: proc.name, realizes: proc.id, parentKey: appKey, planned: tasks.length === 0 })
      edge(appKey, modKey, 'contains')
      edge(modKey, proc.id, 'realized_as')

      for (const task of tasks) {
        const operations = neighborsOfType(task.id, 'operation')
        const pageLevel = levelFor(task.id, DEFAULT_LEVEL.task)
        const pageKey = key(task.id, pageLevel, modKey)
        emit({ key: pageKey, level: pageLevel, name: task.name, realizes: task.id, parentKey: modKey, planned: operations.length === 0 })
        edge(modKey, pageKey, 'contains')
        edge(pageKey, task.id, 'realized_as')

        for (const op of operations) {
          const hasChanges = Array.isArray(op.changes) && op.changes.length > 0
          const compLevel = levelFor(op.id, DEFAULT_LEVEL.operation)
          const compKey = key(op.id, compLevel, pageKey)
          emit({ key: compKey, level: compLevel, name: op.name, realizes: op.id, parentKey: pageKey, planned: !hasChanges })
          edge(pageKey, compKey, 'contains')
          edge(compKey, op.id, 'realized_as')

          // API: one Endpoint per Operation (deduped — no parent in the key).
          const epKey = key(op.id, 'endpoint')
          emit({ key: epKey, level: 'endpoint', name: op.name, realizes: op.id, parentKey: nsKey, planned: !hasChanges })
          edge(nsKey, epKey, 'contains')
          edge(epKey, op.id, 'exposes')
        }
      }
    }
  }

  return { nodes: [...nodesByKey.values()], edges }
}
