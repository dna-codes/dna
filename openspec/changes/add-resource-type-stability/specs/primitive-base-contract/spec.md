## ADDED Requirements

### Requirement: Base contract permits an optional `stability` declaration
The shared `base.json` JSON Schema SHALL declare an optional `stability` field whose value, when present, SHALL be one of `experimental`, `beta`, `stable`, or `deprecated`. The field SHALL be optional so that existing DNA documents validate unchanged. Because `stability` is now a declared base field, its presence on a primitive SHALL NOT trigger an `unevaluatedProperties` rejection.

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
