"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCrudFields = buildCrudFields;
const graphql_1 = require("graphql");
const naming_1 = require("./naming");
function buildCrudFields(bundle, resolvers) {
    const queries = {};
    const mutations = {};
    const crudMutationNames = new Set();
    for (const [typeName, objectType] of bundle.registry) {
        const inputType = bundle.inputRegistry.get(typeName);
        if (!inputType)
            continue;
        const singularField = (0, naming_1.pascalToCamel)(typeName);
        const pluralField = (0, naming_1.pluralize)(typeName);
        const createName = `create${typeName}`;
        const updateName = `update${typeName}`;
        const deleteName = `delete${typeName}`;
        queries[singularField] = {
            type: objectType,
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: resolvers.get(typeName),
            description: `Fetch a single ${typeName} by id.`,
        };
        queries[pluralField] = {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(objectType))),
            resolve: resolvers.list(typeName),
            description: `List every ${typeName}.`,
        };
        mutations[createName] = {
            type: new graphql_1.GraphQLNonNull(objectType),
            args: { input: { type: new graphql_1.GraphQLNonNull(inputType) } },
            resolve: resolvers.create(typeName),
            description: `Create a new ${typeName} instance.`,
        };
        mutations[updateName] = {
            type: new graphql_1.GraphQLNonNull(objectType),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                input: { type: new graphql_1.GraphQLNonNull(inputType) },
            },
            resolve: resolvers.update(typeName),
            description: `Update an existing ${typeName} by id.`,
        };
        mutations[deleteName] = {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: resolvers.delete(typeName),
            description: `Delete a ${typeName} by id.`,
        };
        crudMutationNames.add(createName);
        crudMutationNames.add(updateName);
        crudMutationNames.add(deleteName);
    }
    return { queries, mutations, crudMutationNames };
}
//# sourceMappingURL=crud.js.map