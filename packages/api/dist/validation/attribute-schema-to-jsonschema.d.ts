/**
 * Translate a `ResourceType.attribute_schema` (DNA-flavored array of
 * attribute entries) into a strict JSON Schema fragment that `ajv` can
 * compile. v1 is essentially an identity transform — DNA's attribute
 * shape already mirrors JSON Schema closely. Future versions may layer
 * extensions (custom formats, conditional schemas) but the contract is
 * the same: in → JSON Schema, out → ajv-ready document.
 */
import type { AttributeSchema } from '@dna-codes/dna-core';
/**
 * Convert a `ResourceType.attribute_schema` (and its name) into a complete
 * JSON Schema document of `type: 'object'` with `properties`, `required`,
 * and `additionalProperties: false`. Suitable for direct ajv compilation.
 *
 * The top-level `id` and `_schemaVersion` fields are NOT required by the
 * input contract — they're handled separately by the store. The schema
 * here covers only the user-facing `data` payload.
 */
export declare function attributeSchemaToJsonSchema(schema: AttributeSchema, options?: {
    allowAdditional?: boolean;
}): Record<string, unknown>;
//# sourceMappingURL=attribute-schema-to-jsonschema.d.ts.map