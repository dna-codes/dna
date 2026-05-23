/**
 * Instance-CRUD resolvers. Every function returns a GraphQL resolver
 * that closes over an injected `DnaDataStore`. No store imports outside
 * this module's factory functions — the schema composer wires the
 * dependency in one place.
 */
import type { DnaDataStore } from '@dna-codes/dna-core';
import type { GraphQLFieldResolver } from 'graphql';
interface CrudArgs {
    dataStore: DnaDataStore;
    typeName: string;
}
export declare function makeGetResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeListResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeCreateResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeUpdateResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeDeleteResolver({ dataStore, typeName }: CrudArgs): GraphQLFieldResolver<unknown, unknown>;
export {};
//# sourceMappingURL=instance.d.ts.map