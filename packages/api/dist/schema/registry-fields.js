"use strict";
/**
 * Top-level Query and Mutation fields for the registry-native admin
 * surface (ResourceType + RelationshipType CRUD).
 *
 * Resolvers close over an injected `DnaDataStore` AND a `SchemaManager`
 * — type mutations call `schemaManager.rebuild()` after a successful
 * storage write so the next request sees the updated schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRegistryFields = buildRegistryFields;
const graphql_1 = require("graphql");
const registry_types_1 = require("./registry-types");
function normalizeAttributeSchemaInput(input) {
    if (!input)
        return [];
    return input.map((raw) => ({
        name: String(raw.name),
        type: raw.type,
        ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
        ...(typeof raw.required === 'boolean' ? { required: raw.required } : {}),
        ...(Array.isArray(raw.values) ? { values: raw.values } : {}),
        ...(typeof raw.resource === 'string' ? { resource: raw.resource } : {}),
    }));
}
function buildRegistryFields({ dataStore, schemaManager, }) {
    const ResourceTypeOutput = (0, registry_types_1.buildResourceTypeOutputType)((parent) => dataStore.resourceType.versions(parent.id));
    const RelationshipTypeOutput = (0, registry_types_1.buildRelationshipTypeOutputType)((parent) => dataStore.relationshipType.versions(parent.id));
    const queries = {
        resourceType: {
            type: ResourceTypeOutput,
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: async (_p, args) => {
                const { id } = args;
                return dataStore.resourceType.get(id);
            },
        },
        resourceTypes: {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(ResourceTypeOutput))),
            args: { category: { type: registry_types_1.NounCategoryEnum } },
            resolve: async (_p, args) => {
                const { category } = args;
                return dataStore.resourceType.list(category ? { category } : undefined);
            },
        },
        resourceTypeVersion: {
            type: registry_types_1.ResourceTypeVersionType,
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: async (_p, args) => {
                // No direct getter for a single version exists on the contract; scan.
                const { id } = args;
                const allTypes = await dataStore.resourceType.list();
                for (const rt of allTypes) {
                    const versions = await dataStore.resourceType.versions(rt.id);
                    const match = versions.find((v) => v.id === id);
                    if (match)
                        return match;
                }
                return null;
            },
        },
        relationshipType: {
            type: RelationshipTypeOutput,
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: async (_p, args) => {
                const { id } = args;
                return dataStore.relationshipType.get(id);
            },
        },
        relationshipTypes: {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(RelationshipTypeOutput))),
            resolve: async () => dataStore.relationshipType.list(),
        },
        relationshipTypeVersion: {
            type: registry_types_1.RelationshipTypeVersionType,
            args: { id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) } },
            resolve: async (_p, args) => {
                const { id } = args;
                const allTypes = await dataStore.relationshipType.list();
                for (const rt of allTypes) {
                    const versions = await dataStore.relationshipType.versions(rt.id);
                    const match = versions.find((v) => v.id === id);
                    if (match)
                        return match;
                }
                return null;
            },
        },
    };
    const mutations = {
        createResourceType: {
            type: new graphql_1.GraphQLNonNull(ResourceTypeOutput),
            args: { input: { type: new graphql_1.GraphQLNonNull(registry_types_1.ResourceTypeInputObject) } },
            resolve: async (_p, args) => {
                const { input } = args;
                const { id } = await dataStore.resourceType.create({
                    ...(input.id ? { id: input.id } : {}),
                    name: input.name,
                    category: input.category,
                    attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                });
                await schemaManager.rebuild();
                return dataStore.resourceType.get(id);
            },
        },
        updateResourceType: {
            type: new graphql_1.GraphQLNonNull(ResourceTypeOutput),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                input: { type: new graphql_1.GraphQLNonNull(registry_types_1.ResourceTypeUpdateInput) },
            },
            resolve: async (_p, args) => {
                const { id, input } = args;
                await dataStore.resourceType.update(id, {
                    ...(input.attributeSchema !== undefined
                        ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
                        : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                });
                await schemaManager.rebuild();
                return dataStore.resourceType.get(id);
            },
        },
        deleteResourceType: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                cascade: { type: graphql_1.GraphQLBoolean },
            },
            resolve: async (_p, args) => {
                const { id, cascade } = args;
                const existing = await dataStore.resourceType.get(id);
                if (existing?.is_seed && !cascade) {
                    throw new Error(`Cannot delete seed ResourceType "${existing.name}" without cascade: true. Seed types ship from the foundational DNA — pass cascade: true to confirm deletion.`);
                }
                await dataStore.resourceType.delete(id, cascade ? { cascade: true } : undefined);
                await schemaManager.rebuild();
                return true;
            },
        },
        createRelationshipType: {
            type: new graphql_1.GraphQLNonNull(RelationshipTypeOutput),
            args: { input: { type: new graphql_1.GraphQLNonNull(registry_types_1.RelationshipTypeInputObject) } },
            resolve: async (_p, args) => {
                const { input } = args;
                const { id } = await dataStore.relationshipType.create({
                    ...(input.id ? { id: input.id } : {}),
                    name: input.name,
                    from: input.from,
                    to: input.to,
                    cardinality: input.cardinality,
                    attribute: input.attribute,
                    ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
                    ...(input.attributeSchema !== undefined
                        ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
                        : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                });
                await schemaManager.rebuild();
                return dataStore.relationshipType.get(id);
            },
        },
        updateRelationshipType: {
            type: new graphql_1.GraphQLNonNull(RelationshipTypeOutput),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                input: { type: new graphql_1.GraphQLNonNull(registry_types_1.RelationshipTypeUpdateInput) },
            },
            resolve: async (_p, args) => {
                const { id, input } = args;
                await dataStore.relationshipType.update(id, {
                    ...(input.cardinality !== undefined ? { cardinality: input.cardinality } : {}),
                    ...(input.attribute !== undefined ? { attribute: input.attribute } : {}),
                    ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
                    ...(input.attributeSchema !== undefined
                        ? { attribute_schema: normalizeAttributeSchemaInput(input.attributeSchema) }
                        : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                });
                await schemaManager.rebuild();
                return dataStore.relationshipType.get(id);
            },
        },
        deleteRelationshipType: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
            args: {
                id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
                cascade: { type: graphql_1.GraphQLBoolean },
            },
            resolve: async (_p, args) => {
                const { id, cascade } = args;
                const existing = await dataStore.relationshipType.get(id);
                if (existing?.is_seed && !cascade) {
                    throw new Error(`Cannot delete seed RelationshipType "${existing.name}" without cascade: true.`);
                }
                await dataStore.relationshipType.delete(id, cascade ? { cascade: true } : undefined);
                await schemaManager.rebuild();
                return true;
            },
        },
    };
    // Suppress unused-warning for fields that the GraphQLList constructor handles internally.
    void registry_types_1.CardinalityEnum;
    return {
        queries,
        mutations,
        outputTypes: {
            ResourceType: ResourceTypeOutput,
            RelationshipType: RelationshipTypeOutput,
        },
    };
}
//# sourceMappingURL=registry-fields.js.map