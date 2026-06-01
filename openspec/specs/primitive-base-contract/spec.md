# primitive-base-contract Specification

## Purpose
Defines the universal base contract (`id`, `type`, `name`, `version`, `description`) shared by every Operational DNA primitive. The base contract enables uniform storage across data stores (Neo4j, Postgres, document stores), stable UUID-based addressing, and per-primitive schema version tracking. Enforced at the JSON Schema level via `allOf` composition in every per-primitive schema, with `unevaluatedProperties: false` so base fields aren't rejected as "additional."
## Requirements
### Requirement: Every Operational primitive carries a universal base contract
Every Operational DNA primitive (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process, Relationship) SHALL include the following base-level fields: `id` (UUID v4 string), `type` (primitive discriminator string), `name` (string), `version` (semver string). The `description` field SHALL be optional at the base level. These fields SHALL be declared in a shared `base.json` JSON Schema that all per-primitive schemas extend via `allOf`.

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

### Requirement: Base contract permits an optional `stability` declaration
The optional `stability` field SHALL be declared in the shared `meta/stability` base (not inline in `operational/base.json`), and `operational/base.json` SHALL compose `meta/stability` via `allOf`. Its value, when present, SHALL be one of `experimental`, `beta`, `stable`, or `deprecated`. The field SHALL be optional so that existing DNA documents validate unchanged. Because `stability` is contributed through the composed base, its presence on a primitive SHALL NOT trigger an `unevaluatedProperties` rejection, including on Operational primitives that set `unevaluatedProperties: false`.

#### Scenario: Primitive without stability still validates
- **WHEN** an Operational primitive document with no `stability` field is validated against its schema
- **THEN** validation SHALL pass

#### Scenario: Primitive with a valid stability validates
- **WHEN** an Operational primitive declares `stability: "beta"`
- **THEN** validation SHALL pass and `stability` SHALL NOT be rejected as an unevaluated property

#### Scenario: Primitive with an invalid stability fails validation
- **WHEN** an Operational primitive declares `stability: "ga"` (not one of the four allowed values)
- **THEN** validation SHALL fail with an error on `stability`

### Requirement: Declared stability flows into registry seeding
When a DNA document is loaded into the registry, an authored definition's declared `stability` SHALL be used as the seeded type's stability. This applies to every primitive kind that seeds a registry type, including noun definitions (which seed `ResourceType` records) and `relationship` definitions (which seed `RelationshipType` records). When a definition omits `stability`, the registry's seeding defaults SHALL apply.

#### Scenario: Authored stability is carried into the seeded resource type
- **WHEN** a DNA document declares a Resource with `stability: "beta"` and the registry seeds from that document
- **THEN** the seeded resource type SHALL have `stability: beta`

#### Scenario: Authored stability is carried into the seeded relationship type
- **WHEN** a DNA document declares a relationship with `stability: "beta"` and the registry seeds from that document
- **THEN** the seeded relationship type SHALL have `stability: beta`

### Requirement: A shared stability base is composable by every primitive in every layer
There SHALL be a single shared stability base schema at `meta/stability` (`$id: https://dna.codes/schemas/meta/stability`) declaring two optional properties — `stability` (one of `experimental`, `beta`, `stable`, or `deprecated`) and `description` (string) — and locking neither `additionalProperties` nor `unevaluatedProperties` (it is a pure mixin). Every per-primitive schema across Operational, Product (core/api/ui), and Technical SHALL compose this base via `allOf`. The enum SHALL NOT be redefined per layer; it SHALL have this one source of truth, aligned with the `STABILITIES` constant in `@dna-codes/dna-core`. The shared base SHALL be registered so cross-schema `$ref`s resolve and it appears in `availableSchemas()`.

#### Scenario: A Product Core primitive may declare stability
- **WHEN** a `product/core/field` document declares `stability: "experimental"`
- **THEN** validation SHALL pass and `stability` SHALL NOT be rejected as an unknown property

#### Scenario: A Technical primitive may declare stability
- **WHEN** a Technical primitive document declares `stability: "beta"`
- **THEN** validation SHALL pass

#### Scenario: An invalid stability value is rejected at any layer
- **WHEN** any primitive declares `stability: "ga"` (not one of the four allowed values)
- **THEN** validation SHALL fail with an error on `stability`

#### Scenario: The shared base is registered
- **WHEN** `availableSchemas()` is read
- **THEN** it SHALL contain `meta/stability`

### Requirement: A primitive type declares its own maturity via a schema default
A primitive type MAY declare its settled maturity by giving its `stability` property a JSON Schema `default`. When a primitive's authored document omits `stability`, consumers SHALL treat the schema `default` (when present) as the declared maturity. The Product Core `Field` primitive SHALL declare `stability` with a `default` of `experimental`.

#### Scenario: Field declares experimental maturity by default
- **WHEN** the `product/core/field` schema is inspected
- **THEN** its `stability` property SHALL have `default: "experimental"`

#### Scenario: A primitive without a declared default is unaffected
- **WHEN** a primitive whose schema sets no `stability` default is authored without `stability`
- **THEN** no maturity default SHALL be implied by the schema and the consumer's own default applies

### Requirement: The metamodel has two parallel base contracts — one for type schemas, one for lens definitions
The DNA metamodel SHALL maintain two parallel base schema contracts: the resource type base (shared via `meta/stability` composition in `packages/schemas/`) governing ResourceType and RelationshipType definitions, and the LensType base (`packages/core/lenses/base.json`) governing lens definitions. Both SHALL follow the same pattern: a shared base schema composed via `allOf` by all members of that concept family, with no `additionalProperties`/`unevaluatedProperties` locking (pure mixin). Neither base contract SHALL be collapsed into the other — they are peers.

#### Scenario: Resource type schemas compose meta/stability, not the lens base
- **WHEN** any resource type schema (operational, product, or technical) is read
- **THEN** it SHALL compose `https://dna.codes/schemas/meta/stability` and SHALL NOT reference `https://dna.codes/lenses/base`

#### Scenario: Lens definitions compose the lens base, not meta/stability
- **WHEN** any core lens definition is read
- **THEN** it SHALL compose `https://dna.codes/lenses/base` and SHALL NOT reference `https://dna.codes/schemas/meta/stability`

#### Scenario: Both base schemas are independently registered
- **WHEN** `availableSchemas()` is called
- **THEN** it SHALL contain `meta/stability`
- **WHEN** `allLenses()` is called
- **THEN** the base lens definition SHALL be accessible via `https://dna.codes/lenses/base`

