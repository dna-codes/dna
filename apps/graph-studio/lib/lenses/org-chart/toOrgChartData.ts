import type { OperationalDNA } from '@dna-codes/dna-core'
import type { GraphData, GraphNode, GraphEdge } from '../../graph-data'

interface DomainLike {
  name: string
  domains?: DomainLike[]
  groups?: Array<{ name: string }>
  roles?: Array<{ name: string; scope?: string }>
  persons?: Array<{ name: string }>
}

function collectDomainNodes(domain: DomainLike, parentId?: string): GraphNode[] {
  const nodes: GraphNode[] = []
  const domainId = `domain:${domain.name}`

  nodes.push({
    id: domainId,
    type: 'domain',
    name: domain.name,
    ...(parentId !== undefined ? { parentId } : {}),
  })

  for (const group of domain.groups ?? []) {
    nodes.push({ id: `group:${group.name}`, type: 'group', name: group.name, parentId: domainId })
  }

  for (const role of domain.roles ?? []) {
    const node: GraphNode = { id: `position:${role.name}`, type: 'position', name: role.name }
    if (role.scope) node.parentId = `group:${role.scope}`
    nodes.push(node)
  }

  for (const person of domain.persons ?? []) {
    nodes.push({ id: `person:${person.name}`, type: 'person', name: person.name })
  }

  for (const sub of domain.domains ?? []) {
    nodes.push(...collectDomainNodes(sub, domainId))
  }

  return nodes
}

export function toOrgChartData(dna: OperationalDNA): GraphData {
  const nodes = collectDomainNodes(dna.domain as unknown as DomainLike)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edges: GraphEdge[] = (dna.memberships ?? []).map((m: any) => ({
    id: `membership:${m.name}`,
    source: `person:${m.person}`,
    target: `position:${m.role}`,
    type: 'membership' as const,
  }))

  return { nodes, edges }
}
