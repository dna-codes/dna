import { DnaInput } from '../types'
import { code, escape, groupBy, heading } from '../util'

export function renderDomainModel(dna: DnaInput, h: number): string | null {
  const op = dna.operational
  if (!op) return null

  const resources = op.resources ?? []
  if (!resources.length) return null

  const relsByFrom = groupBy(op.relationships ?? [], (r) => r.from)
  const parts: string[] = [heading(h, 'Domain Model')]

  for (const resource of resources) {
    const inner: string[] = [heading(h + 1, escape(resource.name))]
    if (resource.description) inner.push(`<p>${escape(resource.description)}</p>`)

    if (resource.attributes?.length) {
      const rows = resource.attributes
        .map(
          (a) =>
            `<tr><td>${code(a.name)}</td><td>${escape(a.type ?? '—')}</td><td>${a.required ? 'yes' : 'no'}</td><td>${escape(a.description ?? '')}</td></tr>`,
        )
        .join('')
      inner.push(
        `<table><thead><tr><th>Attribute</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`,
      )
    }

    if (resource.actions?.length) {
      const tags = resource.actions.map((a) => code(a.name)).join(', ')
      inner.push(`<p><strong>Actions:</strong> ${tags}</p>`)
    }

    const rels = relsByFrom.get(resource.name) ?? []
    if (rels.length) {
      const items = rels
        .map(
          (r) =>
            `<li>${code(r.name)} — ${escape(r.cardinality)} → ${code(r.to)} (via ${code(r.attribute)})</li>`,
        )
        .join('')
      inner.push(`<p><strong>Relationships:</strong></p><ul>${items}</ul>`)
    }

    parts.push(`<section>${inner.join('')}</section>`)
  }

  return `<section>${parts.join('')}</section>`
}
