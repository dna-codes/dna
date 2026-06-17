/**
 * Loose structural types describing the DNA shapes this renderer reads.
 * Subset of @dna-codes/dna-core schemas — only fields the renderer consumes.
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
  domains?: OperationalDomain[]
  resources?: Resource[]
  relationships?: Relationship[]
  tasks?: Task[]
  processes?: Process[]
}

export interface OperationalDomain {
  name: string
  path?: string
}

export interface Resource {
  name: string
  attributes?: Attribute[]
}

export interface Attribute {
  name: string
  type?: string
}

export interface Relationship {
  name: string
  from: string
  to: string
  attribute: string
  cardinality: string
}

export interface Task {
  name: string
  actor?: string
  operation?: string
  description?: string
}

export interface Process {
  name: string
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

export type ProductCoreDna = Record<string, unknown>
export type ProductApiDna = Record<string, unknown>
export type ProductUiDna = Record<string, unknown>
export type TechnicalDna = Record<string, unknown>
