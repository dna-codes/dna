import type { GraphData, GraphNode, GraphEdge, ResourceType, RelationshipType } from '../../graph-data'
import type { ResourceGraph } from '../../resource-graph'

export type { ResourceGraph }

// These relationship types establish the parent in the tree — not rendered as separate edges.
const CONTAINMENT = new Set(['belongs_to', 'part_of', 'reports_to'])

// Only these resource types belong in an org-chart view.
const ORG_TYPES = new Set(['company', 'department', 'position', 'domain', 'group'])

// Relationship types that are not org-chart edges (process/runbook concerns).
const NON_ORG_REL = new Set(['fills', 'next_step', 'assigned_to'])

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export function fromResourceGraph(graph: ResourceGraph): GraphData {
  // parentId: for each org resource, which resource is its parent in the tree
  const parentMap = new Map<string, string>()
  for (const rel of graph.relationships) {
    if (CONTAINMENT.has(rel.type)) {
      parentMap.set(rel.from, rel.to)
    }
  }

  // filledBy: who fills each position
  const fillsMap = new Map<string, { name: string; initials: string }>()
  for (const rel of graph.relationships) {
    if (rel.type === 'fills') {
      const person = graph.resources.find(r => r.id === rel.from && r.type === 'person')
      if (person) fillsMap.set(rel.to, { name: person.name, initials: initials(person.name) })
    }
  }

  // Person nodes shown as avatar badges; process/step nodes belong to other lenses.
  const nodes: GraphNode[] = graph.resources
    .filter(r => ORG_TYPES.has(r.type))
    .map(r => {
      const node: GraphNode = { id: r.id, type: r.type as ResourceType, name: r.name }
      const parent = parentMap.get(r.id)
      if (parent) node.parentId = parent
      const filledBy = fillsMap.get(r.id)
      if (filledBy) node.attrs = { filledBy }
      return node
    })

  // Only non-containment, non-fills, non-process-flow edges are rendered as explicit arrows.
  const edges: GraphEdge[] = graph.relationships
    .filter(r => !CONTAINMENT.has(r.type) && !NON_ORG_REL.has(r.type))
    .map(r => ({
      id: r.id,
      source: r.from,
      target: r.to,
      type: r.type as RelationshipType,
    }))

  return { nodes, edges }
}
