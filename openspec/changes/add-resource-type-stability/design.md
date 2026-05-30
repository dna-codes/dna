## Context

The registry already versions resource types: each `ResourceType` record carries a numeric `current_version`, and every mutation appends an immutable `ResourceTypeVersion`. Authored Operational primitives carry a string `version` stamped from `OPERATIONAL_PRIMITIVE_VERSIONS`. None of this expresses *maturity* — whether a type's design is settled enough to depend on.

The user's framing: companies install templates that seed resource types (User/Role in the Product layer, Person/Position in the Operational layer), so the **resource type** is the unit that carries maturity. Foundational seed types (Person, Role, Group, Resource) are locked in; tenant types start unsettled. Long-term, the metamodel "schemas" themselves become default resource types within a base organizational template — so the maturity signal must live on the resource-type record, not on the grammar kinds.

## Goals / Non-Goals

**Goals:**
- A `stability` lifecycle marker on both registry type kinds (`ResourceType` and `RelationshipType`): `experimental` | `beta` | `stable` | `deprecated`.
- Orthogonality: `stability` and schema `version` move independently; stability is a property of the *concept* (the type's immutable identity), not of any one schema revision.
- Sensible defaults at seed time (foundational `stable`, tenant `experimental`) with author override.
- Visibility and controllability through the dna-api GraphQL registry.
- Persistence and round-trip across the in-memory and Neo4j stores.

**Non-Goals:**
- Building the template-installation system or the "schemas become default resource types" collapse — that is motivating context, not in scope here.
- Enforcing behavioral gates from stability (e.g., refusing writes to `experimental` types, hiding `deprecated` types from the schema). This change makes stability *declarable and visible*; policy enforcement is a later change.
- Per-version maturity (the Kubernetes-style "v1 was stable, v2 schema overhaul is experimental"). Stability is concept-level only; if per-version maturity is ever needed it is an additive follow-up, not a redo.

## Decisions

### D1 — `stability` is a separate field, not encoded in `version`
We keep two orthogonal fields rather than folding maturity into a semver-style pre-release tag (`1.0.0-beta`). Rationale: `version` here is a migration enabler keyed to schema *shape* (it answers "which nodes need transformation"), while stability answers "how settled is this design." A type can legitimately be `stable@v3` (settled, third schema revision) or `experimental@v1` (brand new, unsettled). Encoding both in one string couples two independent lifecycles and breaks the existing numeric-version migration tooling. *Alternative considered:* Kubernetes-style versioned API names (`v1alpha1`). Rejected — the registry already has a numeric version axis; a second parallel string is simpler and doesn't overload `version`.

### D2 — `stability` is a mutable lifecycle flag on the live record
`stability` lives on `ResourceType` and can transition (`experimental → beta → stable`, or any state → `deprecated`) **without** requiring a schema-version bump. A graduation is a maturity event, not a shape change. *Alternative considered:* making stability immutable per `ResourceTypeVersion` so each transition forces a new version. Rejected — it conflates the two axes and inflates version history with non-schema changes.

### D3 — Version history records stability at write-time
Although the live flag is mutable, each `ResourceTypeVersion` snapshot also stores the `stability` that was in effect when that version was written. This keeps history self-describing for audit ("what maturity did v2 ship at?") without making stability the *driver* of versioning. A pure stability transition that does not change schema updates the live record's `stability` and is captured by the existing audit trail; it does not, by itself, mint a new schema version.

### D4 — Stability vocabulary maps to a GraphQL enum
Expose a `ResourceTypeStability` GraphQL enum (`EXPERIMENTAL`, `BETA`, `STABLE`, `DEPRECATED`). The string union in core (`'experimental' | 'beta' | 'stable' | 'deprecated'`) is the source of truth; the GraphQL enum mirrors it with conventional upper-case members.

### D5 — Seeding defaults
- The four foundational types (Person, Role, Group, Resource) seed as `stable`.
- Tenant types seeded from `dna.domain.*[]` default to `experimental`, unless the authored definition declares a `stability` (D6), in which case the declared value wins.

### D6 — Optional authored `stability` on the base contract
`BasePrimitive` (and `base.json`) gain an optional `stability` field so DNA authors can declare maturity in the source document; it flows into seeding. Optionality preserves backward compatibility — existing DNA documents validate unchanged and fall back to the D5 defaults. The field is constrained to the four enum values.

### D7 — Transition mutation
dna-api exposes a dedicated mutation (e.g. `setResourceTypeStability(id, stability)`) distinct from schema-changing updates, reflecting D2's separation. Create/update inputs also accept `stability` so it can be set at creation; when omitted on create, defaults apply.

### D8 — Relationship types are symmetric with resource types
Stability applies to both `ResourceType` and `RelationshipType` because a relationship is a *concept* in exactly the same sense a noun is — "Borrower borrows Loan" is as committed-or-experimental as "Loan." The registry already mirrors the two (parallel `*Type`, `*TypeVersion`, CRUD, and `seedFromDna` walking `relationships[]`), so this is duplication of the same pattern with a *shared* `Stability` union/enum — no second vocabulary. This also reinforces the concept-level decision (D1): the existing model already treats identity fields as immutable and non-versioned — `name` on resource types, `name`/`from`/`to` on relationship types (`ResourceTypeUpdate`/`RelationshipTypeUpdate` omit them). Renaming a type is changing the *concept*, not versioning it; versions only capture `attribute_schema` shape. Stability, like the name, is a property of that stable identity. *Note:* `is_seed` is true for both foundational and tenant-seeded types, so the seeding/backward-compat default must detect foundational types by well-known identity (Person/Role/Group/Resource), not by `is_seed`.

## Risks / Trade-offs

- **Two axes invite confusion** ("why didn't graduating to stable bump the version?") → Document the orthogonality explicitly in README/docs and name the transition mutation distinctly so the separation is obvious in the API surface.
- **Backward compatibility of stored records** → Persisted `ResourceType`/`ResourceTypeVersion` rows predating this change lack `stability`. Reads SHALL treat a missing value as a default (`stable` for the four foundational types, `experimental` otherwise) so old data round-trips without a migration script.
- **Scope creep toward enforcement** → It is tempting to immediately gate behavior on stability. We explicitly defer that (Non-Goals) to keep this change additive and low-risk.
- **GraphQL enum / core union drift** → Keep the core union the single source of truth and derive/mirror the enum from it; add a test asserting the two stay in sync.
