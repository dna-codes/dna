## Why

Registry types carry a numeric schema `version`, but nothing communicates how *settled* a type's design is. Some concepts (Person, Role, Group, Resource) are locked in; others are still being shaped. As companies begin installing templates that seed types — User/Role in the Product layer, Person/Position in the Operational layer — consumers need a clear, machine-readable maturity signal so they know which types are safe to build on and which may still change or be removed. This applies equally to the *edges* between types: a relationship is as much a committed-or-experimental concept as a noun.

## What Changes

- Add a `stability` lifecycle marker to **registry types** — both `ResourceType` and `RelationshipType` records — with values `experimental` → `beta` → `stable` → `deprecated` (Kubernetes API-maturity model).
- Treat `stability` as **orthogonal** to the numeric schema `version`/`current_version`. A type can be `experimental@v1` or `stable@v2` independently; bumping one never implies the other. Stability is a property of the *concept* (the type's stable identity), not of any one schema revision.
- Define `stability` as a **mutable lifecycle flag** on the live `ResourceType`/`RelationshipType` record that transitions independently of schema-version bumps. Each `ResourceTypeVersion`/`RelationshipTypeVersion` history record captures the stability in effect at write-time for auditability.
- Seed the four foundational types (Person, Role, Group, Resource) as `stable`.
- Default tenant types (resource and relationship) seeded from a DNA document to `experimental` unless the authored definition declares otherwise.
- Allow DNA authored definitions to optionally declare a `stability` on the base contract, which flows into seeding. Absent → defaults apply.
- Surface `stability` in the dna-api GraphQL registry types (resource and relationship), in create/update mutation inputs, and via mutations to transition a type's stability.
- Persist `stability` across the in-memory and Neo4j data stores for both type kinds.

## Capabilities

### New Capabilities
- `registry-type-stability`: Defines the stability lifecycle shared by both registry type kinds (`ResourceType` and `RelationshipType`) — the `experimental`/`beta`/`stable`/`deprecated` vocabulary, its orthogonality to schema version, seeding defaults (foundational types `stable`, tenant types `experimental`), how transitions are recorded in version history, and persistence requirements for data stores.

### Modified Capabilities
- `dna-api`: The GraphQL registry SHALL expose `stability` on resource-type and relationship-type objects and their version-history records, accept it on create/update inputs, and provide mutations to transition a type's stability.
- `primitive-base-contract`: The base contract SHALL permit an optional `stability` field on authored Operational definitions (including relationships), which flows into seeding when a DNA document is loaded.

## Impact

- `packages/core/src/types/data-store.ts` — add `stability` to `ResourceType`/`RelationshipType` and `ResourceTypeVersion`/`RelationshipTypeVersion`; define the shared `Stability` union type.
- `packages/core/src/types/operational.ts` + `packages/schemas/operational/base.json` — optional `stability` on `BasePrimitive` (applies to every primitive kind, including `relationship`).
- `packages/api/src/schema/registry-types.ts` — shared GraphQL enum, object fields on both type kinds, mutation inputs, and transition mutations.
- `packages/api/src/server.ts` — seeding defaults (foundational `stable`, tenant resource/relationship `experimental`/declared); a foundational-detection helper (since `is_seed` alone can't distinguish foundational from tenant types).
- `packages/adapters/src/integration/memory/client.ts` and the Neo4j integration client — persist and round-trip `stability` for both type kinds.
- `README.md` and `docs/concepts/` — document the stability lifecycle.
