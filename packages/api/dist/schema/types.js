"use strict";
/**
 * `ResourceType` records → GraphQL types codegen.
 *
 * Given an array of live `ResourceType` records (typically from
 * `dataStore.resourceType.list()`), produces one `GraphQLObjectType` per
 * ResourceType, each carrying `id: ID!`, `_schemaVersion: Int!`, plus one
 * field per declared `AttributeSchemaEntry` (with the attribute-type
 * mapping table documented in design.md D1).
 *
 * Reference attributes (`type === 'reference'`) are surfaced as scalar
 * `ID` fields here. The expansion field (e.g. `borrower: Borrower`) is
 * added by `./relationships.ts` based on declared `RelationshipType`
 * records — not from the reference attribute alone.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLList = void 0;
exports.buildResourceTypes = buildResourceTypes;
const graphql_1 = require("graphql");
Object.defineProperty(exports, "GraphQLList", { enumerable: true, get: function () { return graphql_1.GraphQLList; } });
const naming_1 = require("./naming");
/**
 * Build per-ResourceType GraphQL output and input types. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them.
 */
function buildResourceTypes(resourceTypes) {
    const bundle = {
        registry: new Map(),
        categories: new Map(),
        inputRegistry: new Map(),
        enumRegistry: new Map(),
    };
    // First pass: pre-build per-attribute enums so the field builders can
    // look them up while wiring fields.
    for (const rt of resourceTypes) {
        for (const attr of rt.attribute_schema ?? []) {
            if (attr.type === 'enum' && Array.isArray(attr.values) && attr.values.length > 0) {
                const key = enumKey(rt.name, attr.name);
                if (!bundle.enumRegistry.has(key)) {
                    bundle.enumRegistry.set(key, buildEnum(rt.name, attr));
                }
            }
        }
    }
    // Second pass: build object types and input types. Fields are thunked
    // so a reference attribute's target type doesn't need to exist in the
    // registry yet at construction time — only at field-resolution time.
    for (const rt of resourceTypes) {
        bundle.categories.set(rt.name, rt.category);
        const objectType = new graphql_1.GraphQLObjectType({
            name: rt.name,
            description: typeof rt.description === 'string' ? rt.description : undefined,
            fields: () => buildObjectFields(rt, bundle),
        });
        bundle.registry.set(rt.name, objectType);
        const inputType = new graphql_1.GraphQLInputObjectType({
            name: `${rt.name}Input`,
            description: `Input shape for ${rt.name} mutations.`,
            fields: () => buildInputFields(rt, bundle),
        });
        bundle.inputRegistry.set(rt.name, inputType);
    }
    return bundle;
}
function buildObjectFields(rt, bundle) {
    const fields = {
        id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID), description: 'Unique identifier for this instance.' },
        _schemaVersion: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt),
            description: 'ResourceType.current_version stamped when this record was written.',
            resolve: (parent) => {
                const rec = parent;
                const v = rec?._schemaVersion;
                if (typeof v === 'number')
                    return v;
                return rt.current_version;
            },
        },
    };
    for (const attr of rt.attribute_schema ?? []) {
        if (attr.name === 'id')
            continue;
        const fieldName = (0, naming_1.snakeToCamel)(attr.name);
        fields[fieldName] = {
            type: applyRequired(outputTypeFor(rt.name, attr, bundle), attr.required === true),
            description: typeof attr.description === 'string' ? attr.description : undefined,
        };
    }
    return fields;
}
function buildInputFields(rt, bundle) {
    const fields = {
        id: {
            type: graphql_1.GraphQLID,
            description: 'Optional caller-provided id. When omitted, the store generates a UUIDv4.',
        },
    };
    for (const attr of rt.attribute_schema ?? []) {
        if (attr.name === 'id')
            continue;
        const fieldName = (0, naming_1.snakeToCamel)(attr.name);
        fields[fieldName] = {
            type: applyRequiredInput(inputTypeFor(rt.name, attr, bundle), attr.required === true),
            description: typeof attr.description === 'string' ? attr.description : undefined,
        };
    }
    return fields;
}
function outputTypeFor(typeName, attr, bundle) {
    switch (attr.type) {
        case 'string':
        case 'text':
        case 'date':
        case 'datetime':
            return graphql_1.GraphQLString;
        case 'number':
            return graphql_1.GraphQLFloat;
        case 'boolean':
            return graphql_1.GraphQLBoolean;
        case 'enum': {
            const key = enumKey(typeName, attr.name);
            const enumType = bundle.enumRegistry.get(key);
            if (!enumType)
                return graphql_1.GraphQLString;
            return enumType;
        }
        case 'reference':
            return graphql_1.GraphQLID;
        default:
            return graphql_1.GraphQLString;
    }
}
function inputTypeFor(typeName, attr, bundle) {
    const output = outputTypeFor(typeName, attr, bundle);
    return output;
}
function applyRequired(type, required) {
    return required ? new graphql_1.GraphQLNonNull(type) : type;
}
function applyRequiredInput(type, required) {
    return required ? new graphql_1.GraphQLNonNull(type) : type;
}
function buildEnum(typeName, attr) {
    const values = {};
    for (const value of attr.values ?? []) {
        const enumValueName = (0, naming_1.toEnumValue)(value);
        if (!enumValueName)
            continue;
        values[enumValueName] = { value };
    }
    return new graphql_1.GraphQLEnumType({
        name: `${typeName}${capitalize(attr.name)}`,
        values,
        description: typeof attr.description === 'string' ? attr.description : undefined,
    });
}
function enumKey(typeName, attrName) {
    return `${typeName}.${attrName}`;
}
function capitalize(s) {
    if (!s)
        return s;
    return s
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
//# sourceMappingURL=types.js.map