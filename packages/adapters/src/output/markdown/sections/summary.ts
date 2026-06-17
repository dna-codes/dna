import { DnaInput } from '../types'
import { hashes, label } from '../util'

interface SummaryOptions {
  rename?: Record<string, string>
}

export function renderSummary(dna: DnaInput, h: number, options: SummaryOptions = {}): string | null {
  const op = dna.operational
  if (!op) return null

  const resources = op.resources ?? []
  const persons = op.persons ?? []
  const positions = op.positions ?? []
  const groups = op.groups ?? []
  const topLevel = resources.map((r) => r.name)
  const lbl = (canonical: string) => label(canonical, options.rename)

  const rawCounts: [string, number][] = [
    [lbl('Resources'), resources.length],
    [lbl('Persons'), persons.length],
    [lbl('Groups'), groups.length],
    [lbl('Positions'), positions.length],
    [lbl('Memberships'), op.memberships?.length ?? 0],
    [lbl('Operations'), op.operations?.length ?? 0],
    [lbl('Triggers'), op.triggers?.length ?? 0],
    [lbl('Rules'), op.rules?.length ?? 0],
    [lbl('Relationships'), op.relationships?.length ?? 0],
    [lbl('Tasks'), op.tasks?.length ?? 0],
    [lbl('Processes'), op.processes?.length ?? 0],
  ]
  const counts = rawCounts.filter(([, n]) => n > 0)

  const lines: string[] = [`${hashes(h)} Summary`, '']
  if (op.domain.path) lines.push(`**Domain:** \`${op.domain.path}\``, '')

  if (counts.length) {
    lines.push('**Primitive counts:**', '')
    for (const [name, n] of counts) lines.push(`- ${name}: ${n}`)
  }

  if (topLevel.length) {
    lines.push('', `**Top-level ${lbl('Resources').toLowerCase()}:** ${topLevel.map((r) => `\`${r}\``).join(', ')}`)
  }

  return lines.join('\n')
}
