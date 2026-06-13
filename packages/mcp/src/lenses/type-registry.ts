import type { DnaDataStore, NounCategory, Stability, AttributeSchemaEntry } from '@dna-codes/dna-core'

/** A resource type rendered as a node in the schema graph. */
export interface TypeRegistryNode {
  name: string
  category: NounCategory
  description?: string
  stability: Stability
  attributes: AttributeSchemaEntry[]
}

/** A relationship type rendered as a directed edge in the schema graph. */
export interface TypeRegistryEdge {
  name: string
  from: string
  to: string
  cardinality: string
  description?: string
  stability: Stability
}

export interface TypeRegistryViewModel {
  lens: 'type-registry'
  resourceTypes: TypeRegistryNode[]
  relationshipTypes: TypeRegistryEdge[]
}

/**
 * Build a type-level view of the registry: resource types as nodes and
 * relationship types as directed edges. Sourced entirely from registered type
 * records — it reads no instances, so it is fully populated in Build mode where
 * the graph has types but no data.
 */
export async function buildTypeRegistryGraph(store: DnaDataStore): Promise<TypeRegistryViewModel> {
  const [resourceTypes, relTypes] = await Promise.all([
    store.resourceType.list(),
    store.relationshipType.list(),
  ])

  return {
    lens: 'type-registry',
    resourceTypes: resourceTypes.map(rt => ({
      name: rt.name,
      category: rt.category,
      description: rt.description,
      stability: rt.stability,
      attributes: rt.attribute_schema ?? [],
    })),
    relationshipTypes: relTypes.map(rel => ({
      name: rel.name,
      from: rel.from,
      to: rel.to,
      cardinality: rel.cardinality,
      description: rel.description,
      stability: rel.stability,
    })),
  }
}
