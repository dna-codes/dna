## 1. Shared stability base

- [x] 1.1 Create `packages/schemas/meta/stability.json` (`$id: https://dna.codes/schemas/meta/stability`) — object with optional `stability` (enum `experimental|beta|stable|deprecated`) and optional `description`; no `additionalProperties`/`unevaluatedProperties` lock
- [x] 1.2 Refactor `packages/schemas/operational/base.json` to remove the inline `stability` definition and compose `meta/stability` via `allOf` (keep `id`/`type`/`name`/`version` required)
- [x] 1.3 Add `{ "$ref": ".../meta/stability" }` to the `allOf` of every Product (core/api/ui) and Technical per-primitive schema so they can carry `stability`
- [x] 1.4 Register `meta/stability` in `packages/core/src/index.ts` schema map (alongside `operational/base`) so Ajv resolves the `$ref` and it appears in `availableSchemas()`

## 2. Product Core `User` and `Role`

- [x] 2.1 Create `packages/schemas/product/core/user.json` — `name` (required), `person` (mapping, defaults to `name`), `description`, `fields[]` (`$ref product/core/field`), `actions[]` (`$ref product/core/action`), optional `identity` object; compose `meta/stability`
- [x] 2.2 Create `packages/schemas/product/core/role.json` — `name` (required), `role` (mapping, defaults to `name`), `description`, optional `scope`, optional `permissions[]`; compose `meta/stability`
- [x] 2.3 Register `product/core/user` and `product/core/role` in `packages/core/src/index.ts` (`schemas.product.core`)
- [x] 2.4 Add optional top-level `users[]` and `roles[]` arrays to `packages/schemas/product/product.core.json`, referencing the two new schemas; keep them optional

## 3. Declare Field experimental

- [x] 3.1 In `packages/schemas/product/core/field.json`, re-declare the `stability` property with `"default": "experimental"`

## 4. Tests

- [x] 4.1 Flip `packages/core/src/validator.test.ts` guard `expect(schemas).not.toContain('product/core/role')`; add positive assertions for `product/core/user`, `product/core/role`, and `meta/stability`
- [x] 4.2 Update `packages/core/src/index.test.ts`: `schemas.product.core` keys → `['action','field','operation','resource','role','user']`; bump the "37 primitives" count comment
- [x] 4.3 Add validator tests for `product/core/user` and `product/core/role` (minimal + full docs; missing `name` rejected)
- [x] 4.4 Add validator tests: `stability` accepted on a Product Core and a Technical primitive; invalid `stability` rejected at those layers; Field `stability` default is `experimental`
- [x] 4.5 Confirm existing `primitive-base-contract` stability scenarios still pass (operational `unevaluatedProperties` regression guard) and that a `product/core` composite doc with `users[]`/`roles[]` validates

## 5. Docs and release

- [x] 5.1 Update `README.md` Product Layer section: list `User`/`Role`, resolve the Person→User / Role→Role projection note, add a short shared-stability note
- [x] 5.2 Update any `docs/concepts/` that enumerate Product Core primitives
- [x] 5.3 Bump `@dna-codes/dna-schemas` and `@dna-codes/dna-core` minor versions; run the full test suite green
