## Context

DNA models everything as resources and relationships across three decoupled layers (Operational → Product → Technical). The operational People primitives today are **Person, Role, Group, Membership**, where `Membership = {person, role, group?}` is already the junction template ("Persons of type X may hold Roles of type Y in Groups of type Z"). The product layer projects these: product `User` (from Person) and product `Role` (from operational Role), with permissions surfaced only as a derived `permissions[]` string rollup on product `Role` and `scope` as a bare string field.

Two problems block the org→app authorization causal chain:

1. **"Role" is overloaded.** The same word names the organizational *position* a person fills and the product RBAC *role*. The intended parallel is Person/User, Position/Role, Group/Scope — but with both middle terms called "Role", the projection is `Role→Role` and the distinction collapses.
2. **No Permission junction, no bridge.** There is no `User + Role + Scope` product junction and nothing links an authorization back to the operational fact that grants it. So "Why does Kyle have Approver access to P&T?" is unanswerable.

This design realigns the parallel and introduces the bridge. It is a cross-cutting change touching schemas, core types/validator/projection, examples, lenses, and docs, with a breaking operational rename — warranting design before coding.

## Goals / Non-Goals

**Goals:**
- Make the operational↔product People parallel exact and queryable: Person/User · Position/Role · Group/Scope · Membership/Permission.
- Add a first-class `grants` relationship (Membership → Permission) so the authorization causal chain is a real subgraph.
- Keep Product Core derive-first: Permission (+ grants edge) is materialized by the business→product projection, with an author-fallback for permissions that have no backing Membership.
- Preserve the "resources and relationships only" invariant — every new construct is a `resource_type` or `relationship_type`; no behavioral state outside the graph.
- Keep all definitions template-level; instance bindings (Kyle × Head × P&T) remain runtime data in the store.

**Non-Goals:**
- No runtime/instance enforcement of permissions (the validator checks declarations only, as it already does for cardinality/excludes).
- No backward-compat alias for operational `Role`/`Membership.role` — this is an intentional breaking rename, not a deprecation cycle.
- No change to operational `Rule` semantics (access Rules still name actors); we only retarget the actor vocabulary and read Rules during projection.
- No new Technical-layer constructs; downstream cells consume `product.core.json` unchanged in shape beyond the new arrays.
- No migration of the flatter dna-agent pack vocabulary into the new projection (remains the deferred follow-on already noted in README).

## Decisions

### D1 — Rename operational `Role` → `Position` (hard rename, no alias)
The middle operational primitive becomes `Position` (`position.json`, `$id .../operational/position`, `type: "position"`), carrying every field Role had (`scope`, `parent`, `system`, `resource`, `cardinality`, `required`, `excludes`). `Membership.role` → `Membership.position`. Operation target resolution becomes `Resource | Person | Position | Group`.

- *Why:* Frees "Role" for the product layer and makes the projection `Position → Role` literal and unambiguous. "Position" already pervades the lens vocabulary (people-positions, job-description, reporting-chains, span-of-control), so it is the natural operational term.
- *Alternative considered:* Keep operational `Role`, project `Role→Role`. Rejected — perpetuates the overload the user explicitly called out and muddies the bridge story.
- *Alternative considered:* Add `Position` as an alias of `Role`. Rejected — two names for one node type violates the single-vocabulary principle and complicates validation/projection. Pre-1.0; a clean break is cheaper than a permanent alias.

### D2 — Scope is a namespaced entity reference (Cedar `resource`), not a new resource type
There is **no** `Scope` resource type. `Permission.scope` is a **single Cedar-style qualified string** — the Resource slot of Actor › Action › Resource (as in AWS Cedar's `resource in Group::"P&T"`) — pointing at an entity that already exists: the product projection of an operational `Group`, or any product `Resource`. The string is `::`-delimited and supports **arbitrary nesting depth** (e.g. `Alloc8::Groups::P&T`, `Alloc8::Groups::P&T::Subteam::Platform`), so a scope can be qualified as many layers deep as the containment hierarchy requires. It is parsed/resolved as a single opaque-but-structured token, not destructured into a `{namespace, type, id}` object.

- *Why:* Scope is a *slot/relationship*, not a kind of thing. Operational DNA already works this way — `Position.scope` references a `Group` rather than defining a "Scope" type — and Cedar treats the resource as a uniform namespaced entity reference. Minting a `Scope` node type would invent a primitive for what is really a reference to an already-modeled entity, breaking both parallels.
- *Why a reference resolves "which permissions apply to X" fine:* the scope reference resolves to a real node, so the question is still an edge/traversal once the registry materializes the reference — no string scan over an opaque field, and no duplicate node type to keep in sync with Group.
- *Alternative considered (original):* `Scope` as a first-class `resource_type` projecting Group. Rejected per the above — it duplicates Group at the product layer and diverges from the operational `Position.scope → Group` convention and Cedar.
- *Consistency note:* this also matches how `Membership` is authored — `person`/`role`/`group` are string references that resolve to edges, not embedded sub-types. `Permission`'s `principal`/`role`/`scope` follow the same authoring convention.

### D3 — `Permission` as a reified junction node, derive-first / author-fallback
`product/core/permission.json` has `principal` (User), `role`, `scope` (namespaced entity reference per D2), optional `grant_reason`/provenance. The projection derives a `Permission` (and its `grants` edge) from each operational `Membership` combined with the access `Rules` that name the membership's position. A `Permission` may also be hand-authored when no Membership backs it; then it carries no `grants` edge.

- *Why reified as a node (not a bare edge):* `grants` must point *at* the authorization, so the authorization has to be addressable. Reifying Permission is what lets the causal chain attach. (Contrast `can_access`, a direct principal→surface edge, which nothing needs to reference.)
- *Why derive-first/author-fallback:* Consistent with "Product Core is always DERIVED" while honoring real-world permissions with no org membership (service accounts, ad-hoc grants). The presence/absence of `grants` is exactly the signal "is this authorization explained by an org fact?"
- *Derivation rule (the Atlas rule):* `IF Membership(person→position→group) AND access Rule allows that position on an operation within that group's scope THEN Permission{ principal: project(person), role: project(position), scope: ref(group) }` with `Membership --grants--> Permission`.
- *Alternative considered:* Author-only Permission. Rejected — breaks the derive-first principle and forces hand-maintenance of what operational DNA already implies.

### D4 — `grants` as a `relationship_type`, registered with the governance edges
`grants` (Membership → Permission) joins `can_access`/`assigned_to` in the core relationship/edge registry and is preserved by the projection's apply step (never clobbered on re-apply; soft-handled when an endpoint vanishes), matching how authored governance edges are already treated.

- *Why:* The bridge is an edge, not a field — it must be traversable in both directions ("what does this membership grant?" / "what membership explains this permission?"). Reusing the governance-edge preservation machinery keeps re-projection idempotent.
- *Note:* `grants` is cross-layer (Operational→Product). Cross-layer references in DNA are plain validated strings, not JSON-Schema `$ref`s — consistent with existing cross-layer linking.

### D5 — Product `Role` retains its name, remaps to `Position`
Product `Role` keeps `Role` (it *is* the product RBAC role) but its mapping field changes `role` → `position` (the operational Position it projects). The inline `scope` string and `permissions[]` rollup leave `Role`: scope becomes a namespaced reference on `Permission` (D2); the permissions rollup is superseded by the `Permission` junction.

- *Why:* Avoids a second confusing rename at the product layer while completing the parallel. `Role.permissions[]` was always a denormalized convenience; the junction is the real model.

## Risks / Trade-offs

- **Wide breaking blast radius** (schemas, core, 7 examples, ~6 lenses, apps, cells) → Land Part A (rename) as one atomic, mechanically-verifiable pass (schema + types + validator + examples must all flip together or validation fails), then Part B additively on top. Run the full validator/test suite against every example before committing.
- **Downstream consumers** (graph-studio org-chart, dna-agent packs, cells) read operational `Role` → Inventory references during apply; update in lockstep or document the field rename. dna-agent pack bridging is already a deferred follow-on, so a temporary mismatch there is acceptable and noted.
- **Derivation ambiguity** — mapping a Membership+Rules to a concrete `Permission.role`/`scope` may be under-determined when a position has multiple scopes or a rule names a person rather than a position → Project conservatively: emit a `Permission` only when position→role and group→scope both resolve; mark anything unresolved `planned` (reusing the existing projection `planned` flag) rather than inventing edges.
- **Author-fallback drift** — a hand-authored Permission could duplicate one the projection would derive → Key Permissions by `{principal, role, scope}` identity in apply/upsert so a later derivation reconciles onto the same node and simply adds the `grants` edge, never a duplicate.
- **Scope reference resolution** — a namespaced scope ref (`Alloc8::Groups::P&T`) must resolve to a real product entity (projected Group / Resource) → The projection emits `Permission.scope` as a reference to the entity it already knows it projected from; the validator resolves the qualified reference and flags unresolved scopes rather than minting a placeholder. The app/namespace qualifier (`Alloc8::`) is part of the reference format, not a new node.

## Migration Plan

1. **Part A (atomic):** rename schema file + `$id` + `type` const; flip `Membership.role`→`position`; update operational index + operation target resolution; update core TS types/builders/validator; convert all 7 example docs; update lenses/specs and README. Gate on: every example validates, full test suite green.
2. **Part B (additive):** add `permission.json`; extend `product.core.json` with `permissions[]`; remap product `Role` (drop inline scope, `role`→`position`); register `grants`; extend projection (project + apply) to emit Permission + grants with scope as a namespaced reference, derive-first + author-fallback; update product docs/README.
3. **Rollback:** Part B is additive and revertable in isolation. Part A revert = restore `role.json`/`Membership.role` and re-flip examples; because it's a single commit, `git revert` is clean. No data migration (template-level only; no persisted instances in this repo).

## Open Questions

- Should `lintEmptySurfaces`-style linting extend to "Permission with no backing Membership and no author justification"? (Deferred unless cheap to fold into the projection lint.)

*(Resolved)* Scope-reference grammar: a single Cedar-style `::`-delimited qualified string of arbitrary nesting depth — see D2.
