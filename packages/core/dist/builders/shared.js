"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.stampBaseFields = stampBaseFields;
exports.composeInto = composeInto;
const node_crypto_1 = require("node:crypto");
const merge_1 = require("../merge");
const version_1 = require("../version");
const validator_1 = require("../validator");
/** Generates a UUID v4. Wrapped here so builder tests can stub identity. */
function generateId() {
    return (0, node_crypto_1.randomUUID)();
}
/**
 * Stamp the universal base contract (`id`, `type`, `version`) onto a
 * primitive when not already supplied. Caller values win; idempotent.
 */
function stampBaseFields(primitive, type) {
    const p = primitive;
    return {
        ...primitive,
        id: typeof p.id === 'string' ? p.id : generateId(),
        type: typeof p.type === 'string' ? p.type : type,
        version: typeof p.version === 'string' ? p.version : version_1.OPERATIONAL_PRIMITIVE_VERSIONS[type],
    };
}
let cachedValidator = null;
function validator() {
    if (cachedValidator === null)
        cachedValidator = new validator_1.DnaValidator();
    return cachedValidator;
}
const NOUN_COLLECTIONS = new Set(['resources', 'persons', 'roles', 'groups']);
/**
 * Compose a single primitive into a DNA. Used by every `add*` builder.
 *
 * - Validates the primitive against its JSON Schema by default.
 * - Wraps the primitive in a single-primitive DNA chunk that inherits the
 *   target DNA's `domain.name` (so `merge()` doesn't surface a spurious
 *   conflict on the domain name itself).
 * - Calls `merge([dna, wrapper])`. Identity-by-name + conflict reporting +
 *   cross-reference resolution all flow from `merge()`'s existing logic.
 * - Drops the provenance map — builders don't carry source info; `merge()`
 *   handles provenance for the multi-source case directly.
 */
/**
 * Map from builder collection name (plural) to the primitive type literal
 * stamped as `type` on each primitive. Derived from the schema id segment
 * for `operations`/`relationships`/etc.
 */
const COLLECTION_TO_TYPE = {
    resources: 'resource',
    persons: 'person',
    roles: 'role',
    groups: 'group',
    memberships: 'membership',
    operations: 'operation',
    triggers: 'trigger',
    rules: 'rule',
    tasks: 'task',
    processes: 'process',
    relationships: 'relationship',
};
function composeInto(dna, primitive, collection, schemaId, opts = {}) {
    const stamped = primitive && typeof primitive === 'object'
        ? stampBaseFields(primitive, COLLECTION_TO_TYPE[collection])
        : primitive;
    if (opts.validate !== false) {
        const result = validator().validate(stamped, schemaId);
        if (!result.valid) {
            const message = result.errors
                .map((e) => `${e.instancePath || '/'} ${e.message ?? '(no message)'}`)
                .join('; ');
            throw new Error(`dna-builders: ${schemaId} input failed validation: ${message}`);
        }
    }
    const domainName = dna.domain.name;
    const wrapper = NOUN_COLLECTIONS.has(collection)
        ? {
            domain: { name: domainName, [collection]: [stamped] },
        }
        : {
            domain: { name: domainName },
            [collection]: [stamped],
        };
    const result = (0, merge_1.merge)([dna, wrapper]);
    return { dna: result.dna, conflicts: result.conflicts };
}
//# sourceMappingURL=shared.js.map