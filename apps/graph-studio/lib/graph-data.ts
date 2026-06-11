export type ResourceType =
  | 'company' | 'department'
  | 'domain' | 'group'
  | 'position' | 'person'
  | 'process' | 'step'
  | (string & {})  // extensible — preserves autocomplete for known values

export type RelationshipType = 'membership' | 'reports_to' | 'fills' | 'belongs_to' | 'part_of' | 'next_step' | 'assigned_to' | 'has_position'

export interface GraphNode {
  id: string
  type: ResourceType
  name: string
  parentId?: string
  attrs?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type?: RelationshipType
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
