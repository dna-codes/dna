export interface ParsedAttribute {
  name: string
  type: string
  required?: boolean
  resource?: string
}

export interface ParsedResource {
  name: string
  attributes: ParsedAttribute[]
}

export interface ParsedRelationship {
  name: string
  from: string
  to: string
  attribute: string
  cardinality: 'one-to-one' | 'one-to-many'
}

export interface ParsedOperational {
  domain: {
    name: string
  }
  resources: ParsedResource[]
  relationships?: ParsedRelationship[]
}

export interface ParseResult {
  operational: ParsedOperational
}
