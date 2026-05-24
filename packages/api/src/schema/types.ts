/**
 * `ResourceType` records → GraphQL types codegen.
 *
 * Given an array of live `ResourceType` records (typically from
 * `dataStore.resourceType.list()`), produces one `GraphQLObjectType` per
 * ResourceType, each carrying `id: ID!`, `_schemaVersion: Int!`, plus one
 * field per declared `AttributeSchemaEntry` (with the attribute-type
 * mapping table documented in design.md D1).
 *
 * Reference attributes (`type === 'reference'`) are surfaced as scalar
 * `ID` fields here. The expansion field (e.g. `borrower: Borrower`) is
 * added by `./relationships.ts` based on declared `RelationshipType`
 * records — not from the reference attribute alone.
 */

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLEnumValueConfigMap,
  type GraphQLFieldConfig,
  type GraphQLInputFieldConfig,
  type GraphQLInputType,
  type GraphQLOutputType,
} from 'graphql'

import type {
  AttributeSchemaEntry,
  NounCategory,
  ResourceType,
} from '@dna-codes/dna-core'

import { snakeToCamel, toEnumValue } from './naming'

export interface ResourceTypeBundle {
  registry: Map<string, GraphQLObjectType>
  categories: Map<string, NounCategory>
  inputRegistry: Map<string, GraphQLInputObjectType>
  enumRegistry: Map<string, GraphQLEnumType>
}

/**
 * Build per-ResourceType GraphQL output and input types. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them.
 */
export function buildResourceTypes(resourceTypes: ResourceType[]): ResourceTypeBundle {
  const bundle: ResourceTypeBundle = {
    registry: new Map(),
    categories: new Map(),
    inputRegistry: new Map(),
    enumRegistry: new Map(),
  }

  // First pass: pre-build per-attribute enums so the field builders can
  // look them up while wiring fields.
  for (const rt of resourceTypes) {
    for (const attr of rt.attribute_schema ?? []) {
      if (attr.type === 'enum' && Array.isArray(attr.values) && attr.values.length > 0) {
        const key = enumKey(rt.name, attr.name)
        if (!bundle.enumRegistry.has(key)) {
          bundle.enumRegistry.set(key, buildEnum(rt.name, attr))
        }
      }
    }
  }

  // Second pass: build object types and input types. Fields are thunked
  // so a reference attribute's target type doesn't need to exist in the
  // registry yet at construction time — only at field-resolution time.
  for (const rt of resourceTypes) {
    bundle.categories.set(rt.name, rt.category)
    const objectType = new GraphQLObjectType({
      name: rt.name,
      description: typeof rt.description === 'string' ? rt.description : undefined,
      fields: () => buildObjectFields(rt, bundle),
    })
    bundle.registry.set(rt.name, objectType)

    const inputType = new GraphQLInputObjectType({
      name: `${rt.name}Input`,
      description: `Input shape for ${rt.name} mutations.`,
      fields: () => buildInputFields(rt, bundle),
    })
    bundle.inputRegistry.set(rt.name, inputType)
  }

  return bundle
}

function buildObjectFields(
  rt: ResourceType,
  bundle: ResourceTypeBundle,
): Record<string, GraphQLFieldConfig<unknown, unknown>> {
  const fields: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    id: { type: new GraphQLNonNull(GraphQLID), description: 'Unique identifier for this instance.' },
    _schemaVersion: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'ResourceType.current_version stamped when this record was written.',
      resolve: (parent): number => {
        const rec = parent as Record<string, unknown> | null | undefined
        const v = rec?._schemaVersion
        if (typeof v === 'number') return v
        return rt.current_version
      },
    },
  }

  for (const attr of rt.attribute_schema ?? []) {
    if (attr.name === 'id') continue
    const fieldName = snakeToCamel(attr.name)
    fields[fieldName] = {
      type: applyRequired(outputTypeFor(rt.name, attr, bundle), attr.required === true),
      description: typeof attr.description === 'string' ? attr.description : undefined,
    }
  }
  return fields
}

function buildInputFields(
  rt: ResourceType,
  bundle: ResourceTypeBundle,
): Record<string, GraphQLInputFieldConfig> {
  const fields: Record<string, GraphQLInputFieldConfig> = {
    id: {
      type: GraphQLID,
      description: 'Optional caller-provided id. When omitted, the store generates a UUIDv4.',
    },
  }
  for (const attr of rt.attribute_schema ?? []) {
    if (attr.name === 'id') continue
    const fieldName = snakeToCamel(attr.name)
    fields[fieldName] = {
      type: applyRequiredInput(inputTypeFor(rt.name, attr, bundle), attr.required === true),
      description: typeof attr.description === 'string' ? attr.description : undefined,
    }
  }
  return fields
}

function outputTypeFor(
  typeName: string,
  attr: AttributeSchemaEntry,
  bundle: ResourceTypeBundle,
): GraphQLOutputType {
  switch (attr.type) {
    case 'string':
    case 'text':
    case 'date':
    case 'datetime':
      return GraphQLString
    case 'number':
      return GraphQLFloat
    case 'boolean':
      return GraphQLBoolean
    case 'enum': {
      const key = enumKey(typeName, attr.name)
      const enumType = bundle.enumRegistry.get(key)
      if (!enumType) return GraphQLString
      return enumType
    }
    case 'reference':
      return GraphQLID
    default:
      return GraphQLString
  }
}

function inputTypeFor(
  typeName: string,
  attr: AttributeSchemaEntry,
  bundle: ResourceTypeBundle,
): GraphQLInputType {
  const output = outputTypeFor(typeName, attr, bundle)
  return output as unknown as GraphQLInputType
}

function applyRequired(type: GraphQLOutputType, required: boolean): GraphQLOutputType {
  return required ? new GraphQLNonNull(type) : type
}

function applyRequiredInput(type: GraphQLInputType, required: boolean): GraphQLInputType {
  return required ? new GraphQLNonNull(type) : type
}

function buildEnum(typeName: string, attr: AttributeSchemaEntry): GraphQLEnumType {
  const values: GraphQLEnumValueConfigMap = {}
  for (const value of attr.values ?? []) {
    const enumValueName = toEnumValue(value)
    if (!enumValueName) continue
    values[enumValueName] = { value }
  }
  return new GraphQLEnumType({
    name: `${typeName}${capitalize(attr.name)}`,
    values,
    description: typeof attr.description === 'string' ? attr.description : undefined,
  })
}

function enumKey(typeName: string, attrName: string): string {
  return `${typeName}.${attrName}`
}

function capitalize(s: string): string {
  if (!s) return s
  return s
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export { GraphQLList }
