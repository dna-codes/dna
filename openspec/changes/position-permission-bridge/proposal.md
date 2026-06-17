## Why

DNA can describe *that* a user has a permission, but not *why*. Operational `Membership` (who fills which role where) and the product-layer authorization facts are disconnected, so no query can answer "Why can Kyle approve P&T allocations?" The answer — "because he holds the Head position in the P&T group" — is the operational DNA we want to make first-class.

Two structural gaps cause this:
1. The word **Role** means two different things (the organizational position a person fills *and* the product RBAC role), collapsing a distinction the model needs.
2. Product permissions exist only as a derived `permissions[]` string rollup embedded on the product `Role` — there is no reified authorization (principal + role + scoped resource), and nothing links it back to the operational `Membership` that justifies it.

This change realigns the operational↔product People parallel so the org→app authorization causal chain is a real, queryable subgraph: **Person/User · Position/Role · Group/Scope · Membership/Permission**, bridged by `Membership --grants--> Permission`.

## What Changes

**Part A — Operational rename Role → Position (BREAKING)**

- **BREAKING** Rename operational `resource_type` `Role` → `Position` (`role.json` → `position.json`, `$id` `.../operational/position`, `type` const `"position"`). A Position is the organizational position a Person fills (Underwriter, Doctor, LeadCounsel, Head of P&T). All Role-specific fields (`scope`, `system`, `resource`, `cardinality`, `required`, `excludes`, `parent`) move to Position unchanged.
- **BREAKING** `Membership.role` field → `Membership.position`; the triad becomes Person + Position + Group.
- Operation target resolution becomes `Resource | Person | Position | Group`.
- Update operational index schema, core TS types/builders/validator, all 7 example `operational.json` docs, README, and every lens/spec that references operational `Role`.

**Part B — Product Permission junction + grants bridge**

- New product `resource_type` **`Permission`** (`product/core/permission.json`) — a reified authorization on the Actor › Action › Resource model (as in AWS Cedar): `principal` (User) + `role` (capacity) + `scope` (the Resource slot). The product-layer parallel to operational `Membership`. Optional `grant_reason`/provenance.
- **`Permission.scope` is a namespaced entity reference**, not a new type — it points at an entity that already exists (the projected operational `Group`, or any `Resource`), e.g. `Alloc8::Groups::P&T`. There is deliberately **no** `Scope` resource_type; scope is the resource slot, mirroring how operational `Position.scope` references a `Group`.
- New `relationship_type` **`grants`** (operational `Membership` → product `Permission`) — the causal bridge. Registered alongside `can_access`/`assigned_to`. `Permission` is reified as a node precisely so `grants` has something to point at.
- Product `Role` keeps its name but now projects operational `Position` (mapping field `role` → `position`); the inline `scope` string is removed from `Role` (scope lives on `Permission` as a reference).
- **Derive-first, author-fallback**: the business→product projection materializes `Permission` (and the `grants` edge) from operational `Membership` + access Rules; a `Permission` may also be hand-authored when no backing `Membership` exists, in which case `grants` is absent.
- `product.core.json` gains a `permissions[]` array.

Everything stays resources-and-relationships: Position/Permission are `resource_type`s; `grants` is a `relationship_type`; scope is an entity reference resolved to existing nodes. All definitions are template-level (types) — specific Kyle × Head × P&T bindings remain runtime instance data in the data-store, not schema.

## Capabilities

### New Capabilities
- `position-primitive`: Operational `Position` resource type (renamed from Role) — the organizational position a Person fills, carrying scope/hierarchy/cardinality/exclusion constraints, referenced by `Membership.position`.
- `product-permission-junction`: Product `Permission` resource type — a reified Actor›Action›Resource authorization (principal + role + scope-reference), derive-first from Membership+Rules and author-fallback when unbacked. `scope` is a namespaced entity reference, not a separate type.
- `grants-bridge-relationship`: The `grants` relationship type linking operational `Membership` → product `Permission`, making the org→app authorization causal chain queryable.

### Modified Capabilities
- `product-core-identity`: Product `Role` projects operational `Position` (not `Role`); inline `scope` leaves `Role` (scope is a reference on `Permission`); `permissions[]` rollup superseded by the `Permission` junction.
- `product-projection`: Projection now emits `Permission` nodes and `grants` edges from Membership + access Rules, with scope resolved as a namespaced entity reference.
- `product-projection-apply`: Apply/upsert and type registration cover `Permission` and the `grants` edge (preserved like other governance edges).
- `grouping-model`: Operational grouping/membership references retarget `Role` → `Position`.
- `role-hierarchy`: Position hierarchy (parent/scope-narrowing) replaces Role hierarchy.
- `people-positions-lens`: Lens slots/edges reference `Position` instead of operational `Role`.
- `job-description-lens`: References operational `Position`.
- `reporting-chains-lens`: References operational `Position`.
- `span-of-control-lens`: References operational `Position`.
- `org-chart-lens`: Containment + membership edges reference `Position`.
- `cross-domain-examples`: All example operational docs use `positions[]` / `Membership.position`.

## Impact

- **Schemas** (`packages/schemas`): `operational/role.json`→`position.json`, `operational/membership.json`, `operational/operational.json`, `operational/operation.json` target resolution; new `product/core/permission.json`; `product/core/role.json` (drop inline scope, remap to position), `product/product.core.json` (add `permissions[]`).
- **Core** (`packages/core`): `src/types/operational.ts`, builders, validator (noun-collection resolution), `src/projection/*` (project + apply), relationship/edge registry, lens definitions, core README + docs.
- **Examples**: all 7 `examples/*/operational.json` (lending, mass-tort, marketplace, healthcare, manufacturing, education, registry).
- **Docs/README**: Operational Layer (People primitives), Product Layer (Core), concepts docs.
- **Downstream consumers** of operational `Role` (apps/graph-studio org-chart, dna-agent packs, cells) — migration noted; coordinate field rename `role`→`position`.
- **BREAKING** for any authored DNA using operational `roles[]` / `Membership.role` and any product DNA reading product `Role.scope`/`Role.role`.
