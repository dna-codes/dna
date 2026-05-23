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
import { type GraphQLFieldConfig, type GraphQLFieldResolver } from 'graphql';
import type { ResourceTypeBundle } from './types';
/**
 * Resolver factory injected by the schema composer. Each factory takes a
 * typeName and returns a GraphQL resolver. Letting the composer own the
 * resolver shape keeps this file pure codegen with no I/O.
 */
export interface CrudResolverFactories {
    get(typeName: string): GraphQLFieldResolver<unknown, unknown>;
    list(typeName: string): GraphQLFieldResolver<unknown, unknown>;
    create(typeName: string): GraphQLFieldResolver<unknown, unknown>;
    update(typeName: string): GraphQLFieldResolver<unknown, unknown>;
    delete(typeName: string): GraphQLFieldResolver<unknown, unknown>;
}
export interface CrudBundle {
    queries: Record<string, GraphQLFieldConfig<unknown, unknown>>;
    mutations: Record<string, GraphQLFieldConfig<unknown, unknown>>;
    /** Mutation names this CRUD pass owns. Operation-mutation codegen reads this so collisions resolve to the Operation per D3. */
    crudMutationNames: Set<string>;
}
export declare function buildCrudFields(bundle: ResourceTypeBundle, resolvers: CrudResolverFactories): CrudBundle;
//# sourceMappingURL=crud.d.ts.map