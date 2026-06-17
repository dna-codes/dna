/**
 * @dna-codes/dna-output-text — render DNA as plain prose.
 *
 *   render(dna, options?)     → string                      // one combined document
 *   renderMany(dna, options?) → Array<{id, title, body}>    // one document per unit
 *
 * Both accept a `styles` map: `{ operation: 'user-story' | 'gherkin' | 'product-dna', ... }`.
 * The key set determines which unit types are emitted; the value picks the
 * body template. Default is `{ operation: 'user-story' }`.
 *
 * `user-story` and `gherkin` are action-shaped and only fit Operation —
 * Resource and Process always render as `product-dna` regardless of the style
 * requested.
 */

import { operationTitle, renderOperation } from './operation'
import { resourceTitle, renderResource } from './resource'
import { processTitle, renderProcess } from './process'
import {
  Operation,
  DEFAULT_STYLES,
  DnaInput,
  Resource,
  OperationalDna,
  OperationalDomain,
  Process,
  RenderManyOptions,
  RenderOptions,
  Style,
  StyleMap,
  TextDocument,
  Unit,
} from './types'
import { joinSections, slugify } from './util'

const UNIT_ORDER: Unit[] = ['operation', 'resource', 'process']

export function render(dna: DnaInput, options: RenderOptions = {}): string {
  const op = dna.operational
  if (!op) return ''

  const styles = options.styles ?? DEFAULT_STYLES
  const title = options.title ?? op.domain.path ?? op.domain.name
  const intro = op.domain.description

  const sections: (string | null)[] = [
    title ? `# ${title}` : null,
    intro ?? null,
  ]

  for (const unit of UNIT_ORDER) {
    if (!styles[unit]) continue
    sections.push(renderUnitSection(unit, styles[unit]!, op))
  }

  const body = joinSections(sections)
  return body ? `${body}\n` : ''
}

export function renderMany(
  dna: DnaInput,
  options: RenderManyOptions = {},
): TextDocument[] {
  const styles = options.styles ?? DEFAULT_STYLES
  const op = dna.operational
  if (!op) return []

  const docs: TextDocument[] = []
  for (const unit of UNIT_ORDER) {
    const style = styles[unit]
    if (!style) continue
    docs.push(...unitDocs(unit, style, op))
  }
  return docs
}

function unitDocs(unit: Unit, style: Style, op: OperationalDna): TextDocument[] {
  switch (unit) {
    case 'operation':
      return (op.operations ?? []).map((o) => operationDoc(o, op, style))
    case 'resource':
      return (op.resources ?? []).map((r) => resourceDoc(r, op))
    case 'process':
      return (op.processes ?? []).map((p) => processDoc(p, op))
  }
}

function operationDoc(op: Operation, dna: OperationalDna, style: Style): TextDocument {
  return {
    id: `operation-${slugify(op.name)}`,
    title: operationTitle(op),
    body: renderOperation(op, dna, style),
  }
}

function resourceDoc(r: Resource, op: OperationalDna): TextDocument {
  return {
    id: `resource-${slugify(r.name)}`,
    title: resourceTitle(r),
    body: renderResource(r, op),
  }
}

function processDoc(p: Process, op: OperationalDna): TextDocument {
  return {
    id: `process-${slugify(p.name)}`,
    title: processTitle(p),
    body: renderProcess(p, op),
  }
}

function renderUnitSection(unit: Unit, style: Style, op: OperationalDna): string | null {
  const docs = unitDocs(unit, style, op)
  if (!docs.length) return null
  const heading = unitHeading(unit)
  const parts = [`## ${heading}`]
  for (const d of docs) {
    parts.push(`### ${d.title}`)
    if (d.body) parts.push(d.body)
  }
  return parts.join('\n\n')
}

function unitHeading(unit: Unit): string {
  if (unit === 'operation') return 'Operations'
  if (unit === 'resource') return 'Domain model'
  return 'Processes'
}

export { Style, StyleMap, Unit, TextDocument, RenderOptions, RenderManyOptions } from './types'
export { DEFAULT_STYLES } from './types'
export type { DnaInput } from './types'
