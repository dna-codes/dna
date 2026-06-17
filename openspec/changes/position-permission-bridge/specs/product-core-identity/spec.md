## MODIFIED Requirements

### Requirement: Product Core defines a `Role` primitive
Product Core SHALL define a `Role` primitive at `product/core/role` (`$id: https://dna.codes/schemas/product/core/role`). `Role` SHALL be the product-layer projection of the Operational `Position` AND the RBAC role used by product/api auth middleware and product/ui permission guards. It SHALL declare a PascalCase `name` (string, required), an optional `position` mapping field naming the Operational `Position` it projects (defaulting to `name` when omitted), and optional `description`. `Role` SHALL NOT declare an inline `scope` string field — authorization scope is expressed via the `Scope` primitive referenced by `Permission`. `Role` SHALL NOT carry an authored `permissions[]` rollup as a source of truth — per-scope authorization is expressed as `Permission` nodes (`user + role + scope`); any retained `permissions[]` field is a non-normative denormalized convenience only. It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal Role validates
- **WHEN** a document `{ "name": "Underwriter" }` is validated against `product/core/role`
- **THEN** validation SHALL pass and `position` SHALL be understood to default to `"Underwriter"`

#### Scenario: Role projects an operational Position
- **WHEN** a `Role` declares `position: "Underwriter"`
- **THEN** validation SHALL pass and the role projects the operational Position `Underwriter`

#### Scenario: Inline scope on Role is rejected
- **WHEN** a `Role` declares an inline `scope` string
- **THEN** validation SHALL fail or the field SHALL be ignored, with scope expressed via `Scope`/`Permission` instead

#### Scenario: Role missing name fails validation
- **WHEN** a `Role` document omits `name`
- **THEN** validation SHALL fail with an error indicating `name` is required

### Requirement: `User` and `Role` are registered and surfaced in the composite document
`@dna-codes/dna-core` SHALL register `product/core/user`, `product/core/role`, and `product/core/permission` so they appear in `availableSchemas()` and resolve cross-schema `$ref`s. There SHALL be no `product/core/scope` schema — a Permission's scope is a namespaced entity reference, not a registered type. The `product.core.json` composite schema SHALL accept optional top-level `users[]`, `roles[]`, and `permissions[]` arrays referencing those schemas respectively. Existing `product.core` documents without these arrays SHALL remain valid.

#### Scenario: New primitives are available
- **WHEN** `availableSchemas()` is read
- **THEN** it SHALL contain `product/core/user`, `product/core/role`, and `product/core/permission`, and SHALL NOT contain `product/core/scope`

#### Scenario: Composite product core document with permissions validates
- **WHEN** a `product/core` document includes a valid `permissions[]` alongside `domain` and `resources`
- **THEN** validation SHALL pass

#### Scenario: Existing product core document without the new arrays still validates
- **WHEN** a `product/core` document containing only `domain` and `resources` is validated
- **THEN** validation SHALL pass
