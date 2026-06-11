import type { ResourceGraph } from '../../resource-graph'

export interface JobResponsibility {
  processName: string
  processDescription?: string
  steps: string[]
}

export interface JobDescription {
  positionId: string
  title: string
  department: string
  reportsTo?: string
  filledBy?: string
  summary?: string
  responsibilities: JobResponsibility[]
}

export interface JobDescriptionData {
  orgName: string
  positions: JobDescription[]
}

export function fromResourceGraph(graph: ResourceGraph): JobDescriptionData {
  const byId = new Map(graph.resources.map(r => [r.id, r]))

  // Build lookup maps from relationships
  const parentOf = new Map<string, string>()       // resource → parent id
  const reportsToMap = new Map<string, string>()   // position → position id
  const fillsMap = new Map<string, string>()        // position → person name
  const stepToProcess = new Map<string, string>()  // step id → process id
  const assignedSteps = new Map<string, string[]>() // position id → step ids

  for (const rel of graph.relationships) {
    if (rel.type === 'belongs_to' || rel.type === 'part_of' || rel.type === 'membership') {
      parentOf.set(rel.from, rel.to)
    }
    if (rel.type === 'reports_to') {
      reportsToMap.set(rel.from, rel.to)
    }
    if (rel.type === 'fills') {
      const person = byId.get(rel.from)
      if (person) fillsMap.set(rel.to, person.name)
    }
    if (rel.type === 'next_step' || rel.type === 'part_of') {
      // handled below
    }
  }

  // Map steps to their parent process
  for (const rel of graph.relationships) {
    if ((rel.type === 'belongs_to' || rel.type === 'part_of')) {
      const from = byId.get(rel.from)
      const to = byId.get(rel.to)
      if (from?.type === 'step' && to?.type === 'process') {
        stepToProcess.set(rel.from, rel.to)
      }
    }
  }

  // Map positions to their assigned steps
  for (const rel of graph.relationships) {
    if (rel.type === 'assigned_to') {
      const step = byId.get(rel.from)
      const pos = byId.get(rel.to)
      if (step?.type === 'step' && pos?.type === 'position') {
        const existing = assignedSteps.get(rel.to) ?? []
        existing.push(rel.from)
        assignedSteps.set(rel.to, existing)
      }
    }
  }

  // Resolve the department name for a position (walk up until department/domain/group/company)
  function resolveDept(posId: string): string {
    let current = parentOf.get(posId)
    while (current) {
      const node = byId.get(current)
      if (!node) break
      if (['department', 'domain', 'group', 'company'].includes(node.type)) return node.name
      current = parentOf.get(current)
    }
    return ''
  }

  const orgName = graph.resources.find(r => r.type === 'company')?.name ?? graph.name

  const positions: JobDescription[] = graph.resources
    .filter(r => r.type === 'position')
    .map(pos => {
      // Group assigned steps by process
      const stepIds = assignedSteps.get(pos.id) ?? []
      const byProcess = new Map<string, string[]>()
      for (const stepId of stepIds) {
        const procId = stepToProcess.get(stepId)
        if (procId) {
          const group = byProcess.get(procId) ?? []
          group.push(stepId)
          byProcess.set(procId, group)
        }
      }

      const responsibilities: JobResponsibility[] = []
      for (const [procId, sIds] of byProcess) {
        const proc = byId.get(procId)
        if (!proc) continue
        responsibilities.push({
          processName: proc.name,
          processDescription: proc.description,
          steps: sIds.map(sid => byId.get(sid)?.name ?? sid),
        })
      }

      const reportsToId = reportsToMap.get(pos.id)
      const reportsToName = reportsToId ? byId.get(reportsToId)?.name : undefined

      return {
        positionId: pos.id,
        title: pos.name,
        department: resolveDept(pos.id),
        reportsTo: reportsToName,
        filledBy: fillsMap.get(pos.id),
        summary: pos.description,
        responsibilities,
      }
    })

  return { orgName, positions }
}
