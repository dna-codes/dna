/**
 * Registry-native schema composition entry point.
 *
 * Builds a GraphQL schema from the **current** `DnaDataStore` state. The
 * schema includes:
 *
 *   1. Fixed top-level CRUD for `ResourceType` and `RelationshipType`
 *      (the admin surface — see `./registry-fields.ts`).
 *   2. Dynamic per-type GraphQL types generated from the data store's
 *      `resourceType.list()`.
 *   3. Per-type CRUD queries/mutations.
 *   4. Relationship expansion fields from `relationshipType.list()`.
 *
 * Resolvers close over the injected `DnaDataStore` (and a
 * `SchemaManager` for the admin mutations to trigger rebuilds).
 *
 * No DNA validation runs here — the API layer assumes the data store is
 * already populated (either by `seedFromDna` at first boot or by admin
 * mutations after). Per-Resource data is validated by the instance
 * resolvers via `ValidatorCache`.
 */

import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  type GraphQLFieldConfig,
} from 'graphql'

import type { DnaDataStore } from '@dna-codes/dna-core'

import {
  makeCreateResolver,
  makeDeleteResolver,
  makeGetResolver,
  makeListResolver,
  makeUpdateResolver,
} from '../resolvers/instance'
import { makeRelationshipResolver } from '../resolvers/relationships'
import type { ValidatorCache } from '../validation/validator-cache'
import { buildCrudFields, type CrudResolverFactories } from './crud'
import { buildRegistryFields } from './registry-fields'
import {
  buildRelationshipFieldConfigs,
  extendObjectFields,
  planRelationshipFields,
} from './relationships'
import { SchemaManager } from './schema-manager'
import { buildResourceTypes } from './types'

export interface BuildSchemaArgs {
  dataStore: DnaDataStore
  validatorCache: ValidatorCache
  schemaManager: SchemaManager
}

/**
 * Build a fresh `GraphQLSchema` from the data store's current state.
 * Called by the SchemaManager's builder closure on every rebuild.
 */
export async function buildRegistrySchema(args: BuildSchemaArgs): Promise<GraphQLSchema> {
  const { dataStore, validatorCache, schemaManager } = args

  // Fetch current registry state.
  const [resourceTypes, relationshipTypes] = await Promise.all([
    dataStore.resourceType.list(),
    dataStore.relationshipType.list(),
  ])

  // Build per-ResourceType GraphQL types.
  const bundle = buildResourceTypes(resourceTypes)

  // Add relationship expansion fields.
  const relationshipBuilders = planRelationshipFields(relationshipTypes, bundle)
  const relationshipFieldConfigs = buildRelationshipFieldConfigs(
    relationshipBuilders,
    (info) => makeRelationshipResolver({ dataStore, info }),
  )
  extendObjectFields(bundle, relationshipFieldConfigs)

  // Build per-type CRUD with validating resolvers.
  const crudResolvers: CrudResolverFactories = {
    get: (typeName) => makeGetResolver({ dataStore, typeName }),
    list: (typeName) => makeListResolver({ dataStore, typeName }),
    create: (typeName) =>
      makeCreateResolver({ dataStore, typeName, validatorCache }),
    update: (typeName) =>
      makeUpdateResolver({ dataStore, typeName, validatorCache }),
    delete: (typeName) => makeDeleteResolver({ dataStore, typeName }),
  }
  const crud = buildCrudFields(bundle, crudResolvers)

  // Build fixed top-level admin fields.
  const registry = buildRegistryFields({ dataStore, schemaManager })

  // Compose Query.
  const queryFields: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    ...registry.queries,
    ...crud.queries,
  }
  if (Object.keys(queryFields).length === 0) {
    queryFields._meta = {
      type: GraphQLString,
      resolve: () => 'No queries available — the type system is empty.',
    }
  }

  // Compose Mutation.
  const mutationFields: Record<string, GraphQLFieldConfig<unknown, unknown>> = {
    ...registry.mutations,
    ...crud.mutations,
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({ name: 'Query', fields: queryFields }),
    mutation: new GraphQLObjectType({ name: 'Mutation', fields: mutationFields }),
    types: [
      registry.outputTypes.ResourceType,
      registry.outputTypes.RelationshipType,
      ...bundle.registry.values(),
    ],
  })
}
