## ADDED Requirements

### Requirement: Every Operational primitive carries a universal base contract
Every Operational DNA primitive (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process, Relationship) SHALL include the following base-level fields: `id` (UUID v4 string), `type` (primitive discriminator string), `name` (string), `version` (semver string). The `description` field SHALL be optional at the base level. These fields SHALL be declared in a shared `base-primitive.json` JSON Schema that all per-primitive schemas extend via `allOf`.

#### Scenario: Primitive has all required base fields
- **WHEN** a primitive document is validated against its schema
- **THEN** validation SHALL pass when `id`, `type`, `name`, and `version` are all present

#### Scenario: Primitive missing a required base field fails validation
- **WHEN** a primitive document is validated against its schema with `id` absent
- **THEN** validation SHALL fail with an error indicating `id` is required

#### Scenario: Primitive with unknown fields is rejected
- **WHEN** a primitive document contains a field not declared in the base or per-primitive schema
- **THEN** validation SHALL fail with an `unevaluatedProperties` error

### Requirement: `id` is a UUID v4 string
The `id` field SHALL be a string conforming to UUID v4 format. It SHALL be unique per primitive within a DNA document. It SHALL be stable — once assigned, it MUST NOT change when the primitive is updated.

#### Scenario: Valid UUID v4 passes format validation
- **WHEN** `id` is a well-formed UUID v4 string (e.g. `"550e8400-e29b-41d4-a716-446655440000"`)
- **THEN** validation SHALL pass

#### Scenario: Non-UUID string fails format validation
- **WHEN** `id` is an arbitrary string that is not UUID-formatted
- **THEN** validation SHALL fail with a format error on `id`

### Requirement: `type` is the lowercase primitive discriminator
The `type` field SHALL be a string constrained by each per-primitive schema to a single allowed value: `resource`, `person`, `role`, `group`, `membership`, `operation`, `trigger`, `rule`, `task`, `process`, or `relationship`. It SHALL allow consumers to determine the primitive kind without inspecting the surrounding collection.

#### Scenario: Resource primitive has type "resource"
- **WHEN** a Resource document is validated
- **THEN** `type` SHALL equal `"resource"` or validation fails

#### Scenario: Wrong type value fails validation
- **WHEN** a Resource document has `type: "operation"`
- **THEN** validation SHALL fail

### Requirement: `version` identifies the primitive type's schema version
The `version` field SHALL be a string identifying which version of this primitive type's schema was in effect when the primitive was authored (e.g., `"1"`, `"2"`). It SHALL allow migration scripts to find nodes that need transformation when a type's field shape changes. It is a migration enabler — it does not provide transparent cross-version query compatibility.

#### Scenario: Primitive carries version
- **WHEN** a primitive is built using the builder API
- **THEN** the returned primitive SHALL have `version` set to the current Operational schema version constant

#### Scenario: Primitives from different schema versions can coexist
- **WHEN** two primitives with different `version` values are merged into one DNA document
- **THEN** the merge SHALL succeed and each primitive SHALL retain its original `version`

### Requirement: Builders auto-assign base fields when not supplied
The `add*` builder functions in `@dna-codes/dna-core` SHALL automatically assign `id` (UUID v4), `type` (hardcoded per builder), and `version` (current schema version constant) to any primitive that does not already carry those fields. Callers who supply their own `id` SHALL have it preserved.

#### Scenario: Builder assigns id when absent
- **WHEN** `addResource(dna, { name: "Loan" })` is called without an `id` field
- **THEN** the returned primitive SHALL have a valid UUID v4 `id` assigned

#### Scenario: Builder preserves caller-supplied id
- **WHEN** `addResource(dna, { id: "my-uuid", name: "Loan" })` is called with an explicit `id`
- **THEN** the returned primitive SHALL have `id` equal to `"my-uuid"`

#### Scenario: Builder stamps correct type
- **WHEN** `addOperation(dna, { name: "Loan.Approve", target: "Loan", action: "Approve" })` is called
- **THEN** the returned primitive SHALL have `type` equal to `"operation"`

### Requirement: TypeScript types reflect the base contract
All per-primitive TypeScript interfaces in `@dna-codes/dna-core` SHALL extend a `BasePrimitive` interface that declares `id`, `type`, `name`, and `version` as required string fields and `description` as an optional string. Each per-primitive interface SHALL narrow `type` to its specific literal string.

#### Scenario: Resource type has required base fields
- **WHEN** a TypeScript value is typed as `Resource`
- **THEN** accessing `.id`, `.type`, `.name`, `.version` SHALL not produce a type error

#### Scenario: Assigning wrong type literal fails at compile time
- **WHEN** a value typed as `Resource` has `type` set to `"operation"` at compile time
- **THEN** the TypeScript compiler SHALL emit a type error
