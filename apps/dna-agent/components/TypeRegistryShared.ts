// Shared shapes + helpers for the Build-mode type lenses, all sourced from
// GET /api/lens/type-registry.

export interface TypeNode {
  name: string
  category: string
  description?: string
  stability: string
  attributes: Array<{ name: string; type: string; required?: boolean }>
}

export interface TypeEdge {
  name: string
  from: string
  to: string
  cardinality: string
  description?: string
  stability: string
}

export interface TypeRegistryData {
  lens: string
  resourceTypes: TypeNode[]
  relationshipTypes: TypeEdge[]
}

export const BELONGS_TO_NAMES = new Set(['belongs_to', 'part_of'])
export const REPORTS_TO_NAMES = new Set(['reports_to'])

/** Stability badge colors, aligned to the lifecycle experimental→beta→stable→deprecated. */
export function stabilityColor(stability: string): { fg: string; bg: string; border: string } {
  switch (stability) {
    case 'stable':       return { fg: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' }
    case 'beta':         return { fg: '#0D9488', bg: 'rgba(13,148,136,0.15)', border: 'rgba(13,148,136,0.3)' }
    case 'deprecated':   return { fg: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)' }
    case 'experimental':
    default:             return { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' }
  }
}
