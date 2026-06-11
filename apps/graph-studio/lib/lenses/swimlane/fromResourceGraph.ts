import type { GraphNode, GraphEdge, ResourceType, RelationshipType } from '../../graph-data'
import type { ResourceGraph } from '../../resource-graph'

export interface LaneData {
  roleId: string
  roleName: string
  steps: GraphNode[]
}

export interface SwimlaneData {
  lanes: LaneData[]
  edges: GraphEdge[]  // next_step edges crossing or within lanes
}

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

export function fromResourceGraph(graph: ResourceGraph): SwimlaneData {
  const stepIds = new Set(graph.resources.filter(r => r.type === 'step').map(r => r.id))

  // step → { roleId, roleName } via assigned_to
  const assignedMap = new Map<string, { roleId: string; roleName: string }>()
  for (const rel of graph.relationships) {
    if (rel.type === 'assigned_to' && stepIds.has(rel.from)) {
      const target = graph.resources.find(r => r.id === rel.to)
      if (target) assignedMap.set(rel.from, { roleId: target.id, roleName: target.name })
    }
  }

  // All next_step edges between steps
  const edges: GraphEdge[] = graph.relationships
    .filter(r => r.type === 'next_step' && stepIds.has(r.from) && stepIds.has(r.to))
    .map(r => ({ id: r.id, source: r.from, target: r.to, type: r.type as RelationshipType }))

  // All step nodes
  const allSteps: GraphNode[] = graph.resources
    .filter(r => r.type === 'step')
    .map(r => ({ id: r.id, type: r.type as ResourceType, name: r.name }))

  // Global topological order for consistent step ordering within lanes
  const globalOrder = topoSort(allSteps, edges)
  const orderIdx    = new Map(globalOrder.map((n, i) => [n.id, i]))

  // Group into lanes
  const laneMap = new Map<string, { roleId: string; roleName: string; steps: GraphNode[] }>()
  for (const step of allSteps) {
    const assignment = assignedMap.get(step.id)
    const roleId   = assignment?.roleId   ?? 'unassigned'
    const roleName = assignment?.roleName ?? 'Unassigned'
    if (!laneMap.has(roleId)) laneMap.set(roleId, { roleId, roleName, steps: [] })
    laneMap.get(roleId)!.steps.push(step)
  }

  // Sort steps within each lane by global topo order
  const lanes: LaneData[] = [...laneMap.values()].map(lane => ({
    ...lane,
    steps: [...lane.steps].sort((a, b) => (orderIdx.get(a.id) ?? 0) - (orderIdx.get(b.id) ?? 0)),
  }))

  // Move unassigned lane to the end
  const unassignedIdx = lanes.findIndex(l => l.roleId === 'unassigned')
  if (unassignedIdx > 0) lanes.push(...lanes.splice(unassignedIdx, 1))

  return { lanes, edges }
}
