"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATIONAL_PRIMITIVE_VERSIONS = void 0;
/**
 * Per-type schema version constants for Operational primitives. Builders
 * stamp `version` from this table when callers don't supply one. Kept in
 * sync with `@dna-codes/dna-schemas`'s `operational/versions.json` — when a
 * primitive type's schema field shape changes, bump the entry here AND in
 * the schemas manifest, AND bump `@dna-codes/dna-schemas` (minor for
 * additive, major for breaking).
 */
exports.OPERATIONAL_PRIMITIVE_VERSIONS = {
    resource: '1',
    person: '1',
    position: '1',
    group: '1',
    membership: '1',
    operation: '1',
    trigger: '1',
    rule: '1',
    task: '1',
    process: '1',
    relationship: '1',
};
//# sourceMappingURL=version.js.map