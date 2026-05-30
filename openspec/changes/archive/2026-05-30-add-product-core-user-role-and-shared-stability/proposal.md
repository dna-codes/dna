## Why

The README flags an open question: how Operational People primitives (Person, Role, Group, Membership) project into Product Core. Today Product Core has only `Resource`, `Action`, `Operation`, and `Field` — there is no first-class way to surface the identity subject (a logged-in user) or the RBAC role that product/api auth middleware and product/ui permission guards already need. Separately, the `stability` maturity marker only exists on Operational `base.json`; the leaner Product and Technical primitives cannot declare maturity, so there is no way to mark a young primitive like Product Core `Field` as `experimental`.

## What Changes

- Add two new Product Core primitives, **`User`** and **`Role`**, to the Core group:
  - `User` is the product-layer projection of the Operational `Person` (a `person` mapping field defaulting to `name`) **and** the identity/login subject for auth.
  - `Role` is the product-layer projection of the Operational `Role` (a `role` mapping field defaulting to `name`) **and** the RBAC role for permission guards.
  - Both register as `product/core/user` and `product/core/role`, surface as `users[]` / `roles[]` top-level arrays in `product.core.json`, and are loaded in `@dna-codes/dna-core`.
- Introduce a **minimal shared stability base** — a small schema declaring just `stability` (enum `experimental | beta | stable | deprecated`) and `description` — referenced via `allOf` by **every** primitive across Operational, Product (core/api/ui), and Technical. Operational `base.json` composes this shared contract instead of redefining the enum. No `id`/`type`/`name`/`version` is forced onto the leaner Product/Technical primitives.
- Declare the Product Core **`Field`** primitive `stability: experimental`.
- **BREAKING (schema surface only):** `product.core.json` gains `users[]` / `roles[]`; the registration guard test asserting `product/core/role` is absent is flipped. No change to existing Operational document validity.

## Capabilities

### New Capabilities
- `product-core-identity`: Product Core `User` and `Role` primitives — dual-faceted as projections of Operational `Person`/`Role` and as the auth identity subject / RBAC role; their registration in `@dna-codes/dna-core` and inclusion in the `product.core.json` composite document.

### Modified Capabilities
- `primitive-base-contract`: the optional `stability` declaration is lifted out of Operational `base.json` into a shared cross-layer base referenced by every primitive (Operational, Product core/api/ui, Technical), so any primitive — including the new Product Core ones and `Field` — can declare maturity. Product Core `Field` is declared `experimental`.

## Impact

- **Schemas** (`@dna-codes/dna-schemas`): new `product/core/user.json`, `product/core/role.json`; new shared stability base schema (e.g. `meta/stability.json`); `operational/base.json` refactored to compose it; `product/core/field.json` declares `experimental`; `product.core.json` gains `users[]`/`roles[]`. Minor version bump.
- **Core** (`@dna-codes/dna-core`): `index.ts` schema map registers the two new primitives and the shared base; `availableSchemas`/registration tests updated (including flipping the `product/core/role` guard); validator tests for the new primitives and for cross-layer stability. Minor version bump.
- **Docs**: README Product Layer section (resolve the People→Product-Core open question, list the new primitives), and any affected `docs/concepts/`.
- No runtime/data-store or dna-api seeding behavior change — the shared base only widens where `stability` may be authored; registry seeding semantics are unchanged.
