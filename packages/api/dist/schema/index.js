"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRegistrySchema = buildRegistrySchema;
const graphql_1 = require("graphql");
const instance_1 = require("../resolvers/instance");
const relationships_1 = require("../resolvers/relationships");
const crud_1 = require("./crud");
const registry_fields_1 = require("./registry-fields");
const relationships_2 = require("./relationships");
const types_1 = require("./types");
/**
 * Build a fresh `GraphQLSchema` from the data store's current state.
 * Called by the SchemaManager's builder closure on every rebuild.
 */
async function buildRegistrySchema(args) {
    const { dataStore, validatorCache, schemaManager } = args;
    // Fetch current registry state.
    const [resourceTypes, relationshipTypes] = await Promise.all([
        dataStore.resourceType.list(),
        dataStore.relationshipType.list(),
    ]);
    // Build per-ResourceType GraphQL types.
    const bundle = (0, types_1.buildResourceTypes)(resourceTypes);
    // Add relationship expansion fields.
    const relationshipBuilders = (0, relationships_2.planRelationshipFields)(relationshipTypes, bundle);
    const relationshipFieldConfigs = (0, relationships_2.buildRelationshipFieldConfigs)(relationshipBuilders, (info) => (0, relationships_1.makeRelationshipResolver)({ dataStore, info }));
    (0, relationships_2.extendObjectFields)(bundle, relationshipFieldConfigs);
    // Build per-type CRUD with validating resolvers.
    const crudResolvers = {
        get: (typeName) => (0, instance_1.makeGetResolver)({ dataStore, typeName }),
        list: (typeName) => (0, instance_1.makeListResolver)({ dataStore, typeName }),
        create: (typeName) => (0, instance_1.makeCreateResolver)({ dataStore, typeName, validatorCache }),
        update: (typeName) => (0, instance_1.makeUpdateResolver)({ dataStore, typeName, validatorCache }),
        delete: (typeName) => (0, instance_1.makeDeleteResolver)({ dataStore, typeName }),
    };
    const crud = (0, crud_1.buildCrudFields)(bundle, crudResolvers);
    // Build fixed top-level admin fields.
    const registry = (0, registry_fields_1.buildRegistryFields)({ dataStore, schemaManager });
    // Compose Query.
    const queryFields = {
        ...registry.queries,
        ...crud.queries,
    };
    if (Object.keys(queryFields).length === 0) {
        queryFields._meta = {
            type: graphql_1.GraphQLString,
            resolve: () => 'No queries available — the type system is empty.',
        };
    }
    // Compose Mutation.
    const mutationFields = {
        ...registry.mutations,
        ...crud.mutations,
    };
    return new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({ name: 'Query', fields: queryFields }),
        mutation: new graphql_1.GraphQLObjectType({ name: 'Mutation', fields: mutationFields }),
        types: [
            registry.outputTypes.ResourceType,
            registry.outputTypes.RelationshipType,
            ...bundle.registry.values(),
        ],
    });
}
//# sourceMappingURL=index.js.map