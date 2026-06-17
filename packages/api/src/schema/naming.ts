/**
 * Naming conventions for DNA → GraphQL codegen.
 *
 * Centralized so every codegen module agrees: snake_case attribute names
 * become camelCase fields; PascalCase noun-primitive names pass through;
 * enum values become UPPER_SNAKE_CASE; CRUD mutations and Operation
 * mutations follow the design.md D8 table.
 */

/** Convert `snake_case_name` to `camelCaseName`. Idempotent for already-camel names. */
export function snakeToCamel(name: string): string {
  return name.replace(/_([a-zA-Z0-9])/g, (_, ch: string) => ch.toUpperCase())
}

/** Convert an arbitrary enum value to GraphQL `UPPER_SNAKE_CASE`. Strips invalid chars. */
export function toEnumValue(value: string): string {
  // GraphQL enum values must match /^[_A-Za-z][_0-9A-Za-z]*$/.
  // - snake_case → UPPER_SNAKE_CASE
  // - camelCase → split on case boundaries
  // - kebab-case, spaces → underscores
  const normalized = String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase → camel_Case
    .replace(/[-\s]+/g, '_') // kebab / spaces → underscore
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
  if (!normalized) return ''
  // GraphQL enum values cannot start with a digit.
  if (/^\d/.test(normalized)) return `_${normalized}`
  return normalized
}

/**
 * Lower-case the first character (so PascalCase becomes camelCase).
 * Used to derive a CRUD query name from a Resource name: `Loan` → `loan`.
 */
export function pascalToCamel(name: string): string {
  if (!name) return name
  return name.charAt(0).toLowerCase() + name.slice(1)
}

/**
 * Naive pluralization with overrides. The DNA's top-level `dna.persons[]`
 * collection name implies `Person` → `persons` (not `peoples`); the same
 * convention applies to GraphQL list-query naming.
 */
const PLURAL_OVERRIDES: Record<string, string> = {
  Person: 'persons',
}

export function pluralize(name: string): string {
  const override = PLURAL_OVERRIDES[name]
  if (override) return override
  // Naive: add `s`. Caller is expected to add to PLURAL_OVERRIDES for irregulars.
  return `${pascalToCamel(name)}s`
}

/**
 * Strip a trailing `_id` (or `Id` / `ID`) suffix from a name, then
 * camelCase it. Used to derive a relationship field name from the
 * `Relationship.attribute` field (e.g. `borrower_id` → `borrower`).
 */
export function stripIdSuffix(attribute: string): string {
  const camel = snakeToCamel(attribute)
  // Drop a trailing "Id" / "ID" (post-camelCase).
  const stripped = camel.replace(/I[dD]$/, '')
  return stripped || camel
}

/**
 * Derive an Operation mutation name from a DNA Operation's `target` and
 * `action` (PascalCase Resource + PascalCase verb → camelCase mutation).
 * Example: `target: "Loan"`, `action: "Apply"` → `loanApply`.
 */
export function operationMutationName(target: string, action: string): string {
  return pascalToCamel(`${target}${action}`)
}
