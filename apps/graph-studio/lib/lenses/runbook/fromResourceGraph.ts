import type { GraphData, GraphNode, GraphEdge, ResourceType, RelationshipType } from '../../graph-data'
import type { ResourceGraph } from '../../resource-graph'

export function fromResourceGraph(graph: ResourceGraph): GraphData {
  const stepIds = new Set(graph.resources.filter(r => r.type === 'step').map(r => r.id))

  // assignedTo: step → position/person name
  const assignedMap = new Map<string, string>()
  for (const rel of graph.relationships) {
    if (rel.type === 'assigned_to' && stepIds.has(rel.from)) {
      const target = graph.resources.find(r => r.id === rel.to)
      if (target) assignedMap.set(rel.from, target.name)
    }
  }

  const nodes: GraphNode[] = graph.resources
    .filter(r => r.type === 'step')
    .map(r => {
      const node: GraphNode = { id: r.id, type: r.type as ResourceType, name: r.name }
      const assignedTo = assignedMap.get(r.id)
      if (assignedTo) node.attrs = { assignedTo }
      return node
    })

  // next_step edges drive topological ordering in the canvas.
  const edges: GraphEdge[] = graph.relationships
    .filter(r => r.type === 'next_step' && stepIds.has(r.from) && stepIds.has(r.to))
    .map(r => ({
      id: r.id,
      source: r.from,
      target: r.to,
      type: r.type as RelationshipType,
    }))

  return { nodes, edges }
}
