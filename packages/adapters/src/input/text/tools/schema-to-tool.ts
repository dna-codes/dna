import { schemas, type JsonSchema } from '@dna-codes/dna-core'

export type PrimitiveKind =
  | 'resource'
  | 'person'
  | 'position'
  | 'group'
  | 'membership'
  | 'operation'
  | 'task'
  | 'process'
  | 'trigger'
  | 'rule'

export const PRIMITIVE_KINDS: PrimitiveKind[] = [
  'resource',
  'person',
  'position',
  'group',
  'membership',
  'operation',
  'task',
  'process',
  'trigger',
  'rule',
]

export interface ToolDefinition {
  name: string
  description: string
  parameters: JsonSchema
}

export interface EnumPools {
  resources?: string[]
  persons?: string[]
  positions?: string[]
  groups?: string[]
  operations?: string[]
  tasks?: string[]
  processes?: string[]
  rules?: string[]
}

const SHARED_DEFS: Record<string, JsonSchema> = {
  'https://dna.codes/schemas/operational/attribute': schemas.operational.attribute,
  'https://dna.codes/schemas/operational/action': schemas.operational.action,
  'https://dna.codes/schemas/operational/base': schemas.operational.base,
}

export function inlineSchema(schema: JsonSchema): JsonSchema {
  return walk(schema) as JsonSchema
}

function walk(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(walk)
  if (!node || typeof node !== 'object') return node
  const obj = node as Record<string, unknown>
  if (typeof obj.$ref === 'string' && SHARED_DEFS[obj.$ref]) {
    return walk(SHARED_DEFS[obj.$ref])
  }

  // Pre-flatten allOf compositions: when a per-primitive schema extends
  // the base contract via `allOf: [{$ref: '.../base'}]`, the inlined tool
  // schema should merge the base's properties into the parent so the
  // resulting JSON-Schema has no `$ref` and no `allOf`. (The LLM tool
  // surface needs flat properties; LayeredConstructor handles auto-stamped
  // fields with placeholders.)
  if (Array.isArray(obj.allOf)) {
    const flattened = flattenAllOf(obj)
    return walkFlattened(flattened)
  }

  return walkFlattened(obj)
}

function walkFlattened(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$id' || k === '$schema' || k === 'examples') continue
    out[k] = walk(v)
  }
  return out
}

/**
 * Merge every `allOf` member's `properties`, `required`, and `type` into
 * the parent object, then drop `allOf`. Each member is `$ref`-resolved via
 * `SHARED_DEFS` first. The result has the same observable shape minus the
 * composition keyword.
 */
function flattenAllOf(parent: Record<string, unknown>): Record<string, unknown> {
  const members = (parent.allOf as unknown[]).map((m) => {
    if (m && typeof m === 'object' && typeof (m as Record<string, unknown>).$ref === 'string') {
      const ref = (m as Record<string, unknown>).$ref as string
      const target = SHARED_DEFS[ref]
      if (target) return target as Record<string, unknown>
    }
    return m as Record<string, unknown>
  })

  const mergedProperties: Record<string, unknown> = {
    ...((parent.properties as Record<string, unknown> | undefined) ?? {}),
  }
  const requiredSet = new Set<string>(
    Array.isArray(parent.required) ? (parent.required as string[]) : [],
  )

  for (const member of members) {
    if (!member || typeof member !== 'object') continue
    const memberProps = member.properties
    if (memberProps && typeof memberProps === 'object') {
      for (const [key, value] of Object.entries(memberProps as Record<string, unknown>)) {
        if (!(key in mergedProperties)) mergedProperties[key] = value
      }
    }
    if (Array.isArray(member.required)) {
      for (const r of member.required as string[]) requiredSet.add(r)
    }
  }

  const { allOf: _drop, ...rest } = parent
  void _drop
  return {
    ...rest,
    properties: mergedProperties,
    required: [...requiredSet],
  }
}

const PRIMITIVE_SCHEMA: Record<PrimitiveKind, JsonSchema> = {
  resource: schemas.operational.resource,
  person: schemas.operational.person,
  position: schemas.operational.position,
  group: schemas.operational.group,
  membership: schemas.operational.membership,
  operation: schemas.operational.operation,
  task: schemas.operational.task,
  process: schemas.operational.process,
  trigger: schemas.operational.trigger,
  rule: schemas.operational.rule,
}

const PRIMITIVE_PURPOSE: Record<PrimitiveKind, string> = {
  resource: 'Add a Resource (structure the org tracks: Loan, Invoice, Document).',
  person: 'Add a Person template (kind of human: Customer, Employee, Patient).',
  position: 'Add a Position template (Underwriter, Doctor, LeadCounsel).',
  group: 'Add a Group template (work-unit / container that scopes Positions: BankDepartment, Case).',
  membership: 'Add a Membership: a Person template is eligible to hold a Position template (optionally within a Group).',
  operation: 'Add an Operation: a Target.Action atomic unit of business activity (e.g. Loan.Approve).',
  task: 'Add a Task: an Actor (Position) performing exactly one Operation.',
  process: 'Add a Process: a named DAG of Steps (an SOP / workflow).',
  trigger: 'Add a Trigger: what initiates an Operation or Process (user, schedule, webhook, prior operation).',
  rule: 'Add a Rule: an access constraint or condition gating an Operation.',
}

export function buildPrimitiveTool(kind: PrimitiveKind): ToolDefinition {
  const schema = PRIMITIVE_SCHEMA[kind]
  const inlined = inlineSchema(schema)
  const description = `${PRIMITIVE_PURPOSE[kind]} ${schema.title ?? ''}`.trim()
  return {
    name: `add_${kind}`,
    description,
    parameters: { ...inlined, additionalProperties: false },
  }
}

export const FINALIZE_TOOL: ToolDefinition = {
  name: 'finalize',
  description:
    'Signal that the Operational DNA is complete and run full schema validation. Call this exactly once after every Operational primitive named in the input has been added. Returns { ok: true } on success or { ok: false, errors } if validation fails (you may then issue corrective add_* calls and call finalize again).',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

export function buildLayeredTools(): ToolDefinition[] {
  return [...PRIMITIVE_KINDS.map(buildPrimitiveTool), FINALIZE_TOOL]
}

const REFERENCE_FIELDS: Record<PrimitiveKind, Partial<Record<string, keyof EnumPools>>> = {
  resource: { parent: 'resources' },
  person: { parent: 'persons', resource: 'resources' },
  position: { parent: 'positions', resource: 'resources' },
  group: { parent: 'groups' },
  membership: { person: 'persons', position: 'positions', group: 'groups' },
  operation: { target: 'resources' },
  task: { actor: 'positions' },
  process: { operator: 'positions' },
  trigger: {},
  rule: {},
}

/**
 * Returns a copy of `tools` with cross-primitive string fields narrowed to enum
 * lists drawn from the in-progress draft. Use this between tool-call rounds when
 * a provider supports per-round tool re-registration; otherwise the runtime
 * `LayeredConstructor.handle()` enforces the same checks via structured errors.
 */
export function injectEnums(
  tools: ToolDefinition[],
  pools: EnumPools,
): ToolDefinition[] {
  return tools.map((tool) => {
    const kind = toolToKind(tool.name)
    if (!kind) return tool
    const refs = REFERENCE_FIELDS[kind]
    if (!refs) return tool
    const params = JSON.parse(JSON.stringify(tool.parameters)) as JsonSchema
    const props = (params.properties ?? {}) as Record<string, JsonSchema>
    for (const [field, poolKey] of Object.entries(refs)) {
      if (!poolKey) continue
      const pool = pools[poolKey] ?? []
      if (pool.length === 0) continue
      if (props[field]) {
        props[field] = { ...props[field], enum: [...pool] }
      }
    }
    params.properties = props
    return { ...tool, parameters: params }
  })
}

function toolToKind(name: string): PrimitiveKind | null {
  if (!name.startsWith('add_')) return null
  const k = name.slice(4) as PrimitiveKind
  return PRIMITIVE_KINDS.includes(k) ? k : null
}
