## Context

Product Core (`product.core.json` + `packages/schemas/product/core/*.json`) currently defines four primitives: `Resource`, `Action`, `Operation`, `Field`. Unlike Operational primitives — which all compose `operational/base.json` via `allOf` and use `unevaluatedProperties: false` — the Product and Technical primitives are deliberately leaner: no `id`/`type`/`name`/`version`, no base composition.

Two gaps motivate this change:
1. People do not project into Product Core. The README names this open. Auth middleware (product/api) and permission guards (product/ui) need a product-level identity subject and RBAC role, but there is nowhere to declare them.
2. The `stability` maturity marker (`experimental | beta | stable | deprecated`) is declared only inside `operational/base.json` (see the `primitive-base-contract` spec, "Base contract permits an optional `stability` declaration"). Product/Technical primitives — and the new Product Core ones — cannot carry it, so a young primitive like `Field` cannot be marked `experimental`.

Constraints: schemas are JSON Schema Draft 2020-12, zero-dependency, registered in `@dna-codes/dna-core/src/index.ts` and added to a shared Ajv instance so cross-schema `$ref`s resolve. `STABILITIES` in `@dna-codes/dna-core` is the canonical enum and the dna-api GraphQL `Stability` enum derives from it — the shared base must not fork that list.

## Goals / Non-Goals

**Goals:**
- Add `User` and `Role` as Product Core primitives that are simultaneously (a) projections of Operational `Person`/`Role` and (b) the auth identity subject / RBAC role.
- Provide one canonical, minimal home for the `stability` marker that every primitive in every layer can compose, without forcing the heavier base fields (`id`/`type`/`name`/`version`) onto Product/Technical primitives.
- Declare Product Core `Field` as `experimental`.
- Keep all existing documents valid (the marker stays optional; new arrays are optional).

**Non-Goals:**
- Projecting `Group` and `Membership` into Product Core (only `Person→User` and `Role→Role` are in scope).
- Changing dna-api registry seeding semantics or the runtime data stores. The shared base only widens *where* `stability` may be authored; foundational-vs-experimental seeding defaults are unchanged.
- Enforcing RBAC/auth at runtime. The auth facet is descriptive schema, not a policy engine.
- Adding `id`/`version` tracking to Product Core primitives.

## Decisions

### D1 — A minimal shared stability base, composed by every primitive
Create `packages/schemas/meta/stability.json` (`$id: https://dna.codes/schemas/meta/stability`): an object schema declaring two optional properties — `stability` (string enum of the four values) and `description` (string) — and nothing else (no `additionalProperties`/`unevaluatedProperties` lock; it is a pure mixin). Every per-primitive schema across Operational, Product (core/api/ui), and Technical adds `{ "$ref": "https://dna.codes/schemas/meta/stability" }` to its `allOf`.

`operational/base.json` *composes* the shared base rather than redefining the enum inline: it keeps requiring `id`/`type`/`name`/`version` but moves the `stability`/`description` definitions into `meta/stability.json` and references it. This gives a single source of truth aligned with core's `STABILITIES`.

- *Alternative — duplicate the `stability` enum in each layer's own base:* rejected; three+ copies of the enum drift from `STABILITIES`.
- *Alternative — give Product/Technical the full operational base:* rejected; it forces `id`/`type`/`name`/`version` onto leaner primitives, a much larger and unwanted change.
- *Why a new `meta/` family rather than reusing `operational/`:* the contract is layer-agnostic; filing it under `operational/` would wrongly imply operational ownership and create an odd cross-family `$ref` from technical/product into operational.

### D2 — `unevaluatedProperties` stays correct via the allOf chain
Operational primitives use `unevaluatedProperties: false`. They compose `operational/base`, which now composes `meta/stability` via `allOf`. In Draft 2020-12, properties evaluated by transitively-nested `allOf`/`$ref` subschemas are counted as evaluated, so `stability`/`description` on an operational primitive are NOT rejected as unevaluated. The existing `primitive-base-contract` scenarios ("unknown field rejected", "stability accepted") must continue to pass — they become regression guards for this refactor. Product Core/API/UI/Technical primitives do not set `unevaluatedProperties`, so adding the `allOf` ref is purely additive there.

### D3 — `User` and `Role` Product Core schemas (dual-faceted)
Both follow existing Product Core conventions: PascalCase `name`, an optional operational-mapping field defaulting to `name`, optional `fields[]`/`actions[]`, and they compose `meta/stability`.

The auth facet is **split by provenance** — the materializer treats the two halves differently and the schema/docs must label which is which:

- `product/core/user.json` (`User`): `name`; `person` (the Operational `Person` it projects, default = `name`); `fields[]` (projected attributes, `$ref product/core/field`); `actions[]`; plus a **configured** auth fact — an optional `identity` object naming the login identifier field(s) (e.g. `{ "identifier": "email", "verified": true }`). `identity` is genuinely new product-level information: operational `Person` has attributes, but "this attribute authenticates the subject" has no operational home, so it is configured at the product surface, not derived.
- `product/core/role.json` (`Role`): `name`; `role` (the Operational `Role` it projects, default = `name`); `description`; plus a **derived** RBAC rollup — an optional `scope` (mirroring operational Role scope) and `permissions[]` (the Product Core operation/action references this role may perform, **materialized from the operational access `Rules` that name this role** — a denormalized convenience, NOT a new source of truth). Drift is bounded because product core is regenerated, not hand-edited; the schema description and README must state `permissions[]` is derived so it is not mistaken for an authored ACL.

Keep both facets intentionally small and additive — enough to be real, room to grow. A richer model (session/token shape, auth-provider config, claim→role mappings) is explicitly deferred to a future `product-auth` change. Because the facet is young, `User`/`Role` are themselves candidates for a declared `experimental` maturity (see D4).

### D4 — Registration, composite document, and Field's declared maturity
- `@dna-codes/dna-core/src/index.ts`: register `meta/stability` in the loaded schema map (so Ajv resolves the `$ref`, exactly as `operational/base` is registered today) and add `product.core.user`/`product.core.role`.
- `product.core.json`: add optional top-level `users[]` and `roles[]` arrays (`$ref` the two new schemas), alongside existing `resources[]` etc.
- **Field declared `experimental`:** this is *type maturity* (a fact about the DNA primitive itself), a distinct axis from the *instance maturity* an author declares per document (the base `stability` field that flows into registry seeding). We name that axis explicitly — **"declared type-maturity"** — and locate it, for now, as a `"default": "experimental"` on `product/core/field.json`'s inherited `stability` property. Convention: a primitive declares its own maturity by giving `stability` a schema `default`; absence means the consumer's seeding default applies. This satisfies the literal ask with zero new files.
  - *Promotion path (deliberate, not redesign):* because the concept is named and isolated, moving it to a `stability.json` manifest (sibling to `versions.json`) later is a lift-and-shift. The trigger to switch: a *second* primitive needs a declared type-maturity, or a consumer (docs generator, lint) needs to *query* "list experimental primitives" programmatically. Until then the per-schema `default` stands.

### D5 — Tests and docs that must move
- Flip `validator.test.ts` guard `expect(schemas).not.toContain('product/core/role')`; add positive assertions for `product/core/user` and `product/core/role` and the shared `meta/stability`.
- `index.test.ts`: `schemas.product.core` keys become `['action', 'field', 'operation', 'resource', 'role', 'user']`; bump the "37 primitives" count comment.
- Add validator tests: User/Role minimal + full docs; `stability` accepted on a Product Core and a Technical primitive; invalid stability rejected; Field defaulting.
- README Product Layer section: list `User`/`Role`, resolve the People→Product-Core note for Person/Role; add a short shared-stability note. Update affected `docs/concepts/` if they enumerate Product Core primitives.
- Minor version bumps for `@dna-codes/dna-schemas` and `@dna-codes/dna-core`.

## Risks / Trade-offs

- **Ajv `$ref` resolution for the new base** → if `meta/stability` isn't added to the Ajv instance, every primitive fails to compile. Mitigation: register it in the same place `operational/base` is registered; add an `availableSchemas` assertion.
- **`unevaluatedProperties` regression on operational primitives** → moving `stability` behind a nested `allOf` could, if mis-structured, make it "unevaluated" and start rejecting valid docs. Mitigation: keep base.json composing the shared base via `allOf` (not a sibling property), and rely on the existing `primitive-base-contract` scenarios as guards plus a new explicit test.
- **Naming collision `product Role` vs `operational Role`** → resolved by schema namespacing (`product/core/role` vs `operational/role`); the README must make the projection explicit so authors aren't confused.
- **Re-introducing a retired name (`user`)** → `user` was a retired *operational* primitive; this adds it only at `product/core/user`. The `operational/user` guard test stays green; we add the new one at the product layer.
- **Scope creep in the auth/RBAC facet** → keeping `identity`/`permissions` minimal risks under-modeling; over-modeling risks pre-empting a real auth design. Mitigation: ship the small additive shape, mark `User`/`Role` themselves as appropriate maturity, and defer richer RBAC to a follow-up.

## Migration Plan

Purely additive at the schema surface; no data migration. Deploy = release `@dna-codes/dna-schemas` + `@dna-codes/dna-core` minor bumps together (tag-driven publish). Rollback = revert the schema files, the `index.ts` registration, and the test/doc edits; existing `product.core.json` documents without `users[]`/`roles[]` and without `stability` validate identically before and after.

## Resolved Decisions

- **Auth facet richness → Level 1, split by provenance.** `User.identity` is a configured product fact; `Role.scope`/`permissions[]` is a materialized rollup of operational access Rules, documented as derived. No new RBAC source of truth; a full product-auth model (sessions, tokens, providers, claim mappings) is deferred to its own change.
- **`Field` type maturity → schema `default` now, concept named for later.** `product/core/field.json` carries `default: "experimental"` on its `stability` property; "declared type-maturity" is named as a distinct axis so promotion to a `stability.json` manifest is a lift-and-shift once a second primitive or a programmatic query needs it.
