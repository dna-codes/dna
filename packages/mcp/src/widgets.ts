export interface StatTile {
  label: string
  value: string
  accent?: string
}

export interface StatRow {
  kind: 'stat-row'
  stats: StatTile[]
}

export interface RecordTable {
  kind: 'record-table'
  columns: string[]
  rows: string[][]
}

export interface RecordField {
  label: string
  value: string
}

export interface RecordCard {
  kind: 'record-card'
  title: string
  subtitle?: string
  fields: RecordField[]
}

export interface BadgeItem {
  text: string
  variant?: 'neutral' | 'success' | 'warning'
}

export interface BadgeList {
  kind: 'badge-list'
  label?: string
  items: BadgeItem[]
}

export type WidgetPayload = StatRow | RecordTable | RecordCard | BadgeList

export const WIDGET_KINDS = ['stat-row', 'record-table', 'record-card', 'badge-list'] as const
export type WidgetKind = (typeof WIDGET_KINDS)[number]
