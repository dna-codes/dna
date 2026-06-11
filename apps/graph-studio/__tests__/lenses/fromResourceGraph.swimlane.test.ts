import { fromResourceGraph } from '../../lib/lenses/swimlane/fromResourceGraph'
import type { ResourceGraph } from '../../lib/resource-graph'

const fixture: ResourceGraph = {
  name: 'test',
  resources: [
    { id: 'process:p1',   type: 'process',  name: 'Onboarding'  },
    { id: 'step:s1',      type: 'step',     name: 'Step 1'      },
    { id: 'step:s2',      type: 'step',     name: 'Step 2'      },
    { id: 'step:s3',      type: 'step',     name: 'Step 3'      },
    { id: 'step:s4',      type: 'step',     name: 'Step 4'      },
    { id: 'position:mgr', type: 'position', name: 'Manager'     },
    { id: 'position:rep', type: 'position', name: 'Rep'         },
  ],
  relationships: [
    { id: 'r1', type: 'next_step',   from: 'step:s1', to: 'step:s2'           },
    { id: 'r2', type: 'next_step',   from: 'step:s2', to: 'step:s3'           },
    { id: 'r3', type: 'next_step',   from: 'step:s3', to: 'step:s4'           },
    { id: 'r4', type: 'assigned_to', from: 'step:s1', to: 'position:mgr'      },
    { id: 'r5', type: 'assigned_to', from: 'step:s2', to: 'position:rep'      },
    { id: 'r6', type: 'assigned_to', from: 'step:s3', to: 'position:mgr'      },
    // step:s4 is unassigned
  ],
}

describe('swimlane fromResourceGraph', () => {
  it('returns lanes grouped by position', () => {
    const { lanes } = fromResourceGraph(fixture)
    const ids = lanes.map(l => l.roleId)
    expect(ids).toContain('position:mgr')
    expect(ids).toContain('position:rep')
  })

  it('assigns unassigned steps to an Unassigned lane', () => {
    const { lanes } = fromResourceGraph(fixture)
    const unassigned = lanes.find(l => l.roleId === 'unassigned')
    expect(unassigned).toBeDefined()
    expect(unassigned!.steps.map(s => s.id)).toContain('step:s4')
  })

  it('unassigned lane appears last', () => {
    const { lanes } = fromResourceGraph(fixture)
    expect(lanes[lanes.length - 1].roleId).toBe('unassigned')
  })

  it('steps within a lane are topologically ordered', () => {
    const { lanes } = fromResourceGraph(fixture)
    const mgrLane = lanes.find(l => l.roleId === 'position:mgr')!
    const stepIds = mgrLane.steps.map(s => s.id)
    // s1 comes before s3 in topo order
    expect(stepIds.indexOf('step:s1')).toBeLessThan(stepIds.indexOf('step:s3'))
  })

  it('emits next_step edges', () => {
    const { edges } = fromResourceGraph(fixture)
    expect(edges).toHaveLength(3)
  })

  it('lanes have correct roleName', () => {
    const { lanes } = fromResourceGraph(fixture)
    const mgrLane = lanes.find(l => l.roleId === 'position:mgr')
    expect(mgrLane?.roleName).toBe('Manager')
  })
})
