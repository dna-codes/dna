import { fromResourceGraph } from '../../lib/lenses/process-flow/fromResourceGraph'
import type { ResourceGraph } from '../../lib/resource-graph'

const fixture: ResourceGraph = {
  name: 'test',
  resources: [
    { id: 'company:acme',   type: 'company',  name: 'Acme'     },
    { id: 'process:p1',     type: 'process',  name: 'Process 1'},
    { id: 'step:s1',        type: 'step',     name: 'Step 1'   },
    { id: 'step:s2',        type: 'step',     name: 'Step 2'   },
    { id: 'step:s3',        type: 'step',     name: 'Step 3'   },
    { id: 'position:role1', type: 'position', name: 'Analyst'  },
    { id: 'person:bob',     type: 'person',   name: 'Bob'      },
  ],
  relationships: [
    { id: 'r:s1-p1', type: 'belongs_to',  from: 'step:s1',       to: 'process:p1'     },
    { id: 'r:s2-p1', type: 'belongs_to',  from: 'step:s2',       to: 'process:p1'     },
    { id: 'r:s3-p1', type: 'belongs_to',  from: 'step:s3',       to: 'process:p1'     },
    { id: 'r:flow1', type: 'next_step',   from: 'step:s1',       to: 'step:s2'        },
    { id: 'r:flow2', type: 'next_step',   from: 'step:s2',       to: 'step:s3'        },
    { id: 'r:asgn',  type: 'assigned_to', from: 'step:s1',       to: 'position:role1' },
    { id: 'r:fills', type: 'fills',       from: 'person:bob',    to: 'position:role1' },
  ],
}

describe('process-flow fromResourceGraph', () => {
  it('includes process and step nodes', () => {
    const { nodes } = fromResourceGraph(fixture)
    const ids = nodes.map(n => n.id)
    expect(ids).toContain('process:p1')
    expect(ids).toContain('step:s1')
    expect(ids).toContain('step:s2')
    expect(ids).toContain('step:s3')
  })

  it('excludes non-process/step resources', () => {
    const { nodes } = fromResourceGraph(fixture)
    const ids = nodes.map(n => n.id)
    expect(ids).not.toContain('company:acme')
    expect(ids).not.toContain('position:role1')
    expect(ids).not.toContain('person:bob')
  })

  it('sets parentId on steps from belongs_to relationship', () => {
    const { nodes } = fromResourceGraph(fixture)
    const s1 = nodes.find(n => n.id === 'step:s1')
    expect(s1?.parentId).toBe('process:p1')
  })

  it('emits next_step relationships as edges', () => {
    const { edges } = fromResourceGraph(fixture)
    expect(edges).toHaveLength(2)
    expect(edges[0]).toMatchObject({ source: 'step:s1', target: 'step:s2', type: 'next_step' })
    expect(edges[1]).toMatchObject({ source: 'step:s2', target: 'step:s3', type: 'next_step' })
  })

  it('sets attrs.assignedTo on step from assigned_to relationship', () => {
    const { nodes } = fromResourceGraph(fixture)
    const s1 = nodes.find(n => n.id === 'step:s1')
    expect(s1?.attrs?.assignedTo).toBe('Analyst')
  })

  it('step with no assignment has no attrs.assignedTo', () => {
    const { nodes } = fromResourceGraph(fixture)
    const s2 = nodes.find(n => n.id === 'step:s2')
    expect(s2?.attrs?.assignedTo).toBeUndefined()
  })
})
