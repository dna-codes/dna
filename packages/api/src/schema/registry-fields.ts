/**
 * Top-level Query and Mutation fields for the registry-native admin
 * surface (ResourceType + RelationshipType CRUD).
 *
 * Resolvers close over an injected `DnaDataStore` AND a `SchemaManager`
 * — type mutations call `schemaManager.rebuild()` after a successful
 * storage write so the next request sees the updated schema.
 */

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  type GraphQLFieldConfig,
} from 'graphql'

import type {
  AttributeSchema,
  AttributeSchemaEntry,
  DnaDataStore,
  NounCategory,
  RelationshipType,
  ResourceType,
} from '@dna-codes/dna-core'

import type { SchemaManager } from './schema-manager'
import {
  buildRelationshipTypeOutputType,
  buildResourceTypeOutputType,
  CardinalityEnum,
  NounCategoryEnum,
  RelationshipTypeInputObject,
  RelationshipTypeUpdateInput,
  ResourceTypeInputObject,
  ResourceTypeUpdateInput,
  ResourceTypeVersionType,
  RelationshipTypeVersionType,
} from './registry-types'

export interface RegistryFieldsArgs {
  dataStore: DnaDataStore
  schemaManager: SchemaManager
}

export interface RegistryBundle {
  queries: Record<string, GraphQLFieldConfig<unknown, unknown>>
  mutations: Record<string, GraphQLFieldConfig<unknown, unknown>>
  /** The dynamically-resolved GraphQL types (so the composer can register them in the schema). */
  outputTypes: {
    ResourceType: ReturnType<typeof buildResourceTypeOutputType>
    RelationshipType: ReturnType<typeof buildRelationshipTypeOutputType>
  }
}

function normalizeAttributeSchemaInput(
  input: ReadonlyArray<Record<string, unknown>> | undefined,
): AttributeSchema {
  if (!input) return []
  return input.map((raw): AttributeSchemaEntry => ({
    name: String(raw.name),
    type: raw.type as AttributeSchemaEntry['type'],
    ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
    ...(typeof raw.required === 'boolean' ? { required: raw.required } : {}),
    ...(Array.isArray(raw.values) ? { values: raw.values as string[] } : {}),
    ...(typeof raw.resource === 'string' ? { resource: raw.resource } : {}),
  }))
}

export function buildRegistryFields({
  dataStore,
  schemaManager,
}: RegistryFieldsArgs): RegistryBundle {
  const ResourceTypeOutput = buildResourceTypeOutputType((parent) =>
    dataStore.resourceType.versions(parent.id),
  )
  const RelationshipTypeOutput = buildRelationshipTypeOutputType((parent) =>
    dataStore.relationshipType.versions(parent.id),
  )

  const queries: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    resourceType: {
      type: ResourceTypeOutput,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_p, args): Promise<ResourceType | null> => {
        const { id } = args as { id: string }
        return dataStore.resourceType.get(id)
      },
    },
    resourceTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ResourceTypeOutput))),
      args: { category: { type: NounCategoryEnum } },
      resolve: async (_p, args): Promise<ResourceType[]> => {
        const { category } = args as { category?: NounCategory }
        return dataStore.resourceType.list(category ? { category } : undefined)
      },
    },
    resourceTypeVersion: {
      type: ResourceTypeVersionType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_p, args) => {
        // No direct getter for a single version exists on the contract; scan.
        const { id } = args as { id: string }
        const allTypes = await dataStore.resourceType.list()
        for (const rt of allTypes) {
          const versions = await dataStore.resourceType.versions(rt.id)
          const match = versions.find((v) => v.id === id)
          if (match) return match
        }
        return null
      },
    },
    relationshipType: {
      type: RelationshipTypeOutput,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_p, args): Promise<RelationshipType | null> => {
        const { id } = args as { id: string }
        return dataStore.relationshipType.get(id)
      },
    },
    relationshipTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(RelationshipTypeOutput))),
      resolve: async (): Promise<RelationshipType[]> => dataStore.relationshipType.list(),
    },
    relationshipTypeVersion: {
      type: RelationshipTypeVersionType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_p, args) => {
        const { id } = args as { id: string }
        const allTypes = await dataStore.relationshipType.list()
        for (const rt of allTypes) {
          const versions = await dataStore.relationshipType.versions(rt.id)
          const match = versions.find((v) => v.id === id)
          if (match) return match
        }
        return null
      },
    },
  }

  const mutations: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    createResourceType: {
      type: new GraphQLNonNull(ResourceTypeOutput),
      args: { input: { type: new GraphQLNonNull(ResourceTypeInputObject) } },
      resolve: async (_p, args) => {
        const { input } = args as {
          input: {
            id?: string
            name: string
            category: NounCategory
            attributeSchema: ReadonlyArray<Record<string, unknown>>
            description?: string
          }
        }
        const { id } = await dataStore.resourceType.create({
          ...(input.id ? { id: input.id } : {}),
          name: input.name,
          category: input.category,
          attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        await schemaManager.rebuild()
        return dataStore.resourceType.get(id)
      },
    },
    updateResourceType: {
      type: new GraphQLNonNull(ResourceTypeOutput),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(ResourceTypeUpdateInput) },
      },
      resolve: async (_p, args) => {
        const { id, input } = args as {
          id: string
          input: {
            attributeSchema?: ReadonlyArray<Record<string, unknown>>
            description?: string
          }
        }
        await dataStore.resourceType.update(id, {
          ...(input.attributeSchema !== undefined
            ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        await schemaManager.rebuild()
        return dataStore.resourceType.get(id)
      },
    },
    deleteResourceType: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        cascade: { type: GraphQLBoolean },
      },
      resolve: async (_p, args) => {
        const { id, cascade } = args as { id: string; cascade?: boolean }
        const existing = await dataStore.resourceType.get(id)
        if (existing?.is_seed && !cascade) {
          throw new Error(
            `Cannot delete seed ResourceType "${existing.name}" without cascade: true. Seed types ship from the foundational DNA — pass cascade: true to confirm deletion.`,
          )
        }
        await dataStore.resourceType.delete(id, cascade ? { cascade: true } : undefined)
        await schemaManager.rebuild()
        return true
      },
    },
    createRelationshipType: {
      type: new GraphQLNonNull(RelationshipTypeOutput),
      args: { input: { type: new GraphQLNonNull(RelationshipTypeInputObject) } },
      resolve: async (_p, args) => {
        const { input } = args as {
          input: {
            id?: string
            name: string
            from: string
            to: string
            cardinality: RelationshipType['cardinality']
            attribute: string
            inverse?: string
            attributeSchema?: ReadonlyArray<Record<string, unknown>>
            description?: string
          }
        }
        const { id } = await dataStore.relationshipType.create({
          ...(input.id ? { id: input.id } : {}),
          name: input.name,
          from: input.from,
          to: input.to,
          cardinality: input.cardinality,
          attribute: input.attribute,
          ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
          ...(input.attributeSchema !== undefined
            ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        await schemaManager.rebuild()
        return dataStore.relationshipType.get(id)
      },
    },
    updateRelationshipType: {
      type: new GraphQLNonNull(RelationshipTypeOutput),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(RelationshipTypeUpdateInput) },
      },
      resolve: async (_p, args) => {
        const { id, input } = args as {
          id: string
          input: {
            cardinality?: RelationshipType['cardinality']
            attribute?: string
            inverse?: string
            attributeSchema?: ReadonlyArray<Record<string, unknown>>
            description?: string
          }
        }
        await dataStore.relationshipType.update(id, {
          ...(input.cardinality !== undefined ? { cardinality: input.cardinality } : {}),
          ...(input.attribute !== undefined ? { attribute: input.attribute } : {}),
          ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
          ...(input.attributeSchema !== undefined
            ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        await schemaManager.rebuild()
        return dataStore.relationshipType.get(id)
      },
    },
    deleteRelationshipType: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        cascade: { type: GraphQLBoolean },
      },
      resolve: async (_p, args) => {
        const { id, cascade } = args as { id: string; cascade?: boolean }
        const existing = await dataStore.relationshipType.get(id)
        if (existing?.is_seed && !cascade) {
          throw new Error(
            `Cannot delete seed RelationshipType "${existing.name}" without cascade: true.`,
          )
        }
        await dataStore.relationshipType.delete(id, cascade ? { cascade: true } : undefined)
        await schemaManager.rebuild()
        return true
      },
    },
  }

  // Suppress unused-warning for fields that the GraphQLList constructor handles internally.
  void CardinalityEnum

  return {
    queries,
    mutations,
    outputTypes: {
      ResourceType: ResourceTypeOutput,
      RelationshipType: RelationshipTypeOutput,
    },
  }
}
