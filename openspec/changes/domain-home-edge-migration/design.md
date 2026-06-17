## Context

`operational/domain.json` today is a recursive container: a `Domain` nests child `domains[]` and owns four member arrays (`resources`/`persons`/`roles`/`groups`), with an authoritative `path` string. The `grouping-model` doctrine inverted this: a node's home is its *primary `belongs_to` edge to a `Domain`*, domains form a *web* (overlap is a law), and `path` is a *derived cache*. The containment model can only express a single-home *tree*, so it structurally contradicts the doctrine and double-books membership (the member array **and** primitive `domain`/`path` fields).

Current consumers of the containment shape:
- **Schema:** `operational/domain.json` (arrays + nested `domains` + `path`); `operational/operational.json` document schema.
- **Core:** `types/operational.ts` `Domain`; `types/merge.ts` `OperationalDNA.domain`; `builders/create.ts`; `validator.ts` (`walk(op.domain)` recurses `domains` and collects `resources`/`persons` for cross-layer checks).
- **Adapters:** `integration/memory` + `integration/neo4j` `seedFromDna`, both walking `NOUN_KEYS` over `dna.domain.{resources,persons,roles,groups}` to seed tenant `ResourceType`s.
- **API:** `schema/naming.ts` reads `dna.domain.persons[]`.
- **Examples:** seven `operational.json` documents nest nouns under the domain.

## Goals / Non-Goals

**Goals:**
- Make `Domain` a thin, identity-bearing node (`name`, `description?`, `owner?`, `parent?`); remove the four containment arrays and inline `domains` nesting.
- Promote `resources`/`persons`/`roles`/`groups` type definitions to **top-level document collections**, each primitive naming its home `domain`.
- Express the domain hierarchy with a flat `domains[]` + `parent` references; the root (no parent) is the tenant.
- Demote `path` to a derived, optional cache.
- Repoint `seedFromDna` (both adapters) and every other consumer at the new shape; migrate the seven example documents.

**Non-Goals:**
- Instance-level enforcement of the `belongs_to[primary]` cardinality-1 edge and runtime `path` regeneration on re-home (instance/runtime behavior owned by the grouping/lens runtime).
- Any new grouping/lens evaluation code (`grouping-model` + `runtime-lens-mechanism` already own that).
- Changing the grammar primitives, thematic roles, or vocabulary distribution.

## Decisions

### Decision 1 — Primitives become top-level collections with a `domain` home reference

Move `resources`/`persons`/`roles`/`groups` from `Domain` member arrays to top-level `OperationalDNA` collections, matching the existing top-level `operations`/`triggers`/`rules`/`tasks`/`processes`. Each primitive declares `domain: "<home domain name>"` — the authored form of the primary `belongs_to` edge.

- *Alternative — author `belongs_to` edges directly in `relationships[]`:* truer to the instance model but verbose and redundant with the existing primitive `domain` field (Operation/Trigger already carry one). A single `domain` reference per primitive is the lighter authored form and round-trips to a `belongs_to[primary]` edge at instance time.
- *Alternative — keep nouns nested but flatten to one level:* still a container; still single-home. Rejected — it doesn't remove the double-booking the doctrine forbids.

### Decision 2 — `parent` reference replaces nested `domains[]`

`Domain` gains optional `parent: "<parent domain name>"`; the document carries a flat `domains[]`. The hierarchy is the parent-edge chain. Exactly one domain has no `parent` — the tenant root.

- *Alternative — keep nested `domains[]`:* literal structural nesting is "structure outside the graph" and re-introduces the single-home tree. Rejected.

### Decision 3 — `path` is derived and optional

`path` stays in the schema as an optional string but is documented as a derived cache of the `parent` chain; nothing authoritative reads it for tree placement. Validation/derivation helpers compute it from `parent`. We keep the field (not delete it) so the cache has a home and existing prefix-filter call sites keep working.

### Decision 4 — `seedFromDna` reads the top-level collections; identical mapping otherwise

Both adapters keep `NOUN_KEYS` (the `key → category` mapping) but read each `key` from the **document root** rather than from `dna.domain`. Foundational types and `relationships[]`-derived relationship types are untouched. This is a source-pointer change, not a logic change, keeping the two adapters in lock-step.

### Decision 5 — Hard cutover, no compat shim

Per the proposal's **BREAKING** framing and the "full migration" scope, the old containment arrays are removed outright (schema `additionalProperties: false` already rejects unknown keys, so legacy documents fail loudly rather than silently mis-seeding). All in-repo examples and fixtures are migrated in the same change so the test suite proves the new shape end-to-end.

## Risks / Trade-offs

- **External documents using the old shape break.** → Acceptable and intended (BREAKING); the schema rejects them clearly. A one-shot codemod (nest→flatten) is offered in tasks as a migration aid, not shipped as runtime compat.
- **`validator.ts` cross-layer walk assumes nested collection.** → Rewrite the walk to read top-level collections; cover with the existing cross-layer validator tests plus a migrated example.
- **Two adapters can drift.** → Make the identical edit to both `seedFromDna` noun-discovery blocks in the same change; assert with an adapter seeding test per backend.
- **Derived `path` correctness.** → Add a small `derivePath(parent chain)` helper with unit tests; treat any authored `path` as advisory.

## Migration Plan

1. Land the schema changes (`domain.json` thin node + `parent`/`owner`; `operational.json` top-level noun collections; primitive base gains `domain`).
2. Update core types (`Domain`, `OperationalDNA`), `createOperationalDna`, and the validator walk.
3. Repoint both `seedFromDna` adapters; update `naming.ts`.
4. Migrate the seven example `operational.json` documents (and any fixtures) with a codemod, then hand-verify.
5. Run the full workspace test suite; fix fallout.

Rollback: revert the change set; no persisted data migration is implied (this is descriptor-shape only — instance graphs are unaffected).

## Open Questions — RESOLVED at apply

- **Primitive `domain` reference = domain name, not path.** Confirmed **name** (stable under re-home; `path` is a regenerable cache). `naming.ts` does not read the domain reference — it only does `Person → persons` pluralization — so there is no constraint pulling toward `path`.
- **Full consumer set (pre-apply sweep, `packages/` + `engine/`):**
  - `packages/core/src/validator.ts:287` — `walk(op.domain)` recurses nested `domains` and collects `resources`/`persons`.
  - `packages/adapters/src/integration/memory/client.ts` (~242) and `…/neo4j/client.ts` (~333) — `seedFromDna` walks `NOUN_KEYS` over `dna.domain.{resources,persons,roles,groups}`.
  - `packages/core/src/fixtures/bookshop.ts` — authors the nested `domain.{resources,persons,roles,groups}` shape (canonical adapter-test fixture).
  - `examples/{education,healthcare,lending,manufacturing,marketplace,mass-tort,registry}/operational.json` — 7 nested documents.
  - `packages/api/src/schema/naming.ts` — **comment only**; no runtime read of the domain arrays (task 5.4 is a comment refresh, not a logic change).
  - **No `engine/` consumers** read `dna.domain.{resources,persons,roles,groups}`.
