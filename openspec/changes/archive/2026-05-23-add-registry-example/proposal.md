## Why

The six existing cross-domain examples (lending, mass-tort, marketplace, healthcare, manufacturing, education) each model a concrete business vertical. None of them demonstrate the **meta-pattern** that emerges when a platform uses DNA's Operational primitives to implement a type-driven, config-vs-instance architecture — where TypeDefinitions (configuration templates with attribute schemas, category constraints, and relationship rules) produce Instances (validated runtime records) linked by typed relationships. This is the exact pattern that arises when building any generic registry, CMS, workflow builder, or low-code platform. Without a canonical example, every team building a type-driven system on top of DNA reinvents the mapping from "resource type with schema" → DNA Resources and from "role as attributed relationship" → DNA Roles + Memberships.

Adding a `registry` example would show that DNA's existing primitives already capture this pattern natively, and would validate that the Operational schema is expressive enough for platforms that don't hardcode their domain model. Sourced from GitHub issue [dna-codes/dna#1](https://github.com/dna-codes/dna/issues/1).

## What Changes

- **NEW** `examples/registry/operational.json` — a seventh cross-domain example modeling a generic type-driven resource management platform. Three core Resources (TypeDefinition, Instance, Link), two Persons (Administrator, Operator), one Group (Registry), four Roles (TypeDesigner, DataManager, Viewer, ValidationEngine — the last marked `system: true`), four Memberships, eight Operations, five Triggers, twelve Rules (access + condition subtypes), three Relationships, six Tasks, and three Processes.
- **NEW** `examples/registry/README.md` — documents what the example demonstrates and deliberately omits, following the convention established by `examples/lending/README.md`.
- **MODIFIED** `README.md` (repo root) — adds a `registry` row to the cross-domain examples table with its "Demonstrates" summary.
- **MODIFIED** `packages/core/src/examples.test.ts` — per-domain assertions added for registry-specific shapes (TypeDefinition Resource with `category` enum attribute, ValidationEngine system Role, InstanceBootstrap Process triggered by `TypeDefinition.Publish`). The existing `readdirSync` loop auto-discovers the new directory, so no structural test changes are needed.

No schema changes. No new primitives. No adapter changes. The example validates against the existing `@dna-codes/dna-schemas` Operational schemas as-is.

## Capabilities

### New Capabilities

- `cross-domain-examples`: A capability covering the repo's set of canonical example DNA documents under `examples/<domain>/operational.json`, the per-example README convention, the root-README cross-domain table, and the per-domain shape assertions in `packages/core/src/examples.test.ts`. This change adds the `registry` example's requirements as the inaugural set; future cross-domain examples extend the same capability.

### Modified Capabilities

<!-- None. The change is purely additive; no existing capability's requirements change. -->

## Impact

- **`examples/registry/operational.json`**: ~400 lines of JSON. All primitives carry the base contract fields (`id`, `type`, `version`) per the `primitive-base-contract` spec. Validates against the `operational` schema.
- **`examples/registry/README.md`**: ~30 lines. Follows existing README convention (what-demonstrates / what-omits sections).
- **`README.md`**: one table row added to the cross-domain examples section.
- **`packages/core/src/examples.test.ts`**: ~20 lines of per-domain assertions appended. Existing `domains` loop auto-discovers the directory; no structural test changes. All 6 existing examples continue to pass.
- **Tests**: net addition. `npm test --workspace=@dna-codes/dna-core` must pass with the new example included (schema conformance + cross-layer validation + per-domain shape assertions).
- **Risk**: negligible — new files only, no behavioral changes to any package. No version bumps.
- **Reversibility**: delete `examples/registry/`, revert the README table row and test assertions.
