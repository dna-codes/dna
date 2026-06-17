import { DnaInput } from '../types'
import { hashes } from '../util'

export function renderDomainModel(dna: DnaInput, h: number): string | null {
  const op = dna.operational
  if (!op) return null

  const resources = op.resources ?? []
  if (!resources.length) return null

  const relsByFrom = groupBy(op.relationships ?? [], (r) => r.from)

  const lines: string[] = [`${hashes(h)} Domain Model`]

  for (const resource of resources) {
    lines.push('', `${hashes(h + 1)} ${resource.name}`)
    if (resource.description) lines.push('', resource.description)

    if (resource.attributes?.length) {
      lines.push(
        '',
        '| Attribute | Type | Required | Description |',
        '| --- | --- | --- | --- |',
      )
      for (const attr of resource.attributes) {
        lines.push(
          `| \`${attr.name}\` | ${attr.type ?? '—'} | ${attr.required ? 'yes' : 'no'} | ${attr.description ?? ''} |`,
        )
      }
    }

    if (resource.actions?.length) {
      lines.push('', `**Actions:** ${resource.actions.map((a) => `\`${a.name}\``).join(', ')}`)
    }

    const rels = relsByFrom.get(resource.name) ?? []
    if (rels.length) {
      lines.push('', '**Relationships:**')
      for (const r of rels) {
        lines.push(
          `- \`${r.name}\` — ${r.cardinality} → \`${r.to}\` (via \`${r.attribute}\`)`,
        )
      }
    }
  }

  return lines.join('\n')
}

function groupBy<T>(arr: T[], key: (x: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>()
  for (const x of arr) {
    const k = key(x)
    if (!out.has(k)) out.set(k, [])
    out.get(k)!.push(x)
  }
  return out
}
