import * as fs from 'fs'
import * as path from 'path'

export const SCHEMA_ROOT = path.dirname(require.resolve('@dna-codes/dna-schemas/package.json'))
export const LENS_ROOT = path.join(__dirname, '..', 'lenses')

function load(rel: string): JsonSchema {
  const file = path.join(SCHEMA_ROOT, rel)
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function loadLens(rel: string): LensDefinition {
  const file = path.join(LENS_ROOT, rel)
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

export type JsonSchema = {
  $id?: string
  $schema?: string
  title?: string
  description?: string
  type?: string | string[]
  [key: string]: unknown
}

// Canonical lens types live in ./lens/types (a backward-compatible superset of
// the original shape). Re-exported here to preserve the existing import surface.
export type {
  LensNodeSlot,
  LensEdge,
  LensDefinition,
  LensTarget,
  LensRef,
  LensScope,
  LensResult,
  LensDataResult,
  LensSchemaResult,
} from './lens/types'
import type { LensDefinition } from './lens/types'

export type Layer = 'operational' | 'product.core' | 'product.api' | 'product.ui' | 'technical'

export const schemas = {
  meta: {
    stability: load('meta/stability.json'),
    lens: load('meta/lens.json'),
  },
  operational: {
    action: load('operational/action.json'),
    attribute: load('operational/attribute.json'),
    base: load('operational/base.json'),
    domain: load('operational/domain.json'),
    group: load('operational/group.json'),
    membership: load('operational/membership.json'),
    operation: load('operational/operation.json'),
    person: load('operational/person.json'),
    position: load('operational/position.json'),
    process: load('operational/process.json'),
    relationship: load('operational/relationship.json'),
    resource: load('operational/resource.json'),
    rule: load('operational/rule.json'),
    task: load('operational/task.json'),
    trigger: load('operational/trigger.json'),
  },
  product: {
    core: {
      action: load('product/core/action.json'),
      field: load('product/core/field.json'),
      operation: load('product/core/operation.json'),
      permission: load('product/core/permission.json'),
      resource: load('product/core/resource.json'),
      role: load('product/core/role.json'),
      user: load('product/core/user.json'),
    },
    api: {
      endpoint: load('product/api/endpoint.json'),
      namespace: load('product/api/namespace.json'),
      param: load('product/api/param.json'),
      schema: load('product/api/schema.json'),
    },
    web: {
      block: load('product/web/block.json'),
      layout: load('product/web/layout.json'),
      page: load('product/web/page.json'),
      route: load('product/web/route.json'),
    },
    ui: {
      app: load('product/ui/app.json'),
      module: load('product/ui/module.json'),
      workflow: load('product/ui/workflow.json'),
      section: load('product/ui/section.json'),
      component: load('product/ui/component.json'),
      element: load('product/ui/element.json'),
      operation: load('product/ui/operation.json'),
    },
  },
  technical: {
    cell: load('technical/cell.json'),
    connection: load('technical/connection.json'),
    construct: load('technical/construct.json'),
    environment: load('technical/environment.json'),
    node: load('technical/node.json'),
    output: load('technical/output.json'),
    provider: load('technical/provider.json'),
    variable: load('technical/variable.json'),
    view: load('technical/view.json'),
    zone: load('technical/zone.json'),
  },
} as const

export const documents = {
  operational: load('operational/operational.json'),
  productCore: load('product/product.core.json'),
  productApi: load('product/product.api.json'),
  productUi: load('product/product.ui.json'),
  technical: load('technical/technical.json'),
} as const

export const lenses = {
  operational:   loadLens('operational.json'),
  product:       loadLens('product.json'),
  productUi:     loadLens('product-ui.json'),
  technical:     loadLens('technical.json'),
  people:        loadLens('people.json'),
  accessControl: loadLens('access-control.json'),
  execution:     loadLens('execution.json'),
} as const

export function allLenses(): LensDefinition[] {
  return Object.values(lenses) as LensDefinition[]
}

export const layerDirs: Record<'operational' | 'product' | 'technical', string> = {
  operational: path.join(SCHEMA_ROOT, 'operational'),
  product: path.join(SCHEMA_ROOT, 'product'),
  technical: path.join(SCHEMA_ROOT, 'technical'),
}

export function resolveSchemaFile(family: 'operational' | 'product' | 'technical', name: string): string | null {
  const dir = layerDirs[family]
  if (!dir) return null
  const candidate = path.join(dir, `${name}.json`)
  return fs.existsSync(candidate) ? candidate : null
}

export function allSchemas(): JsonSchema[] {
  const out: JsonSchema[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (typeof obj.$id === 'string') {
      out.push(obj as JsonSchema)
      return
    }
    for (const v of Object.values(obj)) walk(v)
  }
  walk(schemas)
  walk(documents)
  return out
}

export { DnaValidator } from './validator'
export type { ValidationResult, CrossLayerResult, CrossLayerError } from './validator'

// Runtime lens evaluation
export { evaluateLens } from './lens/evaluate'
export { isSchemaResult } from './lens/types'
export { validateLensDefinition } from './lens/validate-def'
export type { LensDefValidation } from './lens/validate-def'

// Business → product projection (pure; persistence is a follow-on)
export { project } from './projection/project'
export type { ProductLevel, ProductNode, ProductEdge, ProductSubgraph, ProjectOptions } from './projection/types'

// Projection persistence: runtime type registration + apply
export { seedProductTypes, applyProjection, PRODUCT_LEVEL_TYPE_NAME } from './projection/apply'
export type { ApplyReport } from './projection/apply'

// Permission projection: org→app authorization causal chain (derive-first / author-fallback)
export { projectPermissions, permissionKey } from './projection/permissions'
export type { PermissionProjectionInput } from './projection/permissions'
export { applyPermissions, PERMISSION_TYPE_NAME } from './projection/apply'
export type { ApplyPermissionsReport } from './projection/apply'
export type { PermissionNode, GrantEdge, PermissionProjection } from './projection/types'

// Coarse structural access — the product-UI governance gate doctrine (pure)
export { resolveStructuralAccess, lintEmptySurfaces } from './access/structural-access'
export type {
  StructuralAccessGraph,
  EmptySurfaceLintInput,
  EmptySurfaceWarning,
} from './access/structural-access'

export {
  createOperationalDna,
  addResource,
  addPerson,
  addPosition,
  addGroup,
  addMembership,
  addOperation,
  addTrigger,
  addRule,
  addTask,
  addProcess,
  addRelationship,
} from './builders'
export type {
  BuilderOptions,
  BuilderResult,
  CreateOperationalDnaOptions,
} from './builders'

export { derivePath } from './domain/path'
export type { DomainLike } from './domain/path'

export { merge } from './merge'
export type {
  Conflict,
  ConflictRecommendation,
  ConflictValue,
  MergeChunk,
  MergeResult,
  OperationalDNA,
  Provenance,
  Source,
} from './types/merge'

export type { ParseResult, Unit, Style, StyleMap } from './types/adapters'
export { DEFAULT_STYLES } from './types/adapters'

export type {
  DnaDataStore,
  InstanceRef,
  InstanceRecord,
  InstanceCreateInput,
  LinkCreateOptions,
  LinkRecord,
  LinkListFilter,
  NounCategory,
  Stability,
  AttributeSchema,
  AttributeSchemaEntry,
  ResourceType,
  ResourceTypeVersion,
  ResourceTypeInput,
  ResourceTypeUpdate,
  RelationshipType,
  RelationshipTypeVersion,
  RelationshipTypeInput,
  RelationshipTypeUpdate,
  TypeDeleteOptions,
  SeedReport,
} from './types/data-store'

export {
  TypeInUseError,
  STABILITIES,
  FOUNDATIONAL_RESOURCE_TYPE_NAMES,
  isFoundationalTypeName,
  defaultStabilityForType,
} from './types/data-store'

export type {
  Action,
  ActionType,
  Attribute,
  AttributeType,
  BasePrimitive,
  Domain,
  Group,
  Membership,
  Operation,
  OperationChange,
  Person,
  PrimitiveInput,
  Process,
  ProcessStep,
  Relationship,
  RelationshipCardinality,
  Position,
  PositionScope,
  Resource,
  Rule,
  RuleAllowEntry,
  RuleCondition,
  RuleConditionOperator,
  RuleType,
  Task,
  Trigger,
  TriggerSource,
} from './types/operational'

export type {
  Element,
  Component,
  Section,
  Workflow,
  UIOperation,
  UIOperationTrigger,
  UIOperationEffect,
  NavigateEffect,
  ApiCallEffect,
  StateChangeEffect,
  RenderEffect,
} from './types/product-ui'

export {
  OPERATIONAL_PRIMITIVE_VERSIONS,
} from './version'
export type { OperationalPrimitiveType } from './version'

export { bookshopInput } from './fixtures/bookshop'

export {
  getResource,
  getResources,
  getPerson,
  getPersons,
  getPosition,
  getPositions,
  getGroup,
  getGroups,
  getMembership,
  getMemberships,
  getOperation,
  getOperations,
  getOperationsForResource,
  getProcess,
  getProcesses,
  getTriggersForProcess,
  getTask,
  getTasks,
  getTasksForOperation,
  getTriggers,
  getTriggersForOperation,
  getRule,
  getRules,
  getRulesForOperation,
  getActorsForOperation,
  getMembershipsForPosition,
  getMembershipsForPerson,
} from './queries'
