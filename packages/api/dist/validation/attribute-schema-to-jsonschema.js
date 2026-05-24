"use strict";
/**
 * Translate a `ResourceType.attribute_schema` (DNA-flavored array of
 * attribute entries) into a strict JSON Schema fragment that `ajv` can
 * compile. v1 is essentially an identity transform — DNA's attribute
 * shape already mirrors JSON Schema closely. Future versions may layer
 * extensions (custom formats, conditional schemas) but the contract is
 * the same: in → JSON Schema, out → ajv-ready document.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeSchemaToJsonSchema = attributeSchemaToJsonSchema;
const naming_1 = require("../schema/naming");
/** Standard JSON Schema fragment per attribute type. */
function jsonSchemaForAttribute(attr) {
    switch (attr.type) {
        case 'string':
        case 'text':
            return { type: 'string' };
        case 'number':
            return { type: 'number' };
        case 'boolean':
            return { type: 'boolean' };
        case 'date':
            return { type: 'string', format: 'date' };
        case 'datetime':
            return { type: 'string', format: 'date-time' };
        case 'enum':
            return { type: 'string', enum: attr.values ?? [] };
        case 'reference':
            // Reference attributes are surfaced as scalar IDs (strings).
            return { type: 'string' };
        default:
            return {};
    }
}
/**
 * Convert a `ResourceType.attribute_schema` (and its name) into a complete
 * JSON Schema document of `type: 'object'` with `properties`, `required`,
 * and `additionalProperties: false`. Suitable for direct ajv compilation.
 *
 * The top-level `id` and `_schemaVersion` fields are NOT required by the
 * input contract — they're handled separately by the store. The schema
 * here covers only the user-facing `data` payload.
 */
function attributeSchemaToJsonSchema(schema, options = {}) {
    const properties = {};
    const required = [];
    for (const attr of schema) {
        if (typeof attr.name !== 'string' || attr.name.length === 0)
            continue;
        // `id` is managed by the store layer (hybrid ID assignment); skip it
        // so user input doesn't get rejected for omitting an id that the
        // adapter generates automatically.
        if (attr.name === 'id')
            continue;
        // Convert attribute names to camelCase to match the GraphQL field
        // names the user sends in via input.
        const fieldName = (0, naming_1.snakeToCamel)(attr.name);
        properties[fieldName] = jsonSchemaForAttribute(attr);
        if (typeof attr.description === 'string') {
            properties[fieldName].description = attr.description;
        }
        if (attr.required === true)
            required.push(fieldName);
    }
    return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
        additionalProperties: options.allowAdditional === true,
    };
}
//# sourceMappingURL=attribute-schema-to-jsonschema.js.map