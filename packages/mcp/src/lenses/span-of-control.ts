import type { DnaDataStore } from '@dna-codes/dna-core'

export interface SpanEntry {
  id: string
  name: string
  directReports: number
  totalReports: number
}

export interface SpanOfControlViewModel {
  lens: 'span-of-control'
  positions: SpanEntry[]
}

export async function buildSpanOfControl(store: DnaDataStore): Promise<SpanOfControlViewModel> {
  const relTypes = await store.relationshipType.list()
  const reportsToRel = relTypes.find(r => r.name.toLowerCase() === 'reports_to')

  if (!reportsToRel) {
    return { lens: 'span-of-control', positions: [] }
  }

  const posTypeName = reportsToRel.from

  const [posInstances, allLinks] = await Promise.all([
    store.instance.list(posTypeName),
    store.link.list(),
  ])

  if (posInstances.length === 0) {
    return { lens: 'span-of-control', positions: [] }
  }

  // childrenMap: managerId → [reporterIds]
  const childrenMap = new Map<string, string[]>()
  for (const link of allLinks) {
    if (link.from.typeName === posTypeName && link.to.typeName === reportsToRel.to) {
      const existing = childrenMap.get(link.to.id) ?? []
      existing.push(link.from.id)
      childrenMap.set(link.to.id, existing)
    }
  }

  function countTotal(posId: string, visited = new Set<string>()): number {
    if (visited.has(posId)) return 0
    visited.add(posId)
    const direct = childrenMap.get(posId) ?? []
    return direct.length + direct.reduce((sum, childId) => sum + countTotal(childId, visited), 0)
  }

  const positions: SpanEntry[] = posInstances.map(pos => {
    const direct = childrenMap.get(pos.id) ?? []
    return {
      id: pos.id,
      name: String(pos.name ?? pos.id),
      directReports: direct.length,
      totalReports: countTotal(pos.id),
    }
  })

  return { lens: 'span-of-control', positions }
}
