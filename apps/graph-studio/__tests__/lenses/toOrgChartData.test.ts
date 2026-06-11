import massTortDna from '../../../../examples/mass-tort/operational.json'
import { toOrgChartData } from '../../lib/lenses/org-chart/toOrgChartData'
import type { OperationalDNA } from '@dna-codes/dna-core'

const dna = massTortDna as unknown as OperationalDNA

describe('toOrgChartData — DNA structural primitives map to GraphData nodes', () => {
  it('domain becomes a node with type "domain"', () => {
    const { nodes } = toOrgChartData(dna)
    const domain = nodes.find(n => n.id === 'domain:marshall')
    expect(domain).toMatchObject({ id: 'domain:marshall', type: 'domain', name: 'marshall' })
  })

  it('sub-domain carries parentId of its parent domain', () => {
    const nested: OperationalDNA = {
      domain: {
        name: 'acme',
        domains: [
          {
            name: 'finance',
            domains: [{ name: 'lending' }],
          },
        ],
      },
      memberships: [],
    } as unknown as OperationalDNA

    const { nodes } = toOrgChartData(nested)
    const lending = nodes.find(n => n.id === 'domain:lending')
    expect(lending?.parentId).toBe('domain:finance')
  })

  it('group becomes a node scoped to its domain', () => {
    const { nodes } = toOrgChartData(dna)
    const caseGroup = nodes.find(n => n.id === 'group:Case')
    expect(caseGroup).toMatchObject({
      id: 'group:Case',
      type: 'group',
      name: 'Case',
      parentId: 'domain:marshall',
    })
  })

  it('position with scope becomes a node with scoping group as parentId', () => {
    const { nodes } = toOrgChartData(dna)
    const lead = nodes.find(n => n.id === 'position:LeadCounsel')
    expect(lead).toMatchObject({
      id: 'position:LeadCounsel',
      type: 'position',
      name: 'LeadCounsel',
      parentId: 'group:Case',
    })
  })

  it('unscoped position has no parentId', () => {
    const unscoped: OperationalDNA = {
      domain: {
        name: 'test',
        roles: [{ name: 'GlobalAdmin' }],
      },
      memberships: [],
    } as unknown as OperationalDNA
    const { nodes } = toOrgChartData(unscoped)
    const position = nodes.find(n => n.id === 'position:GlobalAdmin')
    expect(position?.parentId).toBeUndefined()
  })

  it('person becomes a leaf node with no parentId', () => {
    const { nodes } = toOrgChartData(dna)
    const partner = nodes.find(n => n.id === 'person:Partner')
    expect(partner).toMatchObject({ id: 'person:Partner', type: 'person', name: 'Partner' })
    expect(partner?.parentId).toBeUndefined()
  })

  it('membership becomes an edge from person to position', () => {
    const { edges } = toOrgChartData(dna)
    const mem = edges.find(e => e.source === 'person:Partner' && e.target === 'position:LeadCounsel')
    expect(mem).toMatchObject({
      source: 'person:Partner',
      target: 'position:LeadCounsel',
      type: 'membership',
    })
  })

  it('empty DNA produces empty GraphData', () => {
    const empty: OperationalDNA = {
      domain: { name: 'empty' },
      memberships: [],
    } as unknown as OperationalDNA
    const result = toOrgChartData(empty)
    // Root domain node still appears; no groups/positions/persons/edges
    expect(result.nodes.filter(n => n.type !== 'domain')).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })
})
