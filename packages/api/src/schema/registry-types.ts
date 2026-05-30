/**
 * Fixed top-level GraphQL types for the registry-native admin API.
 *
 * These types are stable across schema regenerations — they don't depend
 * on which `ResourceType` records exist in the tenant's store. They are
 * the surface tenant admins use to mutate the type system itself.
 *
 * Types declared here:
 *   - `NounCategory` (enum: PERSON / ROLE / GROUP / RESOURCE)
 *   - `AttributeType` (enum: STRING / TEXT / NUMBER / BOOLEAN / DATE / DATETIME / ENUM / REFERENCE)
 *   - `AttributeSchemaEntry` (object, used in both ResourceType and input shapes)
 *   - `ResourceType`, `ResourceTypeVersion` (read+write)
 *   - `RelationshipType`, `RelationshipTypeVersion` (read+write)
 *   - Inputs for each create / update mutation
 */

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import { STABILITIES } from '@dna-codes/dna-core'

/**
 * Stability enum, derived from the core `STABILITIES` array so the GraphQL
 * surface and the core `Stability` union cannot drift. Members are the
 * upper-cased value names (e.g. `experimental` → `EXPERIMENTAL`).
 */
export const StabilityEnum = new GraphQLEnumType({
  name: 'Stability',
  values: Object.fromEntries(
    STABILITIES.map((s) => [s.toUpperCase(), { value: s }]),
  ),
})

export const NounCategoryEnum = new GraphQLEnumType({
  name: 'NounCategory',
  values: {
    PERSON: { value: 'person' },
    ROLE: { value: 'role' },
    GROUP: { value: 'group' },
    RESOURCE: { value: 'resource' },
  },
})

export const AttributeTypeEnum = new GraphQLEnumType({
  name: 'AttributeType',
  values: {
    STRING: { value: 'string' },
    TEXT: { value: 'text' },
    NUMBER: { value: 'number' },
    BOOLEAN: { value: 'boolean' },
    DATE: { value: 'date' },
    DATETIME: { value: 'datetime' },
    ENUM: { value: 'enum' },
    REFERENCE: { value: 'reference' },
  },
})

export const CardinalityEnum = new GraphQLEnumType({
  name: 'Cardinality',
  values: {
    ONE_TO_ONE: { value: 'one-to-one' },
    ONE_TO_MANY: { value: 'one-to-many' },
    MANY_TO_ONE: { value: 'many-to-one' },
    MANY_TO_MANY: { value: 'many-to-many' },
  },
})

export const AttributeSchemaEntryType = new GraphQLObjectType({
  name: 'AttributeSchemaEntry',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(AttributeTypeEnum) },
    description: { type: GraphQLString },
    required: { type: GraphQLBoolean },
    values: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    resource: { type: GraphQLString },
  }),
})

export const AttributeSchemaEntryInput = new GraphQLInputObjectType({
  name: 'AttributeSchemaEntryInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(AttributeTypeEnum) },
    description: { type: GraphQLString },
    required: { type: GraphQLBoolean },
    values: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    resource: { type: GraphQLString },
  }),
})

export const ResourceTypeVersionType: GraphQLObjectType = new GraphQLObjectType({
  name: 'ResourceTypeVersion',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    resourceTypeId: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (src: Record<string, unknown>) => src.resource_type_id,
    },
    version: { type: new GraphQLNonNull(GraphQLInt) },
    attributeSchema: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryType))),
      resolve: (src: Record<string, unknown>) => src.attribute_schema,
    },
    stability: { type: new GraphQLNonNull(StabilityEnum) },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (src: Record<string, unknown>) => src.created_at,
    },
  }),
})

export const RelationshipTypeVersionType: GraphQLObjectType = new GraphQLObjectType({
  name: 'RelationshipTypeVersion',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    relationshipTypeId: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (src: Record<string, unknown>) => src.relationship_type_id,
    },
    version: { type: new GraphQLNonNull(GraphQLInt) },
    attributeSchema: {
      type: new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryType)),
      resolve: (src: Record<string, unknown>) => src.attribute_schema ?? null,
    },
    stability: { type: new GraphQLNonNull(StabilityEnum) },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (src: Record<string, unknown>) => src.created_at,
    },
  }),
})

/**
 * `ResourceType` and `RelationshipType` types are constructed via a
 * factory because their `versions: [...]` field is resolved through the
 * data store, which is wired by the schema composer.
 */
export function buildResourceTypeOutputType(
  versionsResolver: (parent: { id: string }) => Promise<unknown[]>,
): GraphQLObjectType {
  return new GraphQLObjectType({
    name: 'ResourceType',
    fields: () => ({
      id: { type: new GraphQLNonNull(GraphQLID) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      category: { type: new GraphQLNonNull(NounCategoryEnum) },
      attributeSchema: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryType))),
        resolve: (src: Record<string, unknown>) => src.attribute_schema,
      },
      currentVersion: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: (src: Record<string, unknown>) => src.current_version,
      },
      stability: { type: new GraphQLNonNull(StabilityEnum) },
      description: { type: GraphQLString },
      isSeed: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: (src: Record<string, unknown>) => src.is_seed,
      },
      versions: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ResourceTypeVersionType))),
        resolve: (src: Record<string, unknown>) => versionsResolver({ id: String(src.id) }),
      },
    }),
  })
}

export function buildRelationshipTypeOutputType(
  versionsResolver: (parent: { id: string }) => Promise<unknown[]>,
): GraphQLObjectType {
  return new GraphQLObjectType({
    name: 'RelationshipType',
    fields: () => ({
      id: { type: new GraphQLNonNull(GraphQLID) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      from: { type: new GraphQLNonNull(GraphQLString) },
      to: { type: new GraphQLNonNull(GraphQLString) },
      cardinality: { type: new GraphQLNonNull(CardinalityEnum) },
      attribute: { type: new GraphQLNonNull(GraphQLString) },
      inverse: { type: GraphQLString },
      attributeSchema: {
        type: new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryType)),
        resolve: (src: Record<string, unknown>) => src.attribute_schema ?? null,
      },
      currentVersion: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: (src: Record<string, unknown>) => src.current_version,
      },
      stability: { type: new GraphQLNonNull(StabilityEnum) },
      description: { type: GraphQLString },
      isSeed: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: (src: Record<string, unknown>) => src.is_seed,
      },
      versions: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RelationshipTypeVersionType))),
        resolve: (src: Record<string, unknown>) => versionsResolver({ id: String(src.id) }),
      },
    }),
  })
}

export const ResourceTypeInputObject = new GraphQLInputObjectType({
  name: 'ResourceTypeInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    category: { type: new GraphQLNonNull(NounCategoryEnum) },
    attributeSchema: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryInput))),
    },
    stability: { type: StabilityEnum },
    description: { type: GraphQLString },
  }),
})

export const ResourceTypeUpdateInput = new GraphQLInputObjectType({
  name: 'ResourceTypeUpdateInput',
  fields: () => ({
    attributeSchema: { type: new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryInput)) },
    stability: { type: StabilityEnum },
    description: { type: GraphQLString },
  }),
})

export const RelationshipTypeInputObject = new GraphQLInputObjectType({
  name: 'RelationshipTypeInput',
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: new GraphQLNonNull(GraphQLString) },
    from: { type: new GraphQLNonNull(GraphQLString) },
    to: { type: new GraphQLNonNull(GraphQLString) },
    cardinality: { type: new GraphQLNonNull(CardinalityEnum) },
    attribute: { type: new GraphQLNonNull(GraphQLString) },
    inverse: { type: GraphQLString },
    attributeSchema: { type: new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryInput)) },
    stability: { type: StabilityEnum },
    description: { type: GraphQLString },
  }),
})

export const RelationshipTypeUpdateInput = new GraphQLInputObjectType({
  name: 'RelationshipTypeUpdateInput',
  fields: () => ({
    cardinality: { type: CardinalityEnum },
    attribute: { type: GraphQLString },
    inverse: { type: GraphQLString },
    attributeSchema: { type: new GraphQLList(new GraphQLNonNull(AttributeSchemaEntryInput)) },
    stability: { type: StabilityEnum },
    description: { type: GraphQLString },
  }),
})
