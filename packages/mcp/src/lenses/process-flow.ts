import type { DnaDataStore } from '@dna-codes/dna-core'

export interface ProcessFlowStep {
  id: string
  name: string
  description?: string
  /** The position responsible for this step (via `assigned_to`), if any. */
  assignee?: string
}

export interface ProcessFlowProcess {
  id: string
  name: string
  description?: string
  /** Steps in execution order, following the `next_step` chain. */
  steps: ProcessFlowStep[]
}

export interface ProcessFlowViewModel {
  lens: 'process-flow'
  processes: ProcessFlowProcess[]
}

/**
 * Process-flow lens — how each `process` flows through its `step`s. Steps belong
 * to a process (`belongs_to`), are ordered by `next_step`, and name the position
 * that owns them (`assigned_to`). Read-only.
 */
export async function buildProcessFlow(store: DnaDataStore): Promise<ProcessFlowViewModel> {
  const rtList = await store.resourceType.list()
  const links = await store.link.list()

  // Resolve all instances, stamped with their type name.
  const byId = new Map<string, { id: string; name: string; description?: string; type: string }>()
  for (const rt of rtList) {
    for (const inst of await store.instance.list(rt.name)) {
      const rec = inst as Record<string, unknown>
      byId.set(inst.id, {
        id: inst.id,
        name: String(rec.name ?? inst.id),
        description: typeof rec.description === 'string' ? rec.description : undefined,
        type: rt.name,
      })
    }
  }

  // step → process (belongs_to), step → next step (next_step), step → position (assigned_to)
  const processOfStep = new Map<string, string>()
  const nextOf = new Map<string, string>()
  const hasPrev = new Set<string>()
  const assigneeOf = new Map<string, string>()
  for (const link of links) {
    const from = byId.get(link.from.id)
    const to = byId.get(link.to.id)
    if (!from || !to) continue
    if (link.role === 'belongs_to' && from.type === 'step' && to.type === 'process') {
      processOfStep.set(from.id, to.id)
    } else if (link.role === 'next_step' && from.type === 'step' && to.type === 'step') {
      nextOf.set(from.id, to.id)
      hasPrev.add(to.id)
    } else if (link.role === 'assigned_to' && from.type === 'step' && to.type === 'position') {
      assigneeOf.set(from.id, to.name)
    }
  }

  const processes: ProcessFlowProcess[] = []
  for (const proc of [...byId.values()].filter((i) => i.type === 'process')) {
    const procStepIds = new Set([...processOfStep.entries()].filter(([, p]) => p === proc.id).map(([s]) => s))
    // Order: start from heads (no predecessor within the process), walk next_step.
    const ordered: string[] = []
    const seen = new Set<string>()
    const walk = (id: string | undefined) => {
      while (id && procStepIds.has(id) && !seen.has(id)) {
        seen.add(id)
        ordered.push(id)
        id = nextOf.get(id)
      }
    }
    for (const id of procStepIds) if (!hasPrev.has(id)) walk(id)
    for (const id of procStepIds) if (!seen.has(id)) walk(id) // any leftovers (branches/cycles)

    if (ordered.length === 0) continue
    processes.push({
      id: proc.id,
      name: proc.name,
      description: proc.description,
      steps: ordered.map((id) => {
        const s = byId.get(id)!
        return { id: s.id, name: s.name, description: s.description, assignee: assigneeOf.get(id) }
      }),
    })
  }

  processes.sort((a, b) => a.name.localeCompare(b.name))
  return { lens: 'process-flow', processes }
}
