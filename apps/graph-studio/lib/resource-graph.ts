import type { FixtureTheme } from './canvas-theme'

export interface ResourceItem {
  id: string
  type: string
  name: string
  description?: string
}

export interface RelationshipItem {
  id: string
  type: string
  from: string
  to: string
}

export interface ResourceGraph {
  name: string
  description?: string
  theme?: FixtureTheme
  resources: ResourceItem[]
  relationships: RelationshipItem[]
}
