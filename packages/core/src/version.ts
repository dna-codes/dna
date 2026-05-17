/**
 * Per-type schema version constants for Operational primitives. Builders
 * stamp `version` from this table when callers don't supply one. Kept in
 * sync with `@dna-codes/dna-schemas`'s `operational/versions.json` — when a
 * primitive type's schema field shape changes, bump the entry here AND in
 * the schemas manifest, AND bump `@dna-codes/dna-schemas` (minor for
 * additive, major for breaking).
 */
export const OPERATIONAL_PRIMITIVE_VERSIONS = {
  resource: '1',
  person: '1',
  role: '1',
  group: '1',
  membership: '1',
  operation: '1',
  trigger: '1',
  rule: '1',
  task: '1',
  process: '1',
  relationship: '1',
} as const

export type OperationalPrimitiveType = keyof typeof OPERATIONAL_PRIMITIVE_VERSIONS
