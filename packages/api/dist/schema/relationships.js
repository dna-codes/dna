"use strict";
/**
 * `RelationshipType` records → GraphQL expansion fields codegen.
 *
 * For each `RelationshipType` record (typically from
 * `dataStore.relationshipType.list()`), the codegen adds an expansion
 * field on the `from` ResourceType's GraphQL type. Cardinality drives
 * single-vs-list (many-to-one/one-to-one → single; the others → list).
 *
 * The field name is derived from the relationship's `attribute` field
 * (trailing `_id` stripped, camelCased). The resolver factory is wired
 * by the schema composer in `./index.ts`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRelationshipFields = planRelationshipFields;
exports.buildRelationshipFieldConfigs = buildRelationshipFieldConfigs;
exports.extendObjectFields = extendObjectFields;
const graphql_1 = require("graphql");
const naming_1 = require("./naming");
/**
 * Compute relationship-field metadata from live `RelationshipType` records.
 * Returns one entry per `RelationshipType` whose `from` AND `to` types both
 * exist in the bundle.
 */
function planRelationshipFields(relationshipTypes, bundle) {
    const out = [];
    for (const rrt of relationshipTypes) {
        const fromType = bundle.registry.get(rrt.from);
        const toType = bundle.registry.get(rrt.to);
        if (!fromType || !toType)
            continue;
        const isList = rrt.cardinality === 'one-to-many' || rrt.cardinality === 'many-to-many';
        const fieldName = (0, naming_1.stripIdSuffix)(rrt.attribute);
        const fieldType = isList
            ? new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(toType))
            : toType;
        out.push({
            fromType: rrt.from,
            fieldName,
            fieldType,
            info: {
                fromType: rrt.from,
                toType: rrt.to,
                fieldName,
                relationshipName: rrt.name,
                cardinality: rrt.cardinality,
                isList,
            },
        });
    }
    return out;
}
function buildRelationshipFieldConfigs(builders, resolverFor) {
    const grouped = new Map();
    for (const b of builders) {
        const existing = grouped.get(b.fromType) ?? {};
        existing[b.fieldName] = {
            type: b.fieldType,
            resolve: resolverFor(b.info),
        };
        grouped.set(b.fromType, existing);
    }
    return grouped;
}
function extendObjectFields(bundle, additions) {
    for (const [typeName, addedFields] of additions) {
        const objectType = bundle.registry.get(typeName);
        if (!objectType)
            continue;
        const config = objectType.toConfig();
        const existingFields = config.fields;
        const newFields = { ...existingFields, ...addedFields };
        const updated = new objectType.constructor({
            ...config,
            fields: newFields,
        });
        bundle.registry.set(typeName, updated);
    }
}
//# sourceMappingURL=relationships.js.map