"use strict";
/**
 * DNA noun primitive → GraphQL type codegen.
 *
 * Walks `dna.domain.{resources,persons,roles,groups}` and produces one
 * `GraphQLObjectType` per entry. Each type carries `id: ID!` plus one
 * field per declared `Attribute` (with the attribute-type mapping table
 * documented in design.md D1).
 *
 * Reference attributes (`attribute.type === 'reference'`) are surfaced as
 * scalar `ID` fields here. The expansion field (e.g. `borrower: Borrower`)
 * is added by `./relationships.ts` based on the DNA's
 * `relationships[]` primitives — not from the reference attribute alone.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLList = void 0;
exports.buildResourceTypes = buildResourceTypes;
const graphql_1 = require("graphql");
Object.defineProperty(exports, "GraphQLList", { enumerable: true, get: function () { return graphql_1.GraphQLList; } });
const naming_1 = require("./naming");
const NOUN_KEYS = [
    { key: 'resources', category: 'resource' },
    { key: 'persons', category: 'person' },
    { key: 'roles', category: 'role' },
    { key: 'groups', category: 'group' },
];
/**
 * Build the per-noun-primitive GraphQL types from a DNA. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them and may
 * extend the object types' fields (via the thunked `fields` API).
 */
function buildResourceTypes(dna) {
    const bundle = {
        registry: new Map(),
        categories: new Map(),
        inputRegistry: new Map(),
        enumRegistry: new Map(),
    };
    const domain = dna.domain ?? {};
    // First pass: collect every noun primitive so reference attributes can
    // resolve in any order (Loan.borrower references Borrower even when
    // Borrower is declared later in the DNA).
    const collected = [];
    for (const { key, category } of NOUN_KEYS) {
        const list = Array.isArray(domain[key]) ? domain[key] : [];
        for (const entry of list) {
            if (typeof entry?.name !== 'string')
                continue;
            if (bundle.registry.has(entry.name))
                continue;
            collected.push({ category, entry });
        }
    }
    // Second pass: pre-build per-attribute enums so the field builders can
    // look them up while wiring fields.
    for (const { entry } of collected) {
        if (!Array.isArray(entry.attributes))
            continue;
        for (const attr of entry.attributes) {
            if (attr.type === 'enum' && Array.isArray(attr.values) && attr.values.length > 0) {
                const key = enumKey(entry.name, attr.name);
                if (!bundle.enumRegistry.has(key)) {
                    bundle.enumRegistry.set(key, buildEnum(entry.name, attr));
                }
            }
        }
    }
    // Third pass: build object types and input types. Fields are thunked
    // so a reference attribute's target type doesn't need to exist in the
    // registry yet at construction time — only at field-resolution time.
    for (const { category, entry } of collected) {
        bundle.categories.set(entry.name, category);
        const objectType = new graphql_1.GraphQLObjectType({
            name: entry.name,
            description: typeof entry.description === 'string' ? entry.description : undefined,
            fields: () => buildObjectFields(entry, bundle),
        });
        bundle.registry.set(entry.name, objectType);
        const inputType = new graphql_1.GraphQLInputObjectType({
            name: `${entry.name}Input`,
            description: `Input shape for ${entry.name} mutations.`,
            fields: () => buildInputFields(entry, bundle),
        });
        bundle.inputRegistry.set(entry.name, inputType);
    }
    return bundle;
}
function buildObjectFields(entry, bundle) {
    const fields = {
        id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID), description: 'Unique identifier for this instance.' },
    };
    if (!Array.isArray(entry.attributes))
        return fields;
    for (const attr of entry.attributes) {
        // Skip user-declared `id` attributes — every type already carries the
        // reserved `id: ID!` field, and the underlying store treats `id` as a
        // control field (it's stamped on every Instance regardless of what
        // the DNA declares).
        if (attr.name === 'id')
            continue;
        const fieldName = (0, naming_1.snakeToCamel)(attr.name);
        fields[fieldName] = {
            type: applyRequired(outputTypeFor(entry.name, attr, bundle), attr.required === true),
            description: typeof attr.description === 'string' ? attr.description : undefined,
        };
    }
    return fields;
}
function buildInputFields(entry, bundle) {
    // Every Input carries an optional `id: ID`. The hybrid-ID contract in
    // the underlying store (design.md D4) lets callers supply a known id;
    // surfacing it on Input mirrors that capability. It also guarantees
    // Input types always have at least one field (GraphQL requires that)
    // even for noun primitives with no declared attributes.
    const fields = {
        id: {
            type: graphql_1.GraphQLID,
            description: 'Optional caller-provided id. When omitted, the store generates a UUIDv4.',
        },
    };
    if (!Array.isArray(entry.attributes))
        return fields;
    for (const attr of entry.attributes) {
        if (attr.name === 'id')
            continue;
        const fieldName = (0, naming_1.snakeToCamel)(attr.name);
        fields[fieldName] = {
            type: applyRequiredInput(inputTypeFor(entry.name, attr, bundle), attr.required === true),
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
            // Scalar FK. The expanded type field is added by ./relationships.ts
            // off the DNA's `relationships[]` primitive, not off the reference
            // attribute. The FK itself is always an ID scalar.
            return graphql_1.GraphQLID;
        default:
            return graphql_1.GraphQLString;
    }
}
function inputTypeFor(typeName, attr, bundle) {
    // Input types use the same scalar/enum mappings; only object/list
    // wrapping differs, and DNA attributes are always scalar shapes.
    const output = outputTypeFor(typeName, attr, bundle);
    // GraphQL types are simultaneously valid as input/output for scalars
    // and enums, so the cast is safe.
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
    // Convert snake_case to PascalCase for enum type naming.
    return s
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
//# sourceMappingURL=types.js.map