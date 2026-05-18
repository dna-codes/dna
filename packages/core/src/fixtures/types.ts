/**
 * Loose structural types for DNA fixture data.
 *
 * Intentionally a superset of what any single adapter consumes — covers
 * every field a canonical fixture might populate. Adapters with narrower
 * local types assign these fixtures via structural subtyping.
 */

export interface DnaInput {
  operational?: OperationalDna
  productCore?: ProductCoreDna
  productApi?: ProductApiDna
  productUi?: ProductUiDna
  technical?: TechnicalDna
}

export interface OperationalDna {
  domain: OperationalDomain
  memberships?: Membership[]
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
  resources?: Resource[]
  persons?: Person[]
  roles?: Role[]
  groups?: Group[]
  domains?: OperationalDomain[]
}

/**
 * Universal base fields stamped on every Operational primitive. Optional
 * in the loose fixture types so adapter fixtures stay readable; the strict
 * shapes in `types/operational.ts` mark them required.
 */
interface BaseFields {
  id?: string
  type?: string
  version?: string
}

export interface Resource extends BaseFields {
  name: string
  description?: string
  domain?: string
  attributes?: Attribute[]
  actions?: Action[]
  parent?: string
}

export interface Person extends BaseFields {
  name: string
  description?: string
  domain?: string
  attributes?: Attribute[]
  actions?: Action[]
  parent?: string
  resource?: string
}

export interface Group extends BaseFields {
  name: string
  description?: string
  domain?: string
  attributes?: Attribute[]
  actions?: Action[]
  parent?: string
}

export interface Role extends BaseFields {
  name: string
  description?: string
  domain?: string
  scope?: string | string[]
  parent?: string
  system?: boolean
  resource?: string
  attributes?: Attribute[]
  actions?: Action[]
}

export interface Membership extends BaseFields {
  name: string
  description?: string
  domain?: string
  person: string
  role: string
  group?: string
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
  type?: 'read' | 'write' | 'destructive'
  idempotent?: boolean
}

export interface Operation extends BaseFields {
  name: string
  target: string
  action: string
  description?: string
  changes?: OperationChange[]
}

export interface OperationChange {
  attribute: string
  set?: unknown
}

export interface Rule extends BaseFields {
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

export interface Trigger extends BaseFields {
  name?: string
  operation?: string
  process?: string
  source: string
  description?: string
  schedule?: string
  event?: string
  after?: string
}

export interface Field {
  name: string
  type: string
  required?: boolean
  description?: string
}

export interface Relationship extends BaseFields {
  name: string
  from: string
  to: string
  attribute: string
  cardinality: string
  description?: string
}

export interface Task extends BaseFields {
  name: string
  actor: string
  operation: string
  description?: string
}

export interface Process extends BaseFields {
  name: string
  description?: string
  operator?: string
  startStep?: string
  steps?: ProcessStep[]
}

export interface ProcessStep {
  id: string
  task: string
  description?: string
  depends_on?: string[]
  conditions?: string[]
  else?: string
}

export type ProductCoreDna = Record<string, unknown>
export type ProductApiDna = Record<string, unknown>
export type ProductUiDna = Record<string, unknown>
export type TechnicalDna = Record<string, unknown>
