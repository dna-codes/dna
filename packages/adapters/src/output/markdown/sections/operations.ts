import { DnaInput, Rule, RuleAllow } from '../types'
import { hashes } from '../util'

export function renderOperations(dna: DnaInput, h: number): string | null {
  const op = dna.operational
  if (!op?.operations?.length) return null

  const triggersByOp = groupBy(op.triggers ?? [], (t) => t.operation ?? '')
  const rulesByOp = groupBy(op.rules ?? [], (r) => r.operation)

  const lines: string[] = [`${hashes(h)} Operations`]

  for (const operation of op.operations) {
    lines.push('', `${hashes(h + 1)} ${operation.name}`)
    if (operation.description) lines.push('', operation.description)

    const triggers = triggersByOp.get(operation.name) ?? []
    if (triggers.length) {
      lines.push('', '**Triggered by:**')
      for (const t of triggers) {
        const desc = t.description ? ` (${t.description})` : ''
        lines.push(`- ${t.source}${desc}`)
      }
    }

    const rules = rulesByOp.get(operation.name) ?? []
    if (rules.length) {
      lines.push('', '**Rules:**')
      for (const r of rules) lines.push(`- ${renderRule(r)}`)
    }

    const changes = operation.changes ?? []
    if (changes.length) {
      lines.push('', '**Changes:**')
      for (const c of changes) {
        const set = c.set === undefined ? '' : ` → \`${JSON.stringify(c.set)}\``
        lines.push(`- Sets \`${c.attribute}\`${set}`)
      }
    }
  }

  return lines.join('\n')
}

function renderRule(r: Rule): string {
  if (r.subtype === 'access') return `*Access:* ${renderAllow(r.allow ?? [])}`
  if (r.subtype === 'condition') {
    const parts = (r.conditions ?? []).map((c) => {
      const v = c.value === undefined ? '' : ` ${JSON.stringify(c.value)}`
      return `\`${c.attribute}\` ${c.operator}${v}`
    })
    const expr = parts.length ? parts.join(' AND ') : (r.description ?? '—')
    return `*Condition:* ${expr}`
  }
  return r.description ?? r.name ?? '—'
}

function renderAllow(allow: RuleAllow[]): string {
  if (!allow.length) return '—'
  return allow
    .map((a) => {
      const parts: string[] = []
      if (a.role) parts.push(`role \`${a.role}\``)
      if (a.ownership) parts.push(`ownership`)
      if (a.flags?.length) parts.push(`flags \`[${a.flags.join(', ')}]\``)
      return parts.join(' + ') || '—'
    })
    .join(' OR ')
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
