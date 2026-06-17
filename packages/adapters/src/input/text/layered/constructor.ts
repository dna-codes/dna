import {
  DnaValidator,
  addGroup,
  addMembership,
  addOperation,
  addPerson,
  addProcess,
  addResource,
  addPosition,
  addRule,
  addTask,
  addTrigger,
  createOperationalDna,
  type Conflict,
  type OperationalDNA,
  type ValidationResult,
} from '@dna-codes/dna-core'
import {
  PRIMITIVE_KINDS,
  buildLayeredTools,
  type EnumPools,
  type PrimitiveKind,
  type ToolDefinition,
} from '../tools/schema-to-tool'

export interface LayeredConstructorOptions {
  /**
   * Domain metadata wrapping the noun primitives. Defaults to `{ name: 'domain' }`.
   * The constructor never asks the LLM for this; it's set up-front so the model
   * can focus on primitives.
   */
  domain?: { name: string; path?: string; description?: string }
  /**
   * Maximum total tool calls before the constructor throws. Default 50.
   */
  maxToolCalls?: number
  /**
   * Maximum number of `finalize` retries (after a failed validation). Default 3.
   */
  maxFinalizeRetries?: number
}

export interface ToolCallRequest {
  name: string
  args: Record<string, unknown>
}

export type ToolCallResult =
  | { ok: true; finalized?: false; primitive?: PrimitiveKind; name?: string; message?: string; conflicts?: Conflict[] }
  | { ok: true; finalized: true; document: Record<string, unknown>; conflicts: Conflict[] }
  | {
      ok: false
      error:
        | 'unknown_tool'
        | 'duplicate_call'
        | 'schema_violation'
        | 'unknown_resource'
        | 'unknown_person'
        | 'unknown_position'
        | 'unknown_group'
        | 'unknown_operation'
        | 'unknown_target'
        | 'unknown_actor'
        | 'unknown_operator'
        | 'unknown_task'
        | 'unknown_process'
        | 'unknown_rule'
        | 'invalid_args'
        | 'iteration_cap_reached'
        | 'finalize_failed'
        | 'finalize_retries_exhausted'
      message: string
      details?: unknown
      available?: string[]
    }

export interface LayeredResult {
  document: Record<string, unknown>
  /** Composed-on-add conflicts accumulated across all `add_*` tool calls. */
  conflicts: Conflict[]
}

type AddBuilder = (dna: OperationalDNA, primitive: never, opts?: { validate?: boolean }) => { dna: OperationalDNA; conflicts: Conflict[] }

/**
 * Placeholder values for the base-contract fields the LLM tool surface
 * doesn't supply. Builders auto-stamp the real `id`, `type`, `version` on
 * compose; these are only used to satisfy the JSON-Schema validator during
 * the up-front `validatePrimitive` check.
 */
const PLACEHOLDER_UUID = '00000000-0000-4000-8000-000000000000'
const PLACEHOLDER_VERSION = '1'

const ADD_BUILDER: Record<PrimitiveKind, AddBuilder> = {
  resource: addResource as AddBuilder,
  person: addPerson as AddBuilder,
  position: addPosition as AddBuilder,
  group: addGroup as AddBuilder,
  membership: addMembership as AddBuilder,
  operation: addOperation as AddBuilder,
  task: addTask as AddBuilder,
  process: addProcess as AddBuilder,
  trigger: addTrigger as AddBuilder,
  rule: addRule as AddBuilder,
}

export class LayeredConstructor {
  private readonly tools_: ToolDefinition[]
  private readonly maxToolCalls: number
  private readonly maxFinalizeRetries: number
  private dna: OperationalDNA
  private readonly accumulatedConflicts: Conflict[] = []
  private readonly validator = new DnaValidator()
  private readonly transcript: { name: string; args: Record<string, unknown>; result: ToolCallResult }[] = []
  private callCount = 0
  private finalizeAttempts = 0
  private lastCallSig: string | null = null
  private finalized = false

  constructor(options: LayeredConstructorOptions = {}) {
    const domain = options.domain ?? { name: 'domain' }
    this.dna = createOperationalDna({
      domain: {
        name: domain.name,
        ...(domain.path ? { path: domain.path } : {}),
        ...(domain.description ? { description: domain.description } : {}),
      },
    })
    this.tools_ = buildLayeredTools()
    this.maxToolCalls = options.maxToolCalls ?? 50
    this.maxFinalizeRetries = options.maxFinalizeRetries ?? 3
  }

  /** Tool definitions in a provider-neutral shape. */
  tools(): ToolDefinition[] {
    return this.tools_.map((t) => ({ ...t, parameters: { ...t.parameters } }))
  }

  /** Pools of declared primitive names — useful for narrowing tool schemas mid-flight. */
  pools(): EnumPools {
    return {
      resources: namesOf(this.dna.resources),
      persons: namesOf(this.dna.persons),
      positions: namesOf(this.dna.positions),
      groups: namesOf(this.dna.groups),
      operations: namesOf(this.dna.operations),
      tasks: namesOf(this.dna.tasks),
      processes: namesOf(this.dna.processes),
      rules: namesOf(this.dna.rules),
    }
  }

  /**
   * The assembled document plus any composed-on-add conflicts. The
   * `document` field matches the shape `cleanDocument()` used to return —
   * it's the merged DNA stripped of empty collections. The `conflicts`
   * field accumulates scalar disagreements across all `add_*` tool calls
   * (an LLM re-emitting the same primitive with conflicting scalars).
   */
  result(): LayeredResult {
    return {
      document: cleanDocument(this.dna),
      conflicts: [...this.accumulatedConflicts],
    }
  }

  hasFinalized(): boolean {
    return this.finalized
  }

  toolCallCount(): number {
    return this.callCount
  }

  toolCallTranscript(): { name: string; args: Record<string, unknown>; result: ToolCallResult }[] {
    return [...this.transcript]
  }

  /** Process a tool call from the LLM (or any caller). Synchronous and side-effect-free on errors. */
  handle(call: ToolCallRequest): ToolCallResult {
    if (this.callCount >= this.maxToolCalls) {
      const result: ToolCallResult = {
        ok: false,
        error: 'iteration_cap_reached',
        message: `Iteration cap of ${this.maxToolCalls} tool calls reached.`,
      }
      this.recordCall(call, result, /*increment*/ false)
      throw new Error(result.message)
    }

    const sig = signatureFor(call)
    if (sig !== null && sig === this.lastCallSig) {
      const result: ToolCallResult = {
        ok: false,
        error: 'duplicate_call',
        message: `Duplicate consecutive tool call rejected: ${call.name}.`,
      }
      this.recordCall(call, result, /*increment*/ true)
      this.lastCallSig = sig
      return result
    }

    let result: ToolCallResult
    if (call.name === 'finalize') {
      result = this.handleFinalize()
    } else if (call.name.startsWith('add_')) {
      const kind = call.name.slice(4) as PrimitiveKind
      if (!PRIMITIVE_KINDS.includes(kind)) {
        result = {
          ok: false,
          error: 'unknown_tool',
          message: `Unknown tool: "${call.name}". Expected one of: ${this.tools_.map((t) => t.name).join(', ')}.`,
        }
      } else {
        result = this.handleAdd(kind, call.args)
      }
    } else {
      result = {
        ok: false,
        error: 'unknown_tool',
        message: `Unknown tool: "${call.name}". Expected one of: ${this.tools_.map((t) => t.name).join(', ')}.`,
      }
    }

    this.recordCall(call, result, /*increment*/ true)
    this.lastCallSig = sig
    return result
  }

  private recordCall(call: ToolCallRequest, result: ToolCallResult, increment: boolean): void {
    if (increment) this.callCount += 1
    this.transcript.push({ name: call.name, args: call.args, result })
  }

  private handleAdd(kind: PrimitiveKind, args: Record<string, unknown>): ToolCallResult {
    if (!args || typeof args !== 'object') {
      return { ok: false, error: 'invalid_args', message: `add_${kind}: args must be an object.` }
    }

    // Validate up-front so the LLM gets a structured `schema_violation`
    // response. Builders validate by default too, but they throw on failure
    // — we want a soft error here, not an exception.
    const validation = this.validatePrimitive(kind, args)
    if (!validation.valid) {
      return {
        ok: false,
        error: 'schema_violation',
        message: `add_${kind}: schema validation failed.`,
        details: validation.errors,
      }
    }

    const refError = this.checkReferences(kind, args)
    if (refError) return refError

    // Same-name composition: if a primitive with this name+kind already
    // exists in the running DNA, reuse its id so the auto-stamped UUIDs
    // don't surface as a spurious scalar conflict at merge time. (Same-name
    // primitives compose by design; only their user-facing scalars are
    // genuine conflicts.)
    const composeArgs = this.reuseExistingId(kind, args)

    // Compose into the running DNA via the matching builder. We just
    // validated; pass `validate: false` to skip a redundant pass.
    const builder = ADD_BUILDER[kind]
    const composed = builder(this.dna, composeArgs as never, { validate: false })
    this.dna = composed.dna
    if (composed.conflicts.length > 0) {
      this.accumulatedConflicts.push(...composed.conflicts)
    }

    const name = typeof args.name === 'string' ? args.name : '<unnamed>'
    return {
      ok: true,
      primitive: kind,
      name,
      message: `Added ${kind} "${name}".`,
      ...(composed.conflicts.length > 0 ? { conflicts: composed.conflicts } : {}),
    }
  }

  /**
   * If a primitive with the given `kind` and `name` already exists in the
   * running DNA, return a copy of `args` with its `id` field set to the
   * existing id. Otherwise return `args` unchanged. Prevents merge() from
   * reporting a spurious id-scalar conflict when the same name is composed
   * twice (a supported pattern; only user-facing scalars should conflict).
   */
  private reuseExistingId(kind: PrimitiveKind, args: Record<string, unknown>): Record<string, unknown> {
    if (typeof args.id === 'string' && args.id.length > 0) return args
    const name = typeof args.name === 'string' ? args.name : null
    if (!name) return args
    const existing = this.findPrimitiveByName(kind, name)
    if (!existing) return args
    return { ...args, id: existing.id }
  }

  private findPrimitiveByName(kind: PrimitiveKind, name: string): { id: string } | null {
    const collection = this.collectionFor(kind)
    for (const entry of collection) {
      if (
        entry &&
        typeof entry === 'object' &&
        (entry as Record<string, unknown>).name === name &&
        typeof (entry as Record<string, unknown>).id === 'string'
      ) {
        return { id: (entry as Record<string, unknown>).id as string }
      }
    }
    return null
  }

  private collectionFor(kind: PrimitiveKind): unknown[] {
    switch (kind) {
      case 'resource': return (this.dna.resources as unknown[]) ?? []
      case 'person': return (this.dna.persons as unknown[]) ?? []
      case 'position': return (this.dna.positions as unknown[]) ?? []
      case 'group': return (this.dna.groups as unknown[]) ?? []
      case 'membership': return (this.dna.memberships as unknown[]) ?? []
      case 'operation': return (this.dna.operations as unknown[]) ?? []
      case 'task': return (this.dna.tasks as unknown[]) ?? []
      case 'process': return (this.dna.processes as unknown[]) ?? []
      case 'trigger': return (this.dna.triggers as unknown[]) ?? []
      case 'rule': return (this.dna.rules as unknown[]) ?? []
      default: return []
    }
  }

  private validatePrimitive(kind: PrimitiveKind, args: Record<string, unknown>): ValidationResult {
    const schemaId = `operational/${kind}`
    // The base contract requires `id`, `type`, `version` on every primitive,
    // but builders auto-stamp those downstream — callers (and the LLM tool
    // surface) supply just the primitive-specific args. Augment with safe
    // placeholders for the auto-stamped fields before validating so we get a
    // clean `schema_violation` only for per-primitive shape errors.
    const augmented = {
      id: PLACEHOLDER_UUID,
      type: kind,
      version: PLACEHOLDER_VERSION,
      ...args,
    }
    return this.validator.validate(augmented, schemaId)
  }

  private checkReferences(kind: PrimitiveKind, args: Record<string, unknown>): ToolCallResult | null {
    const pools = this.pools()
    const string = (k: string): string | undefined =>
      typeof args[k] === 'string' ? (args[k] as string) : undefined

    switch (kind) {
      case 'resource': {
        const parent = string('parent')
        if (parent && !(pools.resources ?? []).includes(parent)) {
          return refError('unknown_resource', 'parent', parent, pools.resources ?? [])
        }
        return null
      }
      case 'person': {
        const parent = string('parent')
        if (parent && !(pools.persons ?? []).includes(parent)) {
          return refError('unknown_person', 'parent', parent, pools.persons ?? [])
        }
        const resource = string('resource')
        if (resource && !(pools.resources ?? []).includes(resource)) {
          return refError('unknown_resource', 'resource', resource, pools.resources ?? [])
        }
        return null
      }
      case 'position': {
        const parent = string('parent')
        if (parent && !(pools.positions ?? []).includes(parent)) {
          return refError('unknown_position', 'parent', parent, pools.positions ?? [])
        }
        const resource = string('resource')
        if (resource && !(pools.resources ?? []).includes(resource)) {
          return refError('unknown_resource', 'resource', resource, pools.resources ?? [])
        }
        const scope = args.scope
        const scopes = typeof scope === 'string' ? [scope] : Array.isArray(scope) ? scope.filter((s): s is string => typeof s === 'string') : []
        const scopeable = new Set([...(pools.groups ?? []), ...(pools.persons ?? [])])
        for (const s of scopes) {
          if (!scopeable.has(s)) {
            return refError('unknown_group', 'scope', s, [...scopeable])
          }
        }
        return null
      }
      case 'group': {
        const parent = string('parent')
        if (parent && !(pools.groups ?? []).includes(parent)) {
          return refError('unknown_group', 'parent', parent, pools.groups ?? [])
        }
        return null
      }
      case 'membership': {
        const person = string('person')
        if (person && !(pools.persons ?? []).includes(person)) {
          return refError('unknown_person', 'person', person, pools.persons ?? [])
        }
        const position = string('position')
        if (position && !(pools.positions ?? []).includes(position)) {
          return refError('unknown_position', 'position', position, pools.positions ?? [])
        }
        const group = string('group')
        const groupable = new Set([...(pools.groups ?? []), ...(pools.persons ?? [])])
        if (group && !groupable.has(group)) {
          return refError('unknown_group', 'group', group, [...groupable])
        }
        return null
      }
      case 'operation': {
        const target = string('target')
        const targets = new Set([
          ...(pools.resources ?? []),
          ...(pools.persons ?? []),
          ...(pools.positions ?? []),
          ...(pools.groups ?? []),
          ...(pools.processes ?? []),
        ])
        if (target && !targets.has(target)) {
          return refError('unknown_target', 'target', target, [...targets])
        }
        return null
      }
      case 'task': {
        const actor = string('actor')
        const actors = new Set([...(pools.positions ?? []), ...(pools.persons ?? [])])
        if (actor && !actors.has(actor)) {
          return refError('unknown_actor', 'actor', actor, [...actors])
        }
        const operation = string('operation')
        if (operation && !(pools.operations ?? []).includes(operation)) {
          return refError('unknown_operation', 'operation', operation, pools.operations ?? [])
        }
        return null
      }
      case 'process': {
        const operator = string('operator')
        const operators = new Set([...(pools.positions ?? []), ...(pools.persons ?? [])])
        if (operator && !operators.has(operator)) {
          return refError('unknown_operator', 'operator', operator, [...operators])
        }
        const taskNames = new Set(pools.tasks ?? [])
        const steps = Array.isArray(args.steps) ? args.steps : []
        for (const step of steps) {
          if (!step || typeof step !== 'object') continue
          const stepObj = step as Record<string, unknown>
          const taskRef = stepObj.task
          if (typeof taskRef === 'string' && !taskNames.has(taskRef)) {
            return refError('unknown_task', `steps[].task`, taskRef, [...taskNames])
          }
          const conditions = Array.isArray(stepObj.conditions) ? stepObj.conditions : []
          for (const cond of conditions) {
            if (typeof cond === 'string' && !(pools.rules ?? []).includes(cond)) {
              return refError('unknown_rule', `steps[].conditions`, cond, pools.rules ?? [])
            }
          }
        }
        return null
      }
      case 'trigger': {
        const operation = string('operation')
        if (operation && !(pools.operations ?? []).includes(operation)) {
          return refError('unknown_operation', 'operation', operation, pools.operations ?? [])
        }
        const process = string('process')
        if (process && !(pools.processes ?? []).includes(process)) {
          return refError('unknown_process', 'process', process, pools.processes ?? [])
        }
        const after = string('after')
        if (after && !(pools.operations ?? []).includes(after)) {
          return refError('unknown_operation', 'after', after, pools.operations ?? [])
        }
        return null
      }
      case 'rule': {
        const operation = string('operation')
        if (operation && !(pools.operations ?? []).includes(operation)) {
          return refError('unknown_operation', 'operation', operation, pools.operations ?? [])
        }
        return null
      }
    }
    return null
  }

  private handleFinalize(): ToolCallResult {
    this.finalizeAttempts += 1
    const document = cleanDocument(this.dna)
    const result = this.validator.validate(document, 'operational')
    const cross = this.validator.validateCrossLayer({ operational: document })
    if (result.valid && cross.valid) {
      this.finalized = true
      return { ok: true, finalized: true, document, conflicts: [...this.accumulatedConflicts] }
    }
    if (this.finalizeAttempts >= this.maxFinalizeRetries) {
      return {
        ok: false,
        error: 'finalize_retries_exhausted',
        message: `Finalize failed ${this.finalizeAttempts} times; giving up.`,
        details: { schemaErrors: result.errors, crossLayerErrors: cross.errors },
      }
    }
    return {
      ok: false,
      error: 'finalize_failed',
      message: `Validation failed (attempt ${this.finalizeAttempts}/${this.maxFinalizeRetries}). Issue corrective add_* calls and call finalize again.`,
      details: { schemaErrors: result.errors, crossLayerErrors: cross.errors },
    }
  }
}

function refError(
  code:
    | 'unknown_resource'
    | 'unknown_person'
    | 'unknown_position'
    | 'unknown_group'
    | 'unknown_operation'
    | 'unknown_target'
    | 'unknown_actor'
    | 'unknown_operator'
    | 'unknown_task'
    | 'unknown_process'
    | 'unknown_rule',
  field: string,
  value: string,
  available: string[],
): ToolCallResult {
  return {
    ok: false,
    error: code,
    message: `Field "${field}" references "${value}" which is not declared. Available: ${available.length ? available.join(', ') : '(none yet)'}.`,
    available,
  }
}

function signatureFor(call: ToolCallRequest): string | null {
  try {
    return `${call.name}|${stableStringify(call.args ?? {})}`
  } catch {
    return null
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

function cleanDocument(dna: OperationalDNA): Record<string, unknown> {
  const out: Record<string, unknown> = { domain: cleanDomain(dna.domain) }
  const sections = ['resources', 'persons', 'positions', 'groups', 'memberships', 'operations', 'triggers', 'rules', 'tasks', 'processes'] as const
  for (const key of sections) {
    const arr = dna[key]
    if (Array.isArray(arr) && arr.length > 0) out[key] = arr
  }
  return out
}

function cleanDomain(d: OperationalDNA['domain']): Record<string, unknown> {
  const out: Record<string, unknown> = { name: d.name }
  if (d.path) out.path = d.path
  if (d.description) out.description = d.description
  return out
}

function namesOf(items: unknown): string[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (item as { name?: unknown }).name)
    .filter((n): n is string => typeof n === 'string')
}
