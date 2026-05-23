/**
 * DNA noun primitive → GraphQL type codegen.
 *
 * Walks `dna.domain.{resources,persons,roles,groups}` and produces one
 * `GraphQLObjectType` per entry. Each type carries `id: ID!` plus one
 * field per declared `Attribute` (with the attribute-type mapping table
 * documented in design.md D1).
 *
 * Reference attributes (`attribute.type === 'reference'`) are surfaced as
 * scalar `ID` fields here. The expansion field (e.g. `borrower: Borrower`)
 * is added by `./relationships.ts` based on the DNA's
 * `relationships[]` primitives — not from the reference attribute alone.
 */

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
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

import type { OperationalDNA } from '@dna-codes/dna-core'

import { snakeToCamel, toEnumValue } from './naming'
import type { DnaAttribute, DnaNounPrimitive, NounCategory } from './dna-shapes'

/** Result of the §2 pass. Mutable for §3 (relationship fields). */
export interface ResourceTypeBundle {
  /** All emitted output types, keyed by the original DNA noun-primitive name. */
  registry: Map<string, GraphQLObjectType>
  /** Category lookup so later passes know which DNA collection a type came from. */
  categories: Map<string, NounCategory>
  /** Input types for CRUD mutations, keyed by original name. */
  inputRegistry: Map<string, GraphQLInputObjectType>
  /** Generated per-attribute enum types, keyed by `<TypeName>.<attributeName>`. */
  enumRegistry: Map<string, GraphQLEnumType>
}

const NOUN_KEYS: Array<{ key: 'resources' | 'persons' | 'roles' | 'groups'; category: NounCategory }> = [
  { key: 'resources', category: 'resource' },
  { key: 'persons', category: 'person' },
  { key: 'roles', category: 'role' },
  { key: 'groups', category: 'group' },
]

/**
 * Build the per-noun-primitive GraphQL types from a DNA. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them and may
 * extend the object types' fields (via the thunked `fields` API).
 */
export function buildResourceTypes(dna: OperationalDNA): ResourceTypeBundle {
  const bundle: ResourceTypeBundle = {
    registry: new Map(),
    categories: new Map(),
    inputRegistry: new Map(),
    enumRegistry: new Map(),
  }

  const domain = dna.domain ?? {}

  // First pass: collect every noun primitive so reference attributes can
  // resolve in any order (Loan.borrower references Borrower even when
  // Borrower is declared later in the DNA).
  const collected: Array<{ category: NounCategory; entry: DnaNounPrimitive }> = []
  for (const { key, category } of NOUN_KEYS) {
    const list = Array.isArray(domain[key]) ? (domain[key] as DnaNounPrimitive[]) : []
    for (const entry of list) {
      if (typeof entry?.name !== 'string') continue
      if (bundle.registry.has(entry.name)) continue
      collected.push({ category, entry })
    }
  }

  // Second pass: pre-build per-attribute enums so the field builders can
  // look them up while wiring fields.
  for (const { entry } of collected) {
    if (!Array.isArray(entry.attributes)) continue
    for (const attr of entry.attributes) {
      if (attr.type === 'enum' && Array.isArray(attr.values) && attr.values.length > 0) {
        const key = enumKey(entry.name, attr.name)
        if (!bundle.enumRegistry.has(key)) {
          bundle.enumRegistry.set(key, buildEnum(entry.name, attr))
        }
      }
    }
  }

  // Third pass: build object types and input types. Fields are thunked
  // so a reference attribute's target type doesn't need to exist in the
  // registry yet at construction time — only at field-resolution time.
  for (const { category, entry } of collected) {
    bundle.categories.set(entry.name, category)
    const objectType = new GraphQLObjectType({
      name: entry.name,
      description: typeof entry.description === 'string' ? entry.description : undefined,
      fields: () => buildObjectFields(entry, bundle),
    })
    bundle.registry.set(entry.name, objectType)

    const inputType = new GraphQLInputObjectType({
      name: `${entry.name}Input`,
      description: `Input shape for ${entry.name} mutations.`,
      fields: () => buildInputFields(entry, bundle),
    })
    bundle.inputRegistry.set(entry.name, inputType)
  }

  return bundle
}

function buildObjectFields(
  entry: DnaNounPrimitive,
  bundle: ResourceTypeBundle,
): Record<string, GraphQLFieldConfig<unknown, unknown>> {
  const fields: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    id: { type: new GraphQLNonNull(GraphQLID), description: 'Unique identifier for this instance.' },
  }
  if (!Array.isArray(entry.attributes)) return fields

  for (const attr of entry.attributes) {
    // Skip user-declared `id` attributes — every type already carries the
    // reserved `id: ID!` field, and the underlying store treats `id` as a
    // control field (it's stamped on every Instance regardless of what
    // the DNA declares).
    if (attr.name === 'id') continue
    const fieldName = snakeToCamel(attr.name)
    fields[fieldName] = {
      type: applyRequired(outputTypeFor(entry.name, attr, bundle), attr.required === true),
      description: typeof attr.description === 'string' ? attr.description : undefined,
    }
  }
  return fields
}

function buildInputFields(
  entry: DnaNounPrimitive,
  bundle: ResourceTypeBundle,
): Record<string, GraphQLInputFieldConfig> {
  // Every Input carries an optional `id: ID`. The hybrid-ID contract in
  // the underlying store (design.md D4) lets callers supply a known id;
  // surfacing it on Input mirrors that capability. It also guarantees
  // Input types always have at least one field (GraphQL requires that)
  // even for noun primitives with no declared attributes.
  const fields: Record<string, GraphQLInputFieldConfig> = {
    id: {
      type: GraphQLID,
      description: 'Optional caller-provided id. When omitted, the store generates a UUIDv4.',
    },
  }
  if (!Array.isArray(entry.attributes)) return fields

  for (const attr of entry.attributes) {
    if (attr.name === 'id') continue
    const fieldName = snakeToCamel(attr.name)
    fields[fieldName] = {
      type: applyRequiredInput(inputTypeFor(entry.name, attr, bundle), attr.required === true),
      description: typeof attr.description === 'string' ? attr.description : undefined,
    }
  }
  return fields
}

function outputTypeFor(
  typeName: string,
  attr: DnaAttribute,
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
      // Scalar FK. The expanded type field is added by ./relationships.ts
      // off the DNA's `relationships[]` primitive, not off the reference
      // attribute. The FK itself is always an ID scalar.
      return GraphQLID
    default:
      return GraphQLString
  }
}

function inputTypeFor(
  typeName: string,
  attr: DnaAttribute,
  bundle: ResourceTypeBundle,
): GraphQLInputType {
  // Input types use the same scalar/enum mappings; only object/list
  // wrapping differs, and DNA attributes are always scalar shapes.
  const output = outputTypeFor(typeName, attr, bundle)
  // GraphQL types are simultaneously valid as input/output for scalars
  // and enums, so the cast is safe.
  return output as unknown as GraphQLInputType
}

function applyRequired(type: GraphQLOutputType, required: boolean): GraphQLOutputType {
  return required ? new GraphQLNonNull(type) : type
}

function applyRequiredInput(type: GraphQLInputType, required: boolean): GraphQLInputType {
  return required ? new GraphQLNonNull(type) : type
}

function buildEnum(typeName: string, attr: DnaAttribute): GraphQLEnumType {
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
  // Convert snake_case to PascalCase for enum type naming.
  return s
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

// Re-export the unused list wrapper so the import is kept honest; this is
// useful when relationships.ts pulls these mappings forward.
export { GraphQLList }
