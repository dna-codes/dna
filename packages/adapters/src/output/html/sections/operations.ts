import { DnaInput, Rule, RuleAllow } from '../types'
import { code, escape, groupBy, heading } from '../util'

export function renderOperations(dna: DnaInput, h: number): string | null {
  const op = dna.operational
  if (!op?.operations?.length) return null

  const triggersByOp = groupBy(op.triggers ?? [], (t) => t.operation ?? '')
  const rulesByOp = groupBy(op.rules ?? [], (r) => r.operation)

  const parts: string[] = [heading(h, 'Operations')]

  for (const operation of op.operations) {
    const inner: string[] = [heading(h + 1, escape(operation.name))]
    if (operation.description) inner.push(`<p>${escape(operation.description)}</p>`)

    const triggers = triggersByOp.get(operation.name) ?? []
    if (triggers.length) {
      const items = triggers
        .map((t) => {
          const desc = t.description ? ` (${escape(t.description)})` : ''
          return `<li>${escape(t.source)}${desc}</li>`
        })
        .join('')
      inner.push(`<p><strong>Triggered by:</strong></p><ul>${items}</ul>`)
    }

    const rules = rulesByOp.get(operation.name) ?? []
    if (rules.length) {
      const items = rules.map((r) => `<li>${renderRule(r)}</li>`).join('')
      inner.push(`<p><strong>Rules:</strong></p><ul>${items}</ul>`)
    }

    const changes = operation.changes ?? []
    if (changes.length) {
      const lines = changes.map((c) => {
        const set = c.set === undefined ? '' : ` → ${code(JSON.stringify(c.set))}`
        return `<li>Sets ${code(c.attribute)}${set}</li>`
      })
      inner.push(`<p><strong>Changes:</strong></p><ul>${lines.join('')}</ul>`)
    }

    parts.push(`<section>${inner.join('')}</section>`)
  }

  return `<section>${parts.join('')}</section>`
}

function renderRule(r: Rule): string {
  if (r.subtype === 'access') return `<em>Access:</em> ${renderAllow(r.allow ?? [])}`
  if (r.subtype === 'condition') {
    const parts = (r.conditions ?? []).map((c) => {
      const v = c.value === undefined ? '' : ` ${code(JSON.stringify(c.value))}`
      return `${code(c.attribute)} ${escape(c.operator)}${v}`
    })
    const expr = parts.length ? parts.join(' AND ') : escape(r.description ?? '—')
    return `<em>Condition:</em> ${expr}`
  }
  return escape(r.description ?? r.name ?? '—')
}

function renderAllow(allow: RuleAllow[]): string {
  if (!allow.length) return '—'
  return allow
    .map((a) => {
      const parts: string[] = []
      if (a.role) parts.push(`role ${code(a.role)}`)
      if (a.ownership) parts.push(`ownership`)
      if (a.flags?.length) parts.push(`flags ${code(`[${a.flags.join(', ')}]`)}`)
      return parts.join(' + ') || '—'
    })
    .join(' OR ')
}
