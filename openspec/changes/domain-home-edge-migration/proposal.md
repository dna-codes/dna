## Why

The `grouping-model` doctrine (`openspec/specs/grouping-model/spec.md`) settled that a node's home is its **primary `belongs_to` edge to a `Domain` node** and that the dot-separated `path` is a **derived cache**, not an authoritative field. The schemas still encode the *old* model: `operational/domain.json` nests primitives inside per-domain containment arrays (`resources`/`persons`/`roles`/`groups`) and an authoritative `path`, which forces single-home and contradicts the doctrine's "overlap is a law." This change is the deferred migration that `groupings-as-anchored-queries` named — it brings the authored operational model in line with the doctrine end-to-end.

## What Changes

- **BREAKING — drop the containment arrays** (`resources`, `persons`, `roles`, `groups`) from `operational/domain.json`. Primitive *type definitions* move to **top-level document collections** (`resources[]`, `persons[]`, `roles[]`, `groups[]`), mirroring how `operations`/`triggers`/`rules`/`tasks`/`processes` already live at the top level.
- **BREAKING — replace nested `domains[]`** with a flat top-level `domains[]` list of thin `Domain` nodes, each naming its `parent` domain (the domain tree expressed as parent edges, not literal nesting).
- **Home as a reference.** Each primitive carries a `domain` field naming its home `Domain` (the authored form of the primary `belongs_to` edge). `Domain` becomes a thin, identity-bearing node: `name`, `description`, optional `owner`, optional `parent`.
- **Demote `path`** from an authoritative property to a **derived, optional** cache regenerated from the `parent` chain — never authored as the source of truth.
- **Move the seed source.** `seedFromDna` (memory + neo4j adapters) discovers tenant `ResourceType`s from the new top-level collections instead of walking `dna.domain.{resources,persons,roles,groups}`.
- **Migrate consumers:** the `Domain` / `OperationalDNA` TS types, `createOperationalDna` builder, the cross-layer validator's domain walk, the api `naming.ts` pluralization source, and all seven example operational documents.

## Capabilities

### New Capabilities

- `domain-home-model`: The operational document represents domain membership as a per-primitive `domain` home reference plus a flat set of thin `Domain` nodes with `parent` edges — not nested containment arrays. `path` is a derived cache. Type definitions live in top-level collections, and seeding reads them there.

### Modified Capabilities

<!-- None at the requirement level. This change implements the existing
     `grouping-model` doctrine; it does not alter that spec's requirements. -->

## Impact

- **`@dna-codes/dna-schemas`** — `operational/domain.json` (containment arrays + nested `domains` removed; `path` demoted; `parent`/`owner` added); the top-level `operational.json` document schema gains `resources`/`persons`/`roles`/`groups` collections.
- **`@dna-codes/dna-core`** — `types/operational.ts` (`Domain`), `types/merge.ts` (`OperationalDNA.domain` + top-level collections), `builders/create.ts`, `validator.ts` (domain walk).
- **`@dna-codes/dna-adapters`** — `integration/memory` and `integration/neo4j` `seedFromDna` noun-discovery source.
- **`@dna-codes/dna-api`** — `schema/naming.ts` (reads `dna.domain.persons[]`).
- **Examples** — `examples/{education,healthcare,lending,manufacturing,marketplace,mass-tort,registry}/operational.json`.
- **Out of scope:** instance-level enforcement of the `belongs_to[primary]` cardinality-1 edge and runtime `path` regeneration on re-home — that is instance/runtime behavior owned by the grouping/lens runtime, not the authored-descriptor migration here.
