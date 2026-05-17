## Context

DNA primitives today have no shared identity contract. Each schema (`resource.json`, `operation.json`, etc.) defines its own required fields independently — `name` is required on most but not all, `description` is optional everywhere, and there is no `id` or `type` field at all. This was fine when DNA was purely a file-format concern, but the roadmap includes storage in Neo4j (and potentially Postgres, Redis, document stores), where every node/row needs a stable UUID, a type discriminator, and a version field to drive migrations.

The `additionalProperties: false` constraint is present on every current primitive schema. This creates a load-bearing tension with JSON Schema `allOf` composition: AJV will reject base-schema properties as "additional" unless we switch to `unevaluatedProperties: false` (available in JSON Schema Draft 2020-12, which dna-schemas already uses).

Affected packages: `@dna-codes/dna-schemas`, `@dna-codes/dna-core` (types, builders, queries, validator), `@dna-codes/dna-merge`, all input adapters, all example documents.

## Goals / Non-Goals

**Goals:**
- Every Operational primitive carries `id` (UUID v4), `type` (primitive discriminator), `name` (required, base-level), `version` (integer or semver string identifying the type's schema version), and optionally `description` at the base level.
- A single `base-primitive.json` schema in `@dna-codes/dna-schemas` is the authoritative source for these five fields; all per-primitive schemas extend it via `allOf`.
- Builders auto-assign `id`, `type`, and `version` when not supplied.
- TypeScript types are updated so every primitive is typed with the base fields as required.
- All existing examples and fixtures are migrated.
- `additionalProperties: false` → `unevaluatedProperties: false` on all primitive schemas.

**Non-Goals:**
- `domain` is not added to the base contract in this change — it becomes a graph relationship in Neo4j adapters (separate change).
- Neo4j adapter / graph storage implementation is out of scope — this change only establishes the contract those adapters will depend on.
- Product and Technical layer primitives are out of scope — this change covers Operational primitives only; other layers follow the same pattern in a later change once Operational is proven.
- UUID cross-referencing is out of scope — cross-references remain name-based strings. UUID-based linking is a consumer concern (e.g., a Neo4j adapter that resolves names to node IDs at import time).
- Merge identity does not change — merge continues to de-duplicate by `name`. Same-named primitives from different sources that carry different UUIDs do surface as a scalar conflict on `id`; the existing conflict policy handles it.
- Cross-version query compatibility is out of scope — `version` is a migration enabler, not a query compatibility layer (see D4).

## Decisions

### D1: `allOf` + `unevaluatedProperties: false` for base schema composition

```json
// operational/base-primitive.json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://dna.codes/schemas/operational/base-primitive",
  "type": "object",
  "required": ["id", "type", "name", "version"],
  "properties": {
    "id":          { "type": "string", "format": "uuid" },
    "type":        { "type": "string" },
    "name":        { "type": "string" },
    "version":     { "type": "string" },
    "description": { "type": "string" }
  }
}

// operational/resource.json (after)
{
  "allOf": [{ "$ref": "https://dna.codes/schemas/operational/base-primitive" }],
  "properties": {
    "type":       { "const": "resource" },
    "attributes": { ... },
    "actions":    { ... },
    ...
  },
  "unevaluatedProperties": false   // ← replaces additionalProperties: false
}
```

`unevaluatedProperties: false` (Draft 2020-12) considers properties from all `allOf` / `$ref` branches as "evaluated," so base fields are not rejected. `additionalProperties: false` is unaware of `allOf` branches and would reject them.

**Alternative considered:** Copy base fields into every schema (no `allOf`). Rejected — single source of truth is worth the `unevaluatedProperties` migration cost. Any future base field addition would otherwise require touching 10+ schemas.

### D2: `type` values are the lowercase primitive names

```
resource | person | role | group | membership |
operation | trigger | rule | task | process | relationship
```

Each per-primitive schema constrains `type` to a single `const` value. This makes type narrowing trivial in TypeScript and makes Neo4j node label assignment mechanical.

**Alternative considered:** Use the `$id` URI as `type`. Rejected — too verbose for node properties; the short name is what consumers (Cypher, REST, CLI) will use.

### D3: `version` is named for clarity alongside `type`

The field is named `version` (not `schema_version` or `type_version`). Alongside `type`, it reads unambiguously: `{ type: "resource", version: "1" }` means "version 1 of the resource type schema." No redundancy (`type_version` would repeat the concept already conveyed by `type`), no false breadth (`schema_version` implies the overall DNA schema rather than this specific primitive type's version).

### D4: `version` is a migration enabler, not a query compatibility layer; increments are semantic minor bumps at minimum

`version` does not make cross-version queries transparent. If `resource` v1 stores `active: true` (boolean) and v2 stores `status: "active"` (enum), a query for "active resources" must target one version's field shape — there is no automatic bridging.

The intended lifecycle:

```
author primitives under version "1"
    ↓
field shape changes → bump primitive version to "2"
                    → bump @dna-codes/dna-schemas minor version (or major if breaking)
    ↓
migration: MATCH (n:Resource) WHERE n.version = '1'
           SET n.status = CASE WHEN n.active THEN 'active' ELSE 'inactive' END
           REMOVE n.active
           SET n.version = '2'
    ↓
all nodes are version "2" — queries work uniformly
```

**Versioning rule:** any increment to a primitive's `version` value MUST be accompanied by at least a semantic minor version bump to `@dna-codes/dna-schemas`. If the field shape change is breaking (removing a field, changing a field type, renaming a field), it MUST be a major version bump. This creates a direct, auditable link between primitive-level `version` values and package semver — consumers can determine from the package version alone whether any stored primitives need migration.

`version` is the handle migration scripts use to find nodes that need transformation. Mixed-version state is a transitional window, not a permanent coexistence model.

**Alternative considered:** Maintain computed canonical properties across versions (e.g., always write `is_active: boolean` regardless of version). Rejected — adds ongoing maintenance burden and doesn't eliminate the migration need; it only defers it.

### D5: Builders auto-assign `id`, `type`, `version`

Each `add*` builder stamps the three new required base fields when not supplied by the caller:

- `id`: `crypto.randomUUID()` (Node built-in since 18, no extra dep)
- `type`: hardcoded per builder (`addResource` always stamps `"resource"`, etc.)
- `version`: a module-level constant exported from a new `src/version.ts` in `dna-core` (e.g. `"1"`)

Callers who supply their own `id` (e.g., re-ingesting an existing document) have it respected.

**Alternative considered:** Require callers to always supply all base fields. Rejected — authoring ergonomics matter; UUIDs should be invisible when building DNA from code.

### D6: TypeScript base type via interface extension

```ts
// types/operational.ts
export interface BasePrimitive {
  id: string
  type: string
  name: string
  version: string
  description?: string
}

export interface Resource extends BasePrimitive {
  type: 'resource'    // narrowed
  attributes?: Attribute[]
  actions?: Action[]
  // ...
}
```

`OperationalDNA` in `types/merge.ts` keeps `unknown[]` for its arrays — the cast pattern used by queries is unchanged.

## Risks / Trade-offs

- **[Risk] Breaking change to all existing DNA documents** — any document without `id`, `type`, `version` will fail schema validation. → **Mitigation**: Migrate all `examples/` and `bookshopInput` as part of this change. Input adapters that use builders get auto-assignment for free; adapters that construct raw JSON must be updated manually.
- **[Risk] `unevaluatedProperties` AJV support** — AJV requires `ajv-formats` for `format: "uuid"` checks; `unevaluatedProperties` itself is supported in AJV 8+ (already in use). → **Mitigation**: Add `ajv-formats` to `@dna-codes/dna-core`; test updated schemas against AJV before shipping.
- **[Trade-off] `version` as a shared per-type version** — doesn't give fine-grained per-field evolution history. Acceptable for now; per-field versioning can layer on top later if needed.
- **[Trade-off] No UUID cross-referencing** — primitives still reference each other by name string. UUID-based linking is deferred to the Neo4j adapter.

## Migration Plan

1. Update `@dna-codes/dna-schemas` — add `base-primitive.json`, update all 11 Operational primitive schemas (`allOf` + `unevaluatedProperties`), bump minor version.
2. Update `@dna-codes/dna-core` types — add `BasePrimitive` interface, extend all per-primitive interfaces.
3. Update `@dna-codes/dna-core` builders — add auto-assignment of `id`, `type`, `version`; add `src/version.ts` constant.
4. Migrate `examples/` JSON documents — add `id`, `type`, `version` to every primitive in all 6 example domains.
5. Migrate `bookshopInput` fixture.
6. Run full test suite — confirm all tests pass; update any tests that assert on primitive shapes.
7. Bump `@dna-codes/dna-schemas` minor version, `@dna-codes/dna-core` minor version.

Rollback: revert commits to both packages; no runtime state to undo.

## Open Questions

- **Q1**: Should `id` use `format: "uuid"` validation in AJV (requires `ajv-formats`)? Leaning yes — the format check is meaningful and `ajv-formats` is a small dep.
- **Q2**: Should `name` keep its per-primitive pattern constraints (e.g., `^[A-Z][a-zA-Z0-9]*$` for Resource) in the per-primitive schema? Leaning yes — `name` patterns differ by primitive (kebab-case for Task, PascalCase for Resource) so they can't be unified in base-primitive.json.
