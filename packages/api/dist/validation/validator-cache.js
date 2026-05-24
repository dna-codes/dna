"use strict";
/**
 * Compiled-ajv-validator cache keyed by `(resourceTypeId, version)`.
 *
 * Validation runs on every `create<Type>` and `update<Type>` mutation;
 * compiling ajv on every call would be wasteful. The cache compiles
 * once per (type, version) pair and reuses the validator. Updates to a
 * `ResourceType` bump the version so the new schema gets a fresh cache
 * entry on the first write.
 *
 * Memory grows with the number of distinct (type, version) pairs ever
 * touched — bounded in practice by tenant size. An LRU bound is left
 * for a follow-on if a benchmark says it matters.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorCache = void 0;
exports.formatAjvErrors = formatAjvErrors;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const attribute_schema_to_jsonschema_1 = require("./attribute-schema-to-jsonschema");
class ValidatorCache {
    constructor() {
        this.byTypeId = new Map();
        this.ajv = new ajv_1.default({ allErrors: true, strict: false });
        (0, ajv_formats_1.default)(this.ajv);
    }
    /**
     * Compile (or return cached) a validator for `(typeId, version)` against
     * the supplied schema. If a newer version is supplied for the same
     * typeId, the previous entry is replaced.
     */
    getOrCompile(typeId, version, schema) {
        const existing = this.byTypeId.get(typeId);
        if (existing && existing.version === version)
            return existing.validate;
        const jsonSchema = (0, attribute_schema_to_jsonschema_1.attributeSchemaToJsonSchema)(schema);
        const validate = this.ajv.compile(jsonSchema);
        this.byTypeId.set(typeId, { version, validate });
        return validate;
    }
    /** Drop any cached entry for a typeId — used when a ResourceType is deleted. */
    invalidate(typeId) {
        this.byTypeId.delete(typeId);
    }
    /** Drop all cached entries. */
    clear() {
        this.byTypeId.clear();
    }
}
exports.ValidatorCache = ValidatorCache;
/**
 * Convert ajv errors into a single human-readable string suitable for
 * surfacing as a GraphQL error message.
 */
function formatAjvErrors(validate) {
    const errors = validate.errors ?? [];
    if (errors.length === 0)
        return 'Validation failed.';
    return errors
        .map((e) => `  - ${e.instancePath || '/'}: ${e.message ?? 'invalid'}`)
        .join('\n');
}
//# sourceMappingURL=validator-cache.js.map