import type { DnaDataStore } from '@dna-codes/dna-core'

export interface PipelineOpportunity {
  id: string
  name: string
  account: string | null
  assignedTo: string | null
  deal: string | null
  status: 'open' | 'closed'
}

export interface PipelineViewModel {
  lens: 'pipeline'
  open: PipelineOpportunity[]
  closed: PipelineOpportunity[]
}

export async function buildPipeline(store: DnaDataStore): Promise<PipelineViewModel> {
  const [opportunities, contacts, accounts, deals, allLinks] = await Promise.all([
    store.instance.list('opportunity').catch(() => []),
    store.instance.list('contact').catch(() => []),
    store.instance.list('account').catch(() => []),
    store.instance.list('deal').catch(() => []),
    store.link.list(),
  ])

  const contactById = new Map(contacts.map(c => [c.id, String(c.name ?? c.id)]))
  const accountById = new Map(accounts.map(a => [a.id, String(a.name ?? a.id)]))
  const dealById = new Map(deals.map(d => [d.id, String(d.name ?? d.id)]))

  const oppToAccount = new Map<string, string>()
  const oppToContact = new Map<string, string>()
  const oppToDeal = new Map<string, string>()

  for (const link of allLinks) {
    const { from, to } = link
    if (from.typeName === 'opportunity' && to.typeName === 'account') {
      const name = accountById.get(to.id)
      if (name) oppToAccount.set(from.id, name)
    }
    if (from.typeName === 'opportunity' && to.typeName === 'contact') {
      const name = contactById.get(to.id)
      if (name) oppToContact.set(from.id, name)
    }
    if (from.typeName === 'opportunity' && to.typeName === 'deal') {
      const name = dealById.get(to.id)
      if (name) oppToDeal.set(from.id, name)
    }
  }

  const all: PipelineOpportunity[] = opportunities.map(opp => ({
    id: opp.id,
    name: String(opp.name ?? opp.id),
    account: oppToAccount.get(opp.id) ?? null,
    assignedTo: oppToContact.get(opp.id) ?? null,
    deal: oppToDeal.get(opp.id) ?? null,
    status: oppToDeal.has(opp.id) ? 'closed' : 'open',
  }))

  return {
    lens: 'pipeline',
    open: all.filter(o => o.status === 'open'),
    closed: all.filter(o => o.status === 'closed'),
  }
}
