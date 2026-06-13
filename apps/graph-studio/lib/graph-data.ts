export type ResourceType =
  | 'company' | 'department'
  | 'domain' | 'group'
  | 'position' | 'person'
  | 'process' | 'step'
  // Product UI layer
  | 'workflow' | 'page' | 'section' | 'component' | 'element' | 'ui-operation'
  | (string & {})  // extensible — preserves autocomplete for known values

export type RelationshipType =
  | 'membership' | 'reports_to' | 'fills' | 'belongs_to' | 'part_of' | 'next_step' | 'assigned_to' | 'has_position'
  // Product UI layer
  | 'contains' | 'renders' | 'triggers' | 'navigates_to' | 'calls' | 'requires' | 'updates'

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
