import { fromResourceGraph } from '../../lib/lenses/runbook/fromResourceGraph'
import type { ResourceGraph } from '../../lib/resource-graph'

const fixture: ResourceGraph = {
  name: 'test',
  resources: [
    { id: 'process:p1',     type: 'process',  name: 'Onboarding' },
    { id: 'step:s1',        type: 'step',     name: 'Step 1'     },
    { id: 'step:s2',        type: 'step',     name: 'Step 2'     },
    { id: 'step:s3',        type: 'step',     name: 'Step 3'     },
    { id: 'position:mgr',   type: 'position', name: 'Manager'    },
    { id: 'company:acme',   type: 'company',  name: 'Acme'       },
  ],
  relationships: [
    { id: 'r:s1-p1', type: 'belongs_to',  from: 'step:s1',     to: 'process:p1'   },
    { id: 'r:s2-p1', type: 'belongs_to',  from: 'step:s2',     to: 'process:p1'   },
    { id: 'r:s3-p1', type: 'belongs_to',  from: 'step:s3',     to: 'process:p1'   },
    { id: 'r:flow1', type: 'next_step',   from: 'step:s1',     to: 'step:s2'      },
    { id: 'r:flow2', type: 'next_step',   from: 'step:s2',     to: 'step:s3'      },
    { id: 'r:asgn',  type: 'assigned_to', from: 'step:s2',     to: 'position:mgr' },
  ],
}

describe('runbook fromResourceGraph', () => {
  it('includes only step nodes (no process nodes)', () => {
    const { nodes } = fromResourceGraph(fixture)
    const types = nodes.map(n => n.type)
    expect(types.every(t => t === 'step')).toBe(true)
    expect(nodes.find(n => n.id === 'process:p1')).toBeUndefined()
  })

  it('excludes non-step resources', () => {
    const { nodes } = fromResourceGraph(fixture)
    const ids = nodes.map(n => n.id)
    expect(ids).not.toContain('company:acme')
    expect(ids).not.toContain('position:mgr')
  })

  it('emits next_step edges', () => {
    const { edges } = fromResourceGraph(fixture)
    expect(edges).toHaveLength(2)
  })

  it('sets attrs.assignedTo from assigned_to relationship', () => {
    const { nodes } = fromResourceGraph(fixture)
    const s2 = nodes.find(n => n.id === 'step:s2')
    expect(s2?.attrs?.assignedTo).toBe('Manager')
  })

  it('unassigned steps have no attrs.assignedTo', () => {
    const { nodes } = fromResourceGraph(fixture)
    const s1 = nodes.find(n => n.id === 'step:s1')
    expect(s1?.attrs?.assignedTo).toBeUndefined()
  })
})
