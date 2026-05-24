/**
 * Instance-CRUD resolvers. Every factory returns a GraphQL resolver that
 * closes over an injected `DnaDataStore` and (for write methods) a
 * `ValidatorCache` that compiles ajv validators per
 * `(resourceTypeId, current_version)` pair.
 *
 * Validation timing: per design.md D6, write resolvers validate the input
 * `data` against the live `ResourceType.attribute_schema` at its
 * `current_version` before invoking the store. Read resolvers don't
 * validate — they return whatever is in the store.
 */
import type { DnaDataStore } from '@dna-codes/dna-core';
import { type GraphQLFieldResolver } from 'graphql';
import { type ValidatorCache } from '../validation/validator-cache';
interface ReadArgs {
    dataStore: DnaDataStore;
    typeName: string;
}
interface WriteArgs extends ReadArgs {
    validatorCache: ValidatorCache;
}
export declare function makeGetResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeListResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeCreateResolver({ dataStore, typeName, validatorCache, }: WriteArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeUpdateResolver({ dataStore, typeName, validatorCache, }: WriteArgs): GraphQLFieldResolver<unknown, unknown>;
export declare function makeDeleteResolver({ dataStore, typeName }: ReadArgs): GraphQLFieldResolver<unknown, unknown>;
export {};
//# sourceMappingURL=instance.d.ts.map