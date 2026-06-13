import { DnaInput, UiComponent, UiOperation } from '../types'
import { hashes } from '../util'

/**
 * Renders the Product UI layer: the navigable Workflow groupings, the
 * Page -> Section -> Component -> Element structural hierarchy, and the
 * behavioral UIOperation entries (trigger + effects).
 */
export function renderProductUi(dna: DnaInput, h: number): string | null {
  const ui = dna.productUi
  if (!ui) return null

  const hasContent =
    (ui.workflows?.length ?? 0) > 0 ||
    (ui.pages?.length ?? 0) > 0 ||
    (ui.operations?.length ?? 0) > 0
  if (!hasContent) return null

  const lines: string[] = [`${hashes(h)} Product UI`]

  // ── Workflows ──────────────────────────────────────────────────────────
  if (ui.workflows?.length) {
    lines.push('', `${hashes(h + 1)} Workflows`)
    for (const wf of ui.workflows) {
      const res = wf.resource ? ` (${wf.resource})` : ''
      lines.push('', `- **${wf.name}**${res}${wf.description ? ` — ${wf.description}` : ''}`)
      if (wf.pages?.length) {
        lines.push(`  - Pages: ${wf.pages.join(' → ')}`)
      }
    }
  }

  // ── Page → Section → Component → Element hierarchy ──────────────────────
  if (ui.pages?.length) {
    lines.push('', `${hashes(h + 1)} Pages`)
    for (const page of ui.pages) {
      const res = page.resource ? ` (${page.resource})` : ''
      lines.push('', `${hashes(h + 2)} ${page.name}${res}`)

      for (const section of page.sections ?? []) {
        const role = section.role ? ` _[${section.role}]_` : ''
        lines.push('', `- **${section.name}**${role}`)
        for (const component of section.components ?? []) {
          lines.push(...renderComponent(component, 1))
        }
      }

      // Page-level components (outside any section)
      for (const component of page.components ?? []) {
        lines.push(...renderComponent(component, 0))
      }
    }
  }

  // ── UIOperations ───────────────────────────────────────────────────────
  if (ui.operations?.length) {
    lines.push('', `${hashes(h + 1)} UI Operations`)
    for (const op of ui.operations) {
      lines.push('', ...renderOperation(op))
    }
  }

  return lines.join('\n')
}

function renderComponent(component: UiComponent, depth: number): string[] {
  const indent = '  '.repeat(depth + 1)
  const type = component.type ? ` _${component.type}_` : ''
  const op = component.operation ? ` → ${component.operation}` : ''
  const out = [`${indent}- ${component.name}${type}${op}`]
  for (const el of component.elements ?? []) {
    const field = el.field ? ` ⇒ ${el.field}` : ''
    const elType = el.type ? ` _${el.type}_` : ''
    out.push(`${indent}  - ${el.name}${elType}${field}`)
  }
  return out
}

function renderOperation(op: UiOperation): string[] {
  const trigger = op.trigger ? `${op.trigger.component}.${op.trigger.event}` : '—'
  const out = [`- **${op.name}** \`on ${trigger}\`${op.description ? ` — ${op.description}` : ''}`]
  for (const effect of op.effects ?? []) {
    out.push(`  - ${describeEffect(effect)}`)
  }
  return out
}

function describeEffect(effect: { type: string; to?: string; operation?: string; target?: string; component?: string; value?: unknown }): string {
  switch (effect.type) {
    case 'navigate':
      return `navigate → ${effect.to}`
    case 'api-call':
      return `call ${effect.operation}`
    case 'state-change':
      return `set ${effect.target}${effect.value !== undefined ? ` = ${JSON.stringify(effect.value)}` : ''}`
    case 'render':
      return `render ${effect.component}`
    default:
      return effect.type
  }
}
