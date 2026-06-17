/**
 * Loose structural types describing the DNA shapes this renderer reads.
 * Only fields actually consumed are modeled; callers may pass partial DNA.
 */

export interface DnaInput {
  operational?: OperationalDna
}

export interface OperationalDna {
  domain: OperationalDomain
  domains?: OperationalDomain[]
  resources?: Resource[]
  operations?: Operation[]
  rules?: Rule[]
  triggers?: Trigger[]
  relationships?: Relationship[]
  tasks?: Task[]
  processes?: Process[]
}

export interface OperationalDomain {
  name: string
  path?: string
  description?: string
}

export interface Resource {
  name: string
  description?: string
  attributes?: Attribute[]
  actions?: Action[]
  parent?: string
  scope?: string
  memberships?: Membership[]
}

export interface Membership {
  role: string
  in: string
  description?: string
}

export interface Attribute {
  name: string
  type?: string
  required?: boolean
  description?: string
}

export interface Action {
  name: string
  description?: string
}

export interface Operation {
  name: string
  resource: string
  action: string
  description?: string
  changes?: OperationChange[]
}

export interface OperationChange {
  attribute: string
  set?: unknown
}

export interface Rule {
  name?: string
  operation: string
  rule_type?: 'access' | 'condition'
  description?: string
  allow?: RuleAllow[]
  conditions?: RuleCondition[]
}

export interface RuleAllow {
  role?: string
  ownership?: boolean
  flags?: string[]
}

export interface RuleCondition {
  attribute: string
  operator: string
  value?: unknown
}

export interface Trigger {
  operation?: string
  process?: string
  source: string
  description?: string
  schedule?: string
  event?: string
  after?: string
}

export interface Relationship {
  name: string
  from: string
  to: string
  attribute: string
  cardinality: string
  description?: string
}

export interface Task {
  name: string
  actor: string
  operation: string
  description?: string
}

export interface Process {
  name: string
  description?: string
  operator?: string
  startStep?: string
  steps?: ProcessStep[]
}

export interface ProcessStep {
  id: string
  task: string
  depends_on?: string[]
  conditions?: string[]
  else?: string
}

// ---------------------------------------------------------------------------
// Public render options and outputs.
// ---------------------------------------------------------------------------

// `Unit`, `Style`, `StyleMap`, and `DEFAULT_STYLES` are canonical contracts
// shared with integrations and other consumers; they live in `@dna-codes/dna-core`.
export { type Unit, type Style, type StyleMap, DEFAULT_STYLES } from '@dna-codes/dna-core'
import type { StyleMap } from '@dna-codes/dna-core'

export interface RenderOptions {
  /** Document title. Defaults to the operational domain's path or name. */
  title?: string
  /** Unit → style map. Default: `{ operation: 'user-story' }`. */
  styles?: StyleMap
  /**
   * Rename canonical primitive labels (typically the plural collection name) for
   * company-friendly output. The DNA schema vocabulary stays canonical
   * (Resource/Person/Role/Group/Process) — only the rendered text changes.
   *
   * Currently a no-op for this adapter (no primitive-count or top-level
   * collection labels are emitted) — present for API parity with
   * `@dna-codes/dna-output-markdown` and `@dna-codes/dna-output-html`.
   *
   * @example { Persons: 'Individuals', Roles: 'Positions' }
   */
  rename?: Record<string, string>
}

export interface RenderManyOptions {
  /** Unit → style map. Default: `{ operation: 'user-story' }`. */
  styles?: StyleMap
  /**
   * Rename canonical primitive labels (typically the plural collection name) for
   * company-friendly output. The DNA schema vocabulary stays canonical
   * (Resource/Person/Role/Group/Process) — only the rendered text changes.
   *
   * Currently a no-op for this adapter (no primitive-count or top-level
   * collection labels are emitted) — present for API parity with
   * `@dna-codes/dna-output-markdown` and `@dna-codes/dna-output-html`.
   *
   * @example { Persons: 'Individuals', Roles: 'Positions' }
   */
  rename?: Record<string, string>
}

/**
 * A single rendered document — shaped for pushing to an issue tracker,
 * docs platform, or database row. `id` is `{unit}-{slug}` (e.g.
 * `operation-loan-apply`) so multi-unit results can't collide.
 */
export interface TextDocument {
  id: string
  title: string
  body: string
}
