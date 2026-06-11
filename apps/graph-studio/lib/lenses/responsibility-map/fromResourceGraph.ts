import type { GraphData, GraphNode, GraphEdge, ResourceType, RelationshipType } from '../../graph-data'
import type { ResourceGraph } from '../../resource-graph'

export function fromResourceGraph(graph: ResourceGraph): GraphData {
  const deptIds = new Set(graph.resources.filter(r => r.type === 'department').map(r => r.id))
  const posIds  = new Set(graph.resources.filter(r => r.type === 'position').map(r => r.id))
  const stepIds = new Set(graph.resources.filter(r => r.type === 'step').map(r => r.id))

  // Direct belongs_to dept-position relationships
  const posDeptMap = new Map<string, string>() // pos.id → dept.id
  for (const rel of graph.relationships) {
    if (rel.type === 'belongs_to' && posIds.has(rel.from) && deptIds.has(rel.to)) {
      posDeptMap.set(rel.from, rel.to)
    }
  }

  // assigned_to: step → position
  const stepPosMap = new Map<string, string>() // step.id → pos.id
  for (const rel of graph.relationships) {
    if (rel.type === 'assigned_to' && stepIds.has(rel.from) && posIds.has(rel.to)) {
      stepPosMap.set(rel.from, rel.to)
    }
  }

  const nodes: GraphNode[] = [
    ...graph.resources.filter(r => r.type === 'department').map(r => ({
      id: r.id, type: r.type as ResourceType, name: r.name,
    })),
    ...graph.resources.filter(r => r.type === 'position').map(r => ({
      id: r.id, type: r.type as ResourceType, name: r.name,
      ...(posDeptMap.has(r.id) ? { parentId: posDeptMap.get(r.id) } : {}),
    })),
    ...graph.resources.filter(r => r.type === 'step').map(r => ({
      id: r.id, type: r.type as ResourceType, name: r.name,
    })),
  ]

  const edges: GraphEdge[] = [
    // dept → position edges (synthetic, for layout/display)
    ...[...posDeptMap.entries()].map(([posId, deptId]) => ({
      id:     `e:dept-pos:${posId}`,
      source: deptId,
      target: posId,
      type:   'has_position' as RelationshipType,
    })),
    // position → step edges
    ...[...stepPosMap.entries()].map(([stepId, posId]) => ({
      id:     `e:pos-step:${stepId}`,
      source: posId,
      target: stepId,
      type:   'assigned_to' as RelationshipType,
    })),
  ]

  return { nodes, edges }
}
