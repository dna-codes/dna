import type { DnaDataStore } from '@dna-codes/dna-core'

export interface GraphNode {
  id: string
  type: string
  name: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
}

export interface GraphDataViewModel {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export async function buildGraphData(store: DnaDataStore): Promise<GraphDataViewModel> {
  const [resourceTypes, relTypes, allLinks] = await Promise.all([
    store.resourceType.list(),
    store.relationshipType.list(),
    store.link.list(),
  ])

  // Build a lookup: from/to typeName pair → relationship type name
  const relTypeByPair = new Map<string, string>()
  for (const rt of relTypes) {
    relTypeByPair.set(`${rt.from}→${rt.to}`, rt.name)
  }

  // Collect all instances across all resource types
  const nodes: GraphNode[] = []
  for (const rt of resourceTypes) {
    const instances = await store.instance.list(rt.name)
    for (const inst of instances) {
      nodes.push({
        id: inst.id,
        type: rt.name,
        name: String((inst as Record<string, unknown>).name ?? inst.id),
      })
    }
  }

  const edges: GraphEdge[] = allLinks.map(link => ({
    id: link.id,
    source: link.from.id,
    target: link.to.id,
    type: relTypeByPair.get(`${link.from.typeName}→${link.to.typeName}`) ?? 'link',
  }))

  return { nodes, edges }
}
