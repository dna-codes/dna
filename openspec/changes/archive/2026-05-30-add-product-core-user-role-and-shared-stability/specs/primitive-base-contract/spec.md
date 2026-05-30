## ADDED Requirements

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

## MODIFIED Requirements

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
