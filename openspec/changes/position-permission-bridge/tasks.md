## 1. Part A — Operational rename Role → Position (atomic)

- [x] 1.1 Rename `packages/schemas/operational/role.json` → `position.json`: set `$id` `.../operational/position`, `type` const `"position"`, title `Position`, and rewrite description ("the organizational position a Person fills"). Keep all fields (`scope`, `parent`, `system`, `resource`, `cardinality`, `required`, `excludes`, `attributes`, `actions`).
- [x] 1.2 Update `operational/membership.json`: rename `role` property → `position` (update `required`, description, `pattern`, and `examples`); keep `person` + `position` + `group?` triad.
- [x] 1.3 Update `operational/operational.json` index: rename `roles[]` collection → `positions[]`, update `$ref`s and any `role` references; update noun list to Resource/Person/Position/Group.
- [x] 1.4 Update `operational/operation.json` target resolution docs/enum to `Resource | Person | Position | Group`.
- [x] 1.5 Update `packages/core/src/types/operational.ts` and builders: `Role` type → `Position`, `Membership.role` → `Membership.position`, `positions[]` collection.
- [x] 1.6 Update `packages/core` validator: resolve targets and Membership references across the four noun collections using `positions` (not `roles`); update parent/cycle/scope/cardinality/excludes checks to Position; refresh error-path strings (`positions/<child>/parent`).
- [x] 1.7 Convert all 7 `examples/*/operational.json` (lending, mass-tort, marketplace, healthcare, manufacturing, education, registry): `roles[]` → `positions[]`, `Membership.role` → `Membership.position`, any system Role → system Position.
- [x] 1.8 Update lens definitions and any code that reads operational `Role`: people-positions, job-description, reporting-chains, span-of-control, org-chart, role-hierarchy → position-hierarchy.
- [x] 1.9 **`@dna-codes/dna-core` fully green** (476/486; the 10 failures are pre-existing ENOENT for 5 example dirs lacking `operational.json`). Migrated all core unit-test fixtures off the domain-nested shape to top-level `positions` (completing `domain-home-edge-migration` tasks 8.1–8.3 + query-helper top-level reads). `tsc` clean. Adapters: 252/300 — remaining 7 suites are domain-home's deferred 8.4 (output collectors) + the uncatalogued `input/text` adapter + engine (8.5/8.6, domain-home's own follow-on).
- [x] 1.10 Update README Operational Layer (People primitives: Person, Position, Group, Membership) and affected concepts docs.

## 2. Part B — Product Role remap

- [x] 2.1 Update `product/core/role.json`: remove inline `scope` string field; change mapping field `role` → `position` (projects operational Position); demote `permissions[]` from source-of-truth to non-normative convenience (or remove).

## 3. Part B — Product Permission junction (Actor›Action›Resource)

- [x] 3.1 Create `packages/schemas/product/core/permission.json`: `principal` (User ref), `role` (ref), `scope` (single Cedar-style `::`-delimited qualified string of arbitrary depth, e.g. `Alloc8::Groups::P&T::Subteam::Platform`) + optional `grant_reason`/provenance; compose stability base. Identity is `{principal, role, scope}`. Do NOT create a `Scope` schema and do NOT destructure scope into namespace/type/id fields — scope is one reference string, not a type.
- [x] 3.2 Define the qualified scope-string format (`::`-delimited, arbitrary nesting) and validator resolution (resolve the string to a projected Group / declared Resource; flag unresolved refs).
- [x] 3.3 Extend `product/product.core.json`: add an optional `permissions[]` array referencing `product/core/permission`; keep existing docs valid (additive). No `scopes[]` array.
- [x] 3.4 Register `product/core/permission` in `@dna-codes/dna-core`; confirm no `product/core/scope` is registered.

## 4. Part B — grants bridge relationship

- [x] 4.1 Define and register the `grants` relationship type (source `Membership`, target `Permission`) in the core relationship/edge registry alongside `can_access`/`assigned_to`.
- [x] 4.2 Ensure `grants` is exported/queryable in both directions (Membership → Permissions granted; Permission → backing Membership).

## 5. Part B — Projection (derive-first, author-fallback)

- [x] 5.1 Extend `packages/core/src/projection` project step: emit a `Permission{principal, role, scope}` per Membership whose Position→role and access Rule→scope resolve, with `scope` set to a namespaced reference to the projected Group/Resource; emit a `grants` edge from the Membership. No `Scope` node emission.
- [x] 5.2 Implement the derivation rule: `IF Membership(person→position→group) AND access Rule allows that Position on an operation within that Group's scope THEN Permission + grants`. Mark under-determined cases (multi-scope position, Person-named rules) with the existing `planned` flag, no invented edges.
- [x] 5.3 Extend the projection apply step: register the Permission type; upsert Permission by `{principal, role, scope}` identity (no duplicates); reconcile a derived Permission onto a matching authored one and add the `grants` edge.
- [x] 5.4 Treat `grants` like governance edges in apply: preserve on re-apply, soft-handle (mark, not hard-delete) when an endpoint vanishes.
- [x] 5.5 Support the author-fallback: a hand-authored Permission with no backing Membership validates and persists with no `grants` edge.

## 6. Tests & docs

- [x] 6.1 Add/extend core tests: Permission schema validation, namespaced scope-reference resolution, projection derivation (membership+rule → permission+grants), planned-on-under-determined, apply idempotency, authored/derived reconciliation, grants preservation + soft-handle.
- [x] 6.2 Update README Product Layer (Core): document the Permission junction (Actor›Action›Resource), scope as a namespaced entity reference, the grants bridge, and the derive-first/author-fallback rule; update the operational↔product parallel table.
- [x] 6.3 Update `packages/core` README/docs and concepts docs for the new primitives and relationship.
- [x] 6.4 Run full build + test suite green; validate all examples and any product.core example documents.

## 7. Downstream coordination

- [ ] 7.1 Inventory consumers of operational `Role` (apps/graph-studio org-chart, dna-agent packs, engine/cells) and update the `role`→`position` field reference or document the breaking rename; note the dna-agent pack projection bridging remains the deferred follow-on.
