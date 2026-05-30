## 1. Core types (dna-core)

- [x] 1.1 Add a shared `Stability` string union (`'experimental' | 'beta' | 'stable' | 'deprecated'`) and a `STABILITIES` value array to `packages/core/src/types/data-store.ts`; export from the package index
- [x] 1.2 Add `stability: Stability` to the `ResourceType` and `RelationshipType` interfaces in `packages/core/src/types/data-store.ts`
- [x] 1.3 Add `stability: Stability` to the `ResourceTypeVersion` and `RelationshipTypeVersion` interfaces (records stability at write-time)
- [x] 1.4 Add optional `stability?: Stability` to the create-input shapes (`ResourceTypeInput`, `RelationshipTypeInput`) and update-patch shapes (`ResourceTypeUpdate`, `RelationshipTypeUpdate`)
- [x] 1.5 Add an optional `stability?: Stability` to `BasePrimitive` in `packages/core/src/types/operational.ts` (applies to every primitive kind, including `relationship`)

## 2. JSON Schema (dna-schemas)

- [x] 2.1 Add an optional `stability` property to `packages/schemas/operational/base.json` constrained to the four enum values; confirm it composes via `allOf` so it is not rejected by `unevaluatedProperties` on any per-primitive schema (including `relationship.json`)
- [x] 2.2 Add/extend a schema fixture or test asserting a primitive with a valid `stability` validates, an invalid value fails, and an absent value still validates

## 3. Seeding defaults (server)

- [x] 3.1 Add a foundational-detection helper in `packages/api/src/server.ts` (or shared) that identifies the four foundational types by well-known identity (Person, Role, Group, Resource), since `is_seed` alone cannot distinguish foundational from tenant types
- [x] 3.2 Seed the four foundational types with `stability: 'stable'`
- [x] 3.3 When seeding tenant resource types from `dna.domain.*[]`, use the authored definition's declared `stability` if present, otherwise default to `'experimental'`
- [x] 3.4 When seeding relationship types from `dna.relationships[]`, apply the same rule (declared `stability` wins, else `'experimental'`)

## 4. Data store persistence (dna-adapters)

- [x] 4.1 Persist and round-trip `stability` on `ResourceType`/`RelationshipType` and their version records in `packages/adapters/src/integration/memory/client.ts`
- [x] 4.2 Persist and round-trip `stability` for both type kinds in the Neo4j integration client
- [x] 4.3 On read, default missing `stability` to `'stable'` for foundational types and `'experimental'` otherwise (backward-compat for pre-existing records), reusing the foundational-detection helper
- [x] 4.4 Ensure a schema-version bump leaves `stability` unchanged, and a stability change does not bump `current_version` (for both resource and relationship types)

## 5. GraphQL registry surface (dna-api)

- [x] 5.1 Add a single shared `Stability` enum (`EXPERIMENTAL`/`BETA`/`STABLE`/`DEPRECATED`) to `packages/api/src/schema/registry-types.ts`, derived from / kept in sync with the core `Stability` union
- [x] 5.2 Expose `stability: Stability!` on the resource-type object, the relationship-type object, and both version-history objects
- [x] 5.3 Add optional `stability` to resource-type and relationship-type create/update mutation inputs (default applied on create, unchanged on update when omitted)
- [x] 5.4 Add `setResourceTypeStability(id, stability)` and `setRelationshipTypeStability(id, stability)` mutations that update the lifecycle marker without changing `attribute_schema` or `current_version`
- [x] 5.5 Add a test asserting the GraphQL enum and the core union stay in sync

## 6. Tests

- [x] 6.1 Unit test: foundational types seed as `stable`; tenant resource and relationship types default to `experimental`; declared stability is honored
- [x] 6.2 Integration test: stability round-trips through the in-memory store for both type kinds and a legacy record without stability reads back with the correct default
- [x] 6.3 API test: queries return `stability` for both type kinds, each transition mutation changes stability without bumping version, invalid enum value is rejected

## 7. Docs

- [x] 7.1 Update `README.md` to document the stability lifecycle, its orthogonality to schema version, and that it applies to both resource and relationship types
- [x] 7.2 Update `docs/concepts/` (e.g. `resource-types.md`) to describe `experimental`/`beta`/`stable`/`deprecated` and seeding defaults
- [x] 7.3 Run `openspec validate add-resource-type-stability --strict` and resolve any issues
