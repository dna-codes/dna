import type { GraphData, GraphNode, GraphEdge, ResourceType, RelationshipType } from '../../graph-data'
import type { ResourceGraph } from '../../resource-graph'

const CONTAINMENT = new Set(['belongs_to', 'part_of'])

export function fromResourceGraph(graph: ResourceGraph): GraphData {
  const processIds = new Set(graph.resources.filter(r => r.type === 'process').map(r => r.id))
  const stepIds = new Set(graph.resources.filter(r => r.type === 'step').map(r => r.id))

  // parentId: step → process (containment only between step and process)
  const parentMap = new Map<string, string>()
  for (const rel of graph.relationships) {
    if (CONTAINMENT.has(rel.type) && stepIds.has(rel.from) && processIds.has(rel.to)) {
      parentMap.set(rel.from, rel.to)
    }
  }

  // assignedTo: step → position/person name (from assigned_to relationships)
  const assignedMap = new Map<string, string>()
  for (const rel of graph.relationships) {
    if (rel.type === 'assigned_to' && stepIds.has(rel.from)) {
      const target = graph.resources.find(r => r.id === rel.to)
      if (target) assignedMap.set(rel.from, target.name)
    }
  }

  const nodes: GraphNode[] = graph.resources
    .filter(r => r.type === 'process' || r.type === 'step')
    .map(r => {
      const node: GraphNode = { id: r.id, type: r.type as ResourceType, name: r.name }
      const parent = parentMap.get(r.id)
      if (parent) node.parentId = parent
      const assignedTo = assignedMap.get(r.id)
      if (assignedTo) node.attrs = { assignedTo }
      return node
    })

  // Only next_step relationships become visible edges.
  const edges: GraphEdge[] = graph.relationships
    .filter(r => r.type === 'next_step')
    .map(r => ({
      id: r.id,
      source: r.from,
      target: r.to,
      type: r.type as RelationshipType,
    }))

  return { nodes, edges }
}
