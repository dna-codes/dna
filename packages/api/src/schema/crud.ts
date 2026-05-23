/**
 * Type-generic CRUD codegen.
 *
 * For every noun-primitive type in the bundle, register:
 *
 *   Queries:    <type>(id: ID!): <Type>
 *               <type>s: [<Type>!]!
 *
 *   Mutations:  create<Type>(input: <Type>Input!): <Type>!
 *               update<Type>(id: ID!, input: <Type>Input!): <Type>!
 *               delete<Type>(id: ID!): Boolean!
 *
 * Resolvers are injected by the schema composer via the `resolvers`
 * argument so this module imports no data-store dependency.
 */

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  type GraphQLFieldConfig,
  type GraphQLFieldResolver,
} from 'graphql'

import { pascalToCamel, pluralize } from './naming'
import type { ResourceTypeBundle } from './types'

/**
 * Resolver factory injected by the schema composer. Each factory takes a
 * typeName and returns a GraphQL resolver. Letting the composer own the
 * resolver shape keeps this file pure codegen with no I/O.
 */
export interface CrudResolverFactories {
  get(typeName: string): GraphQLFieldResolver<unknown, unknown>
  list(typeName: string): GraphQLFieldResolver<unknown, unknown>
  create(typeName: string): GraphQLFieldResolver<unknown, unknown>
  update(typeName: string): GraphQLFieldResolver<unknown, unknown>
  delete(typeName: string): GraphQLFieldResolver<unknown, unknown>
}

export interface CrudBundle {
  queries: Record<string, GraphQLFieldConfig<unknown, unknown>>
  mutations: Record<string, GraphQLFieldConfig<unknown, unknown>>
  /** Mutation names this CRUD pass owns. Operation-mutation codegen reads this so collisions resolve to the Operation per D3. */
  crudMutationNames: Set<string>
}

export function buildCrudFields(bundle: ResourceTypeBundle, resolvers: CrudResolverFactories): CrudBundle {
  const queries: Record<string, GraphQLFieldConfig<unknown, unknown>> = {}
  const mutations: Record<string, GraphQLFieldConfig<unknown, unknown>> = {}
  const crudMutationNames = new Set<string>()

  for (const [typeName, objectType] of bundle.registry) {
    const inputType = bundle.inputRegistry.get(typeName)
    if (!inputType) continue

    const singularField = pascalToCamel(typeName)
    const pluralField = pluralize(typeName)
    const createName = `create${typeName}`
    const updateName = `update${typeName}`
    const deleteName = `delete${typeName}`

    queries[singularField] = {
      type: objectType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: resolvers.get(typeName),
      description: `Fetch a single ${typeName} by id.`,
    }
    queries[pluralField] = {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(objectType))),
      resolve: resolvers.list(typeName),
      description: `List every ${typeName}.`,
    }

    mutations[createName] = {
      type: new GraphQLNonNull(objectType),
      args: { input: { type: new GraphQLNonNull(inputType) } },
      resolve: resolvers.create(typeName),
      description: `Create a new ${typeName} instance.`,
    }
    mutations[updateName] = {
      type: new GraphQLNonNull(objectType),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        input: { type: new GraphQLNonNull(inputType) },
      },
      resolve: resolvers.update(typeName),
      description: `Update an existing ${typeName} by id.`,
    }
    mutations[deleteName] = {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: resolvers.delete(typeName),
      description: `Delete a ${typeName} by id.`,
    }

    crudMutationNames.add(createName)
    crudMutationNames.add(updateName)
    crudMutationNames.add(deleteName)
  }

  return { queries, mutations, crudMutationNames }
}
