"use strict";
/**
 * Fixed top-level GraphQL types for the registry-native admin API.
 *
 * These types are stable across schema regenerations — they don't depend
 * on which `ResourceType` records exist in the tenant's store. They are
 * the surface tenant admins use to mutate the type system itself.
 *
 * Types declared here:
 *   - `NounCategory` (enum: PERSON / ROLE / GROUP / RESOURCE)
 *   - `AttributeType` (enum: STRING / TEXT / NUMBER / BOOLEAN / DATE / DATETIME / ENUM / REFERENCE)
 *   - `AttributeSchemaEntry` (object, used in both ResourceType and input shapes)
 *   - `ResourceType`, `ResourceTypeVersion` (read+write)
 *   - `RelationshipType`, `RelationshipTypeVersion` (read+write)
 *   - Inputs for each create / update mutation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipTypeUpdateInput = exports.RelationshipTypeInputObject = exports.ResourceTypeUpdateInput = exports.ResourceTypeInputObject = exports.RelationshipTypeVersionType = exports.ResourceTypeVersionType = exports.AttributeSchemaEntryInput = exports.AttributeSchemaEntryType = exports.CardinalityEnum = exports.AttributeTypeEnum = exports.NounCategoryEnum = exports.StabilityEnum = void 0;
exports.buildResourceTypeOutputType = buildResourceTypeOutputType;
exports.buildRelationshipTypeOutputType = buildRelationshipTypeOutputType;
const graphql_1 = require("graphql");
const dna_core_1 = require("@dna-codes/dna-core");
/**
 * Stability enum, derived from the core `STABILITIES` array so the GraphQL
 * surface and the core `Stability` union cannot drift. Members are the
 * upper-cased value names (e.g. `experimental` → `EXPERIMENTAL`).
 */
exports.StabilityEnum = new graphql_1.GraphQLEnumType({
    name: 'Stability',
    values: Object.fromEntries(dna_core_1.STABILITIES.map((s) => [s.toUpperCase(), { value: s }])),
});
exports.NounCategoryEnum = new graphql_1.GraphQLEnumType({
    name: 'NounCategory',
    values: {
        PERSON: { value: 'person' },
        ROLE: { value: 'role' },
        GROUP: { value: 'group' },
        RESOURCE: { value: 'resource' },
    },
});
exports.AttributeTypeEnum = new graphql_1.GraphQLEnumType({
    name: 'AttributeType',
    values: {
        STRING: { value: 'string' },
        TEXT: { value: 'text' },
        NUMBER: { value: 'number' },
        BOOLEAN: { value: 'boolean' },
        DATE: { value: 'date' },
        DATETIME: { value: 'datetime' },
        ENUM: { value: 'enum' },
        REFERENCE: { value: 'reference' },
    },
});
exports.CardinalityEnum = new graphql_1.GraphQLEnumType({
    name: 'Cardinality',
    values: {
        ONE_TO_ONE: { value: 'one-to-one' },
        ONE_TO_MANY: { value: 'one-to-many' },
        MANY_TO_ONE: { value: 'many-to-one' },
        MANY_TO_MANY: { value: 'many-to-many' },
    },
});
exports.AttributeSchemaEntryType = new graphql_1.GraphQLObjectType({
    name: 'AttributeSchemaEntry',
    fields: () => ({
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        type: { type: new graphql_1.GraphQLNonNull(exports.AttributeTypeEnum) },
        description: { type: graphql_1.GraphQLString },
        required: { type: graphql_1.GraphQLBoolean },
        values: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)) },
        resource: { type: graphql_1.GraphQLString },
    }),
});
exports.AttributeSchemaEntryInput = new graphql_1.GraphQLInputObjectType({
    name: 'AttributeSchemaEntryInput',
    fields: () => ({
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        type: { type: new graphql_1.GraphQLNonNull(exports.AttributeTypeEnum) },
        description: { type: graphql_1.GraphQLString },
        required: { type: graphql_1.GraphQLBoolean },
        values: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)) },
        resource: { type: graphql_1.GraphQLString },
    }),
});
exports.ResourceTypeVersionType = new graphql_1.GraphQLObjectType({
    name: 'ResourceTypeVersion',
    fields: () => ({
        id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        resourceTypeId: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
            resolve: (src) => src.resource_type_id,
        },
        version: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        attributeSchema: {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryType))),
            resolve: (src) => src.attribute_schema,
        },
        stability: { type: new graphql_1.GraphQLNonNull(exports.StabilityEnum) },
        createdAt: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
            resolve: (src) => src.created_at,
        },
    }),
});
exports.RelationshipTypeVersionType = new graphql_1.GraphQLObjectType({
    name: 'RelationshipTypeVersion',
    fields: () => ({
        id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        relationshipTypeId: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID),
            resolve: (src) => src.relationship_type_id,
        },
        version: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
        attributeSchema: {
            type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryType)),
            resolve: (src) => src.attribute_schema ?? null,
        },
        stability: { type: new graphql_1.GraphQLNonNull(exports.StabilityEnum) },
        createdAt: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
            resolve: (src) => src.created_at,
        },
    }),
});
/**
 * `ResourceType` and `RelationshipType` types are constructed via a
 * factory because their `versions: [...]` field is resolved through the
 * data store, which is wired by the schema composer.
 */
function buildResourceTypeOutputType(versionsResolver) {
    return new graphql_1.GraphQLObjectType({
        name: 'ResourceType',
        fields: () => ({
            id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
            name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            category: { type: new graphql_1.GraphQLNonNull(exports.NounCategoryEnum) },
            attributeSchema: {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryType))),
                resolve: (src) => src.attribute_schema,
            },
            currentVersion: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
                resolve: (src) => src.current_version,
            },
            stability: { type: new graphql_1.GraphQLNonNull(exports.StabilityEnum) },
            description: { type: graphql_1.GraphQLString },
            isSeed: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
                resolve: (src) => src.is_seed,
            },
            versions: {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.ResourceTypeVersionType))),
                resolve: (src) => versionsResolver({ id: String(src.id) }),
            },
        }),
    });
}
function buildRelationshipTypeOutputType(versionsResolver) {
    return new graphql_1.GraphQLObjectType({
        name: 'RelationshipType',
        fields: () => ({
            id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
            name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            from: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            to: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            cardinality: { type: new graphql_1.GraphQLNonNull(exports.CardinalityEnum) },
            attribute: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
            inverse: { type: graphql_1.GraphQLString },
            attributeSchema: {
                type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryType)),
                resolve: (src) => src.attribute_schema ?? null,
            },
            currentVersion: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
                resolve: (src) => src.current_version,
            },
            stability: { type: new graphql_1.GraphQLNonNull(exports.StabilityEnum) },
            description: { type: graphql_1.GraphQLString },
            isSeed: {
                type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLBoolean),
                resolve: (src) => src.is_seed,
            },
            versions: {
                type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.RelationshipTypeVersionType))),
                resolve: (src) => versionsResolver({ id: String(src.id) }),
            },
        }),
    });
}
exports.ResourceTypeInputObject = new graphql_1.GraphQLInputObjectType({
    name: 'ResourceTypeInput',
    fields: () => ({
        id: { type: graphql_1.GraphQLID },
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        category: { type: new graphql_1.GraphQLNonNull(exports.NounCategoryEnum) },
        attributeSchema: {
            type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryInput))),
        },
        stability: { type: exports.StabilityEnum },
        description: { type: graphql_1.GraphQLString },
    }),
});
exports.ResourceTypeUpdateInput = new graphql_1.GraphQLInputObjectType({
    name: 'ResourceTypeUpdateInput',
    fields: () => ({
        attributeSchema: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryInput)) },
        stability: { type: exports.StabilityEnum },
        description: { type: graphql_1.GraphQLString },
    }),
});
exports.RelationshipTypeInputObject = new graphql_1.GraphQLInputObjectType({
    name: 'RelationshipTypeInput',
    fields: () => ({
        id: { type: graphql_1.GraphQLID },
        name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        from: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        to: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        cardinality: { type: new graphql_1.GraphQLNonNull(exports.CardinalityEnum) },
        attribute: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        inverse: { type: graphql_1.GraphQLString },
        attributeSchema: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryInput)) },
        stability: { type: exports.StabilityEnum },
        description: { type: graphql_1.GraphQLString },
    }),
});
exports.RelationshipTypeUpdateInput = new graphql_1.GraphQLInputObjectType({
    name: 'RelationshipTypeUpdateInput',
    fields: () => ({
        cardinality: { type: exports.CardinalityEnum },
        attribute: { type: graphql_1.GraphQLString },
        inverse: { type: graphql_1.GraphQLString },
        attributeSchema: { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(exports.AttributeSchemaEntryInput)) },
        stability: { type: exports.StabilityEnum },
        description: { type: graphql_1.GraphQLString },
    }),
});
//# sourceMappingURL=registry-types.js.map