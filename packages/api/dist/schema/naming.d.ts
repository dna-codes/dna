/**
 * Naming conventions for DNA → GraphQL codegen.
 *
 * Centralized so every codegen module agrees: snake_case attribute names
 * become camelCase fields; PascalCase noun-primitive names pass through;
 * enum values become UPPER_SNAKE_CASE; CRUD mutations and Operation
 * mutations follow the design.md D8 table.
 */
/** Convert `snake_case_name` to `camelCaseName`. Idempotent for already-camel names. */
export declare function snakeToCamel(name: string): string;
/** Convert an arbitrary enum value to GraphQL `UPPER_SNAKE_CASE`. Strips invalid chars. */
export declare function toEnumValue(value: string): string;
/**
 * Lower-case the first character (so PascalCase becomes camelCase).
 * Used to derive a CRUD query name from a Resource name: `Loan` → `loan`.
 */
export declare function pascalToCamel(name: string): string;
export declare function pluralize(name: string): string;
/**
 * Strip a trailing `_id` (or `Id` / `ID`) suffix from a name, then
 * camelCase it. Used to derive a relationship field name from the
 * `Relationship.attribute` field (e.g. `borrower_id` → `borrower`).
 */
export declare function stripIdSuffix(attribute: string): string;
/**
 * Derive an Operation mutation name from a DNA Operation's `target` and
 * `action` (PascalCase Resource + PascalCase verb → camelCase mutation).
 * Example: `target: "Loan"`, `action: "Apply"` → `loanApply`.
 */
export declare function operationMutationName(target: string, action: string): string;
//# sourceMappingURL=naming.d.ts.map