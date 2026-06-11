import { fromResourceGraph } from '../../lib/lenses/responsibility-map/fromResourceGraph'
import type { ResourceGraph } from '../../lib/resource-graph'

const fixture: ResourceGraph = {
  name: 'test',
  resources: [
    { id: 'company:co',   type: 'company',    name: 'Acme'         },
    { id: 'dept:eng',     type: 'department', name: 'Engineering'  },
    { id: 'dept:ops',     type: 'department', name: 'Operations'   },
    { id: 'position:mgr', type: 'position',   name: 'Manager'      },
    { id: 'position:dev', type: 'position',   name: 'Developer'    },
    { id: 'step:s1',      type: 'step',       name: 'Step 1'       },
    { id: 'step:s2',      type: 'step',       name: 'Step 2'       },
    { id: 'step:s3',      type: 'step',       name: 'Step 3'       },
  ],
  relationships: [
    { id: 'r1', type: 'belongs_to',  from: 'dept:eng',     to: 'company:co'    },
    { id: 'r2', type: 'belongs_to',  from: 'position:mgr', to: 'dept:eng'      },
    { id: 'r3', type: 'belongs_to',  from: 'position:dev', to: 'dept:eng'      },
    { id: 'r4', type: 'assigned_to', from: 'step:s1',      to: 'position:mgr'  },
    { id: 'r5', type: 'assigned_to', from: 'step:s2',      to: 'position:dev'  },
    // step:s3 unassigned
  ],
}

describe('responsibility-map fromResourceGraph', () => {
  it('includes department, position, and step nodes', () => {
    const { nodes } = fromResourceGraph(fixture)
    expect(nodes.find(n => n.id === 'dept:eng')).toBeDefined()
    expect(nodes.find(n => n.id === 'position:mgr')).toBeDefined()
    expect(nodes.find(n => n.id === 'step:s1')).toBeDefined()
  })

  it('excludes company nodes', () => {
    const { nodes } = fromResourceGraph(fixture)
    expect(nodes.find(n => n.id === 'company:co')).toBeUndefined()
  })

  it('emits has_position edges from dept to position', () => {
    const { edges } = fromResourceGraph(fixture)
    const hasPosEdges = edges.filter(e => e.type === 'has_position')
    expect(hasPosEdges.length).toBeGreaterThan(0)
    expect(hasPosEdges.find(e => e.source === 'dept:eng' && e.target === 'position:mgr')).toBeDefined()
  })

  it('emits assigned_to edges from position to step', () => {
    const { edges } = fromResourceGraph(fixture)
    const assignedEdges = edges.filter(e => e.type === 'assigned_to')
    expect(assignedEdges.find(e => e.source === 'position:mgr' && e.target === 'step:s1')).toBeDefined()
  })

  it('unassigned steps are included with no connecting edges', () => {
    const { nodes, edges } = fromResourceGraph(fixture)
    expect(nodes.find(n => n.id === 'step:s3')).toBeDefined()
    expect(edges.find(e => e.target === 'step:s3')).toBeUndefined()
  })

  it('sets parentId on positions with direct dept belongs_to', () => {
    const { nodes } = fromResourceGraph(fixture)
    const mgr = nodes.find(n => n.id === 'position:mgr')
    expect(mgr?.parentId).toBe('dept:eng')
  })

  it('ops dept (no positions) produces no has_position edges for that dept', () => {
    const { edges } = fromResourceGraph(fixture)
    expect(edges.find(e => e.source === 'dept:ops')).toBeUndefined()
  })
})
