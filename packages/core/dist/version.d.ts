/**
 * Per-type schema version constants for Operational primitives. Builders
 * stamp `version` from this table when callers don't supply one. Kept in
 * sync with `@dna-codes/dna-schemas`'s `operational/versions.json` — when a
 * primitive type's schema field shape changes, bump the entry here AND in
 * the schemas manifest, AND bump `@dna-codes/dna-schemas` (minor for
 * additive, major for breaking).
 */
export declare const OPERATIONAL_PRIMITIVE_VERSIONS: {
    readonly resource: "1";
    readonly person: "1";
    readonly role: "1";
    readonly group: "1";
    readonly membership: "1";
    readonly operation: "1";
    readonly trigger: "1";
    readonly rule: "1";
    readonly task: "1";
    readonly process: "1";
    readonly relationship: "1";
};
export type OperationalPrimitiveType = keyof typeof OPERATIONAL_PRIMITIVE_VERSIONS;
//# sourceMappingURL=version.d.ts.map