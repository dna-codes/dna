import type { LensDataResult } from '../lens/types'
import type { ProductNode } from './types'
import { project } from './project'

// ── Synthetic business subgraph builder ─────────────────────────────────────
function node(id: string, type: string, name: string, extra: Record<string, unknown> = {}) {
  return { id, name, _typeName: type, ...extra } as unknown as LensDataResult['nodes'][number]
}
function link(fromId: string, fromType: string, toId: string, toType: string) {
  return { id: `l-${fromId}-${toId}`, from: { typeName: fromType, id: fromId }, to: { typeName: toType, id: toId }, role: 'rel' } as unknown as LensDataResult['links'][number]
}

// Lending domain → {Origination (with 2 tasks→ops), Servicing (no tasks)}.
// op1 has changes (complete); op2 has none (planned component).
function lendingGraph(): LensDataResult {
  return {
    nodes: [
      node('d1', 'Domain', 'Lending'),
      node('p1', 'Process', 'Origination'),
      node('p2', 'Process', 'Servicing'),
      node('t1', 'Task', 'Collect'),
      node('t2', 'Task', 'Review'),
      node('op1', 'Operation', 'Loan.Create', { changes: [{ attribute: 'status', set: 'new' }] }),
      node('op2', 'Operation', 'Loan.Review', {}),
    ],
    links: [
      link('d1', 'Domain', 'p1', 'Process'),
      link('d1', 'Domain', 'p2', 'Process'),
      link('p1', 'Process', 't1', 'Task'),
      link('p1', 'Process', 't2', 'Task'),
      link('t1', 'Task', 'op1', 'Operation'),
      link('t2', 'Task', 'op2', 'Operation'),
    ],
  }
}

const byLevel = (nodes: ProductNode[], level: string) => nodes.filter(n => n.level === level)

describe('project — walk', () => {
  it('derives App→Module→Page→Component with realized_as and contains edges', () => {
    const g = project(lendingGraph())
    expect(byLevel(g.nodes, 'app').map(n => n.realizes)).toEqual(['d1'])
    expect(byLevel(g.nodes, 'module').map(n => n.realizes).sort()).toEqual(['p1', 'p2'])
    expect(byLevel(g.nodes, 'page').map(n => n.realizes).sort()).toEqual(['t1', 't2'])
    expect(byLevel(g.nodes, 'component').map(n => n.realizes).sort()).toEqual(['op1', 'op2'])

    // every UI node has a realized_as edge to its business node
    for (const n of g.nodes.filter(n => n.level !== 'namespace' && n.level !== 'endpoint')) {
      expect(g.edges.some(e => e.via === 'realized_as' && e.from === n.key && e.to === n.realizes)).toBe(true)
    }
    // App contains the two Modules
    const appKey = byLevel(g.nodes, 'app')[0].key
    const containsFromApp = g.edges.filter(e => e.via === 'contains' && e.from === appKey)
    expect(containsFromApp).toHaveLength(2)
  })
})

describe('project — determinism', () => {
  it('yields the same node-key set on repeated runs', () => {
    const a = project(lendingGraph()).nodes.map(n => n.key).sort()
    const b = project(lendingGraph()).nodes.map(n => n.key).sort()
    expect(a).toEqual(b)
  })
})

describe('project — level override', () => {
  it('emits an overridden Process at the chosen level', () => {
    const g = project(lendingGraph(), { levelOverrides: { p1: 'page' } })
    expect(g.nodes.find(n => n.realizes === 'p1' && n.level === 'page')).toBeDefined()
    expect(g.nodes.find(n => n.realizes === 'p1' && n.level === 'module')).toBeUndefined()
  })
})

describe('project — completeness', () => {
  it('marks a module planned when its process has no tasks', () => {
    const g = project(lendingGraph())
    const servicing = g.nodes.find(n => n.realizes === 'p2' && n.level === 'module')!
    expect(servicing.planned).toBe(true)
    const origination = g.nodes.find(n => n.realizes === 'p1' && n.level === 'module')!
    expect(origination.planned).toBe(false)
  })

  it('marks a component planned when its operation declares no changes', () => {
    const g = project(lendingGraph())
    expect(g.nodes.find(n => n.realizes === 'op2' && n.level === 'component')!.planned).toBe(true)
    expect(g.nodes.find(n => n.realizes === 'op1' && n.level === 'component')!.planned).toBe(false)
  })
})

describe('project — API surface', () => {
  it('emits one Namespace per domain containing one Endpoint per operation', () => {
    const g = project(lendingGraph())
    const ns = byLevel(g.nodes, 'namespace')
    expect(ns.map(n => n.realizes)).toEqual(['d1'])
    const endpoints = byLevel(g.nodes, 'endpoint')
    expect(endpoints.map(n => n.realizes).sort()).toEqual(['op1', 'op2'])
    // each endpoint exposes its operation and is contained by the namespace
    for (const ep of endpoints) {
      expect(g.edges.some(e => e.via === 'exposes' && e.from === ep.key && e.to === ep.realizes)).toBe(true)
      expect(g.edges.some(e => e.via === 'contains' && e.from === ns[0].key && e.to === ep.key)).toBe(true)
    }
  })

  it('dedupes an endpoint when its operation is reached via two tasks', () => {
    const graph = lendingGraph()
    graph.nodes.push(node('t3', 'Task', 'Reprocess') as never)
    graph.links.push(link('p1', 'Process', 't3', 'Task') as never)
    graph.links.push(link('t3', 'Task', 'op1', 'Operation') as never) // op1 reached via t1 and t3
    const g = project(graph)
    expect(byLevel(g.nodes, 'endpoint').filter(n => n.realizes === 'op1')).toHaveLength(1)
  })
})
