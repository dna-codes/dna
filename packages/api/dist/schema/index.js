"use strict";
/**
 * Schema composition entry point.
 *
 * Builds a GraphQL schema from an `OperationalDNA` and an injected
 * `DnaDataStore`. The order of operations matters:
 *
 *   1. Validate DNA via `DnaValidator` (fails fast on malformed input).
 *   2. Build per-noun-primitive types + inputs + enums.
 *   3. Plan relationship fields, build their resolvers, and extend the
 *      object types in the registry with the expansion fields.
 *   4. Build CRUD queries + mutations with resolvers.
 *   5. Build Operation mutations; collisions resolve to the Operation.
 *   6. Assemble into a `GraphQLSchema` with `Query` + `Mutation`
 *      root types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSchema = buildSchema;
const graphql_1 = require("graphql");
const dna_core_1 = require("@dna-codes/dna-core");
const instance_1 = require("../resolvers/instance");
const operations_1 = require("../resolvers/operations");
const relationships_1 = require("../resolvers/relationships");
const crud_1 = require("./crud");
const operations_2 = require("./operations");
const relationships_2 = require("./relationships");
const types_1 = require("./types");
const OPERATIONAL_SCHEMA_ID = 'https://dna.codes/schemas/operational';
function buildSchema({ dna, dataStore, skipValidation = false }) {
    if (!skipValidation) {
        const validator = new dna_core_1.DnaValidator();
        const result = validator.validate(dna, OPERATIONAL_SCHEMA_ID);
        if (!result.valid) {
            const detail = result.errors
                .map((e) => `  - ${e.instancePath || '/'}: ${e.message}`)
                .join('\n');
            throw new Error(`dna-api: supplied DNA failed validation:\n${detail}`);
        }
    }
    // §2 — types, inputs, enums.
    const bundle = (0, types_1.buildResourceTypes)(dna);
    // §3 — relationship expansion fields.
    const relationshipBuilders = (0, relationships_2.planRelationshipFields)(dna, bundle);
    const relationshipFieldConfigs = (0, relationships_2.buildRelationshipFieldConfigs)(relationshipBuilders, (info) => (0, relationships_1.makeRelationshipResolver)({ dataStore, info }));
    (0, relationships_2.extendObjectFields)(bundle, relationshipFieldConfigs);
    // §4 — generic CRUD.
    const crudResolvers = {
        get: (typeName) => (0, instance_1.makeGetResolver)({ dataStore, typeName }),
        list: (typeName) => (0, instance_1.makeListResolver)({ dataStore, typeName }),
        create: (typeName) => (0, instance_1.makeCreateResolver)({ dataStore, typeName }),
        update: (typeName) => (0, instance_1.makeUpdateResolver)({ dataStore, typeName }),
        delete: (typeName) => (0, instance_1.makeDeleteResolver)({ dataStore, typeName }),
    };
    const crud = (0, crud_1.buildCrudFields)(bundle, crudResolvers);
    // §5 — Operation mutations (may shadow CRUD per D3).
    const operationResolvers = {
        forTarget: (targetType) => (0, operations_1.makeOperationResolver)({ dataStore, targetType }),
    };
    const opBundle = (0, operations_2.buildOperationMutations)(dna, bundle, operationResolvers, crud.crudMutationNames);
    // Drop any CRUD mutation that an Operation shadowed (per D3).
    const finalCrudMutations = {};
    for (const [name, field] of Object.entries(crud.mutations)) {
        if (opBundle.crudMutationsToOmit.has(name))
            continue;
        finalCrudMutations[name] = field;
    }
    const mutationFields = { ...finalCrudMutations, ...opBundle.mutations };
    // If a DNA declares zero queries / mutations (e.g. no noun primitives),
    // GraphQL still wants an object with at least one field. Synthesize a
    // `_meta` field as a fallback so the schema is constructible.
    const queryFields = Object.keys(crud.queries).length > 0
        ? crud.queries
        : { _meta: emptyMetaField('No queries available — the DNA declares no noun primitives.') };
    const mutationType = Object.keys(mutationFields).length > 0
        ? new graphql_1.GraphQLObjectType({ name: 'Mutation', fields: mutationFields })
        : undefined;
    return new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({ name: 'Query', fields: queryFields }),
        ...(mutationType ? { mutation: mutationType } : {}),
        // Include every object type explicitly so the introspection includes
        // them even if no field references them directly (defensive).
        types: [...bundle.registry.values()],
    });
}
function emptyMetaField(description) {
    return {
        type: require('graphql').GraphQLString,
        resolve: () => description,
        description,
    };
}
//# sourceMappingURL=index.js.map