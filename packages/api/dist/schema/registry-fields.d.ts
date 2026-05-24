/**
 * Top-level Query and Mutation fields for the registry-native admin
 * surface (ResourceType + RelationshipType CRUD).
 *
 * Resolvers close over an injected `DnaDataStore` AND a `SchemaManager`
 * — type mutations call `schemaManager.rebuild()` after a successful
 * storage write so the next request sees the updated schema.
 */
import { type GraphQLFieldConfig } from 'graphql';
import type { DnaDataStore } from '@dna-codes/dna-core';
import type { SchemaManager } from './schema-manager';
import { buildRelationshipTypeOutputType, buildResourceTypeOutputType } from './registry-types';
export interface RegistryFieldsArgs {
    dataStore: DnaDataStore;
    schemaManager: SchemaManager;
}
export interface RegistryBundle {
    queries: Record<string, GraphQLFieldConfig<unknown, unknown>>;
    mutations: Record<string, GraphQLFieldConfig<unknown, unknown>>;
    /** The dynamically-resolved GraphQL types (so the composer can register them in the schema). */
    outputTypes: {
        ResourceType: ReturnType<typeof buildResourceTypeOutputType>;
        RelationshipType: ReturnType<typeof buildRelationshipTypeOutputType>;
    };
}
export declare function buildRegistryFields({ dataStore, schemaManager, }: RegistryFieldsArgs): RegistryBundle;
//# sourceMappingURL=registry-fields.d.ts.map