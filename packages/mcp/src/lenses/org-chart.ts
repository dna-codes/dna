import type { DnaDataStore, LensDefinition, LensDataResult } from '@dna-codes/dna-core'
import { evaluateLens } from '@dna-codes/dna-core'

export interface OrgChartPerson {
  name: string
  id: string
}

export interface OrgChartNode {
  id: string
  name: string
  type: string
  description?: string
  holders: OrgChartPerson[]
  reports: OrgChartNode[]
  parentId?: string
}

export interface OrgChartViewModel {
  lens: 'org-chart'
  groupName: string
  roots: OrgChartNode[]
}

const ORG_TYPES = new Set(['company', 'department', 'position', 'domain', 'group'])
const ORG_RELATIONSHIPS = ['belongs_to', 'part_of', 'reports_to', 'fills']

export async function buildOrgChart(store: DnaDataStore): Promise<OrgChartViewModel> {
  // Resolve the org-relevant resource types (org structure + the person type).
  const allTypes = await store.resourceType.list()
  const orgTypeNames = new Set(allTypes.filter(t => ORG_TYPES.has(t.name.toLowerCase())).map(t => t.name))
  const personTypeName = allTypes.find(t => t.category === 'person')?.name ?? 'Person'

  // Fetch the org subgraph via the generic lens evaluator: every instance of the
  // org/person types, plus the structural links between them. Presentation
  // (tree-shaping below) stays here; data acquisition is the evaluator's job.
  const slotTypes = [...orgTypeNames, personTypeName]
  const orgLens: LensDefinition = {
    $id: 'lens:org-chart',
    name: 'Org Chart',
    target: 'data',
    nodes: slotTypes.map(type => ({ slot: type, type })),
    edges: ORG_RELATIONSHIPS.map(via => ({ from: personTypeName, to: personTypeName, via })),
  }
  const { nodes, links: allLinks } = (await evaluateLens(orgLens, store)) as LensDataResult

  // Build lookup maps from the evaluated subgraph (nodes carry `_typeName`).
  const allInstances = new Map<string, { id: string; name: string; type: string; description?: string }>()
  for (const n of nodes) {
    const rec = n as { id: string; name?: unknown; description?: unknown; _typeName?: string }
    allInstances.set(rec.id, {
      id: rec.id,
      name: String(rec.name ?? rec.id),
      type: rec._typeName ?? '',
      description: rec.description as string | undefined,
    })
  }

  // reports_to / belongs_to → parentId
  const parentMap = new Map<string, string>()
  const fillsMap = new Map<string, OrgChartPerson[]>()

  // All links carry link.role = the relationship type name (set by patch_graph add_link)
  const BELONGS_TO = new Set(['belongs_to', 'part_of'])
  const REPORTS_TO = new Set(['reports_to'])
  const FILLS = new Set(['fills'])

  // Separate maps: structural containment (belongs_to) vs reporting chain (reports_to)
  const reportsToChildrenMap = new Map<string, string[]>() // manager.id → [subordinate ids]
  const reportsToParentMap = new Map<string, string>()    // subordinate.id → manager.id

  for (const link of allLinks) {
    const role = link.role
    if (!role) continue

    if (BELONGS_TO.has(role)) {
      parentMap.set(link.from.id, link.to.id)
    } else if (REPORTS_TO.has(role)) {
      reportsToParentMap.set(link.from.id, link.to.id)
      const subs = reportsToChildrenMap.get(link.to.id) ?? []
      subs.push(link.from.id)
      reportsToChildrenMap.set(link.to.id, subs)
    } else if (FILLS.has(role)) {
      const person = allInstances.get(link.from.id)
      if (person) {
        const existing = fillsMap.get(link.to.id) ?? []
        existing.push({ id: link.from.id, name: person.name })
        fillsMap.set(link.to.id, existing)
      }
    }
  }

  // Build tree nodes for org types only
  const orgInstances = [...allInstances.values()].filter(i => orgTypeNames.has(i.type))
  const groupTypeNames = new Set(['company', 'department', 'domain', 'group'])
  const isGroupInst = (inst: { type: string }) => groupTypeNames.has(inst.type.toLowerCase())

  function buildNode(inst: { id: string; name: string; type: string; description?: string }): OrgChartNode {
    let children: typeof orgInstances
    if (isGroupInst(inst)) {
      // Group nodes: direct belongs_to children; for position children, only include top-level ones
      // (positions with a reports_to manager appear nested under their manager card instead)
      children = orgInstances.filter(i =>
        parentMap.get(i.id) === inst.id &&
        (isGroupInst(i) || !reportsToParentMap.has(i.id))
      )
    } else {
      // Position nodes: subordinates via reports_to
      const subIds = reportsToChildrenMap.get(inst.id) ?? []
      children = orgInstances.filter(i => subIds.includes(i.id))
    }
    return {
      id: inst.id,
      name: inst.name,
      type: inst.type,
      description: inst.description,
      holders: fillsMap.get(inst.id) ?? [],
      reports: children.map(buildNode),
      parentId: parentMap.get(inst.id),
    }
  }

  // Roots: group nodes with no belongs_to parent; positions with neither belongs_to nor reports_to parent
  const roots = orgInstances.filter(i =>
    !parentMap.has(i.id) && (isGroupInst(i) || !reportsToParentMap.has(i.id))
  ).map(buildNode)

  const groupInst = orgInstances.find(i => ['company', 'department', 'domain'].includes(i.type.toLowerCase()))
  const groupName = groupInst?.name ?? 'Organization'

  return { lens: 'org-chart', groupName, roots }
}
