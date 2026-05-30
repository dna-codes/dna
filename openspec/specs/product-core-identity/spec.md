# product-core-identity Specification

## Purpose
Defines the Product Core identity primitives — `User` and `Role` — that project the Operational `Person` and `Role` into the product layer and serve as the auth identity subject and RBAC role consumed by product/api auth middleware and product/ui permission guards. Both compose the shared stability base and are registered and surfaced in the `product.core` composite document.

## Requirements
### Requirement: Product Core defines a `User` primitive
Product Core SHALL define a `User` primitive at `product/core/user` (`$id: https://dna.codes/schemas/product/core/user`). `User` SHALL be the product-layer projection of the Operational `Person` AND the auth identity subject. It SHALL declare a PascalCase `name` (string, required), an optional `person` mapping field naming the Operational `Person` it projects (defaulting to `name` when omitted), optional `description`, optional `fields[]` (each a `product/core/field`), optional `actions[]` (each a `product/core/action`), and an optional `identity` object naming the field(s) that authenticate the subject (e.g. `{ "identifier": "email", "verified": true }`). It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal User validates
- **WHEN** a document `{ "name": "Member" }` is validated against `product/core/user`
- **THEN** validation SHALL pass and `person` SHALL be understood to default to `"Member"`

#### Scenario: User with identity and projected fields validates
- **WHEN** a `User` declares `person: "Customer"`, `identity: { "identifier": "email", "verified": true }`, and `fields: [{ "name": "email", "type": "email" }]`
- **THEN** validation SHALL pass

#### Scenario: User missing name fails validation
- **WHEN** a `User` document omits `name`
- **THEN** validation SHALL fail with an error indicating `name` is required

### Requirement: Product Core defines a `Role` primitive
Product Core SHALL define a `Role` primitive at `product/core/role` (`$id: https://dna.codes/schemas/product/core/role`). `Role` SHALL be the product-layer projection of the Operational `Role` AND the RBAC role used by product/api auth middleware and product/ui permission guards. It SHALL declare a PascalCase `name` (string, required), an optional `role` mapping field naming the Operational `Role` it projects (defaulting to `name` when omitted), optional `description`, an optional `scope` (string, mirroring the Operational Role scope), and an optional `permissions[]` listing the Product Core operation/action references the role may perform. `permissions[]` SHALL be a derived rollup materialized from the Operational access `Rules` that name the role — a denormalized convenience, not an authored source of truth — and the schema description SHALL state this. It SHALL compose the shared stability base so it MAY declare `stability`.

#### Scenario: Minimal Role validates
- **WHEN** a document `{ "name": "Underwriter" }` is validated against `product/core/role`
- **THEN** validation SHALL pass and `role` SHALL be understood to default to `"Underwriter"`

#### Scenario: Role with scope and permissions validates
- **WHEN** a `Role` declares `role: "Underwriter"`, `scope: "BankDepartment"`, and `permissions: ["Loan.Approve"]`
- **THEN** validation SHALL pass

#### Scenario: Role missing name fails validation
- **WHEN** a `Role` document omits `name`
- **THEN** validation SHALL fail with an error indicating `name` is required

### Requirement: `User` and `Role` are registered and surfaced in the composite document
`@dna-codes/dna-core` SHALL register `product/core/user` and `product/core/role` so they appear in `availableSchemas()` and resolve cross-schema `$ref`s. The `product.core.json` composite schema SHALL accept optional top-level `users[]` and `roles[]` arrays whose items reference `product/core/user` and `product/core/role` respectively. Existing `product.core` documents without these arrays SHALL remain valid.

#### Scenario: New primitives are available
- **WHEN** `availableSchemas()` is read
- **THEN** it SHALL contain `product/core/user` and `product/core/role`

#### Scenario: Composite product core document with users and roles validates
- **WHEN** a `product/core` document includes a valid `users[]` and `roles[]` alongside `domain` and `resources`
- **THEN** validation SHALL pass

#### Scenario: Existing product core document without users or roles still validates
- **WHEN** a `product/core` document containing only `domain` and `resources` is validated
- **THEN** validation SHALL pass
