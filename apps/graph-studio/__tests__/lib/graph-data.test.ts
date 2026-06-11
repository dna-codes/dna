import type { GraphData, GraphNode, GraphEdge } from '../../lib/graph-data'

// Compile-time type test — if these assignments fail to typecheck, tsc catches it
const node: GraphNode = { id: 'domain:acme', type: 'domain', name: 'acme' }
const nodeWithParent: GraphNode = { id: 'group:Case', type: 'group', name: 'Case', parentId: 'domain:marshall' }
const edge: GraphEdge = { id: 'mem:1', source: 'person:Partner', target: 'position:LeadCounsel', type: 'membership' }
const data: GraphData = { nodes: [node, nodeWithParent], edges: [edge] }

describe('GraphData types', () => {
  it('GraphNode accepts all valid resource types', () => {
    const types: GraphNode['type'][] = ['domain', 'process', 'step', 'group', 'position', 'person']
    types.forEach(t => {
      expect(() => {
        const n: GraphNode = { id: `${t}:test`, type: t, name: 'test' }
        void n
      }).not.toThrow()
    })
  })

  it('GraphData holds nodes and edges', () => {
    expect(data.nodes).toHaveLength(2)
    expect(data.edges).toHaveLength(1)
    expect(data.edges[0].type).toBe('membership')
  })

  it('parentId is optional', () => {
    expect(node.parentId).toBeUndefined()
    expect(nodeWithParent.parentId).toBe('domain:marshall')
  })
})
