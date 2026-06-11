import type { FixtureTheme } from '../../lib/canvas-theme'
import type { GraphData, GraphNode, GraphEdge } from '../../lib/graph-data'

function topoSort(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const ids   = new Set(nodes.map(n => n.id))
  const inDeg = new Map(nodes.map(n => [n.id, 0]))
  const adj   = new Map<string, string[]>(nodes.map(n => [n.id, []]))
  for (const e of edges) {
    if (ids.has(e.source) && ids.has(e.target)) {
      adj.get(e.source)!.push(e.target)
      inDeg.set(e.target, inDeg.get(e.target)! + 1)
    }
  }
  const queue   = nodes.filter(n => inDeg.get(n.id) === 0)
  const result: GraphNode[] = []
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  while (queue.length) {
    const node = queue.shift()!
    result.push(node)
    for (const nid of adj.get(node.id) ?? []) {
      const d = inDeg.get(nid)! - 1
      inDeg.set(nid, d)
      if (d === 0) queue.push(nodeMap.get(nid)!)
    }
  }
  return result
}

// theme prop accepted for API consistency; CSS vars from LensShell handle the coloring
interface Props { graphData: GraphData; theme?: FixtureTheme }

export default function RunbookCanvas({ graphData }: Props) {
  const steps   = graphData.nodes.filter(n => n.type === 'step')
  const ordered = topoSort(steps, graphData.edges)

  return (
    <div className="runbook">
      {ordered.map((step, i) => (
        <div key={step.id} className="runbook-step">
          <div className="runbook-step-num">{i + 1}</div>
          <div className="runbook-step-body">
            <div className="runbook-step-name">{step.name}</div>
            {typeof step.attrs?.assignedTo === 'string' && (
              <span className="runbook-role-badge">{step.attrs.assignedTo}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
