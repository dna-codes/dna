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
import { GraphQLSchema } from 'graphql';
import type { DnaDataStore } from '@dna-codes/dna-core';
import type { ValidatorCache } from '../validation/validator-cache';
import { SchemaManager } from './schema-manager';
export interface BuildSchemaArgs {
    dataStore: DnaDataStore;
    validatorCache: ValidatorCache;
    schemaManager: SchemaManager;
}
/**
 * Build a fresh `GraphQLSchema` from the data store's current state.
 * Called by the SchemaManager's builder closure on every rebuild.
 */
export declare function buildRegistrySchema(args: BuildSchemaArgs): Promise<GraphQLSchema>;
//# sourceMappingURL=index.d.ts.map