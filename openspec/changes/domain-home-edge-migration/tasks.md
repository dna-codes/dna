## 1. Consumer sweep (pre-cutover)

- [x] 1.1 Grep `packages/` and `engine/` for every reader of `dna.domain.{resources,persons,roles,groups}`, nested `domains`, and authoritative `path`; record the full consumer set in `design.md` Open Questions.
- [x] 1.2 Confirm the primitive home reference is the domain **name** (not path) against `naming.ts` expectations; record the decision.

## 2. Schema changes (`@dna-codes/dna-schemas`)

- [x] 2.1 `operational/domain.json`: remove `resources`/`persons`/`roles`/`groups` and the nested `domains` array; add optional `parent` (parent domain name) and `owner`; keep `path` as optional + documented as a derived cache. Update `description` and `examples`.
- [x] 2.2 `operational/operational.json` (document schema): add top-level `resources[]`/`persons[]`/`roles[]`/`groups[]` collections and a flat `domains[]` of thin `Domain` nodes.
- [x] 2.3 Add a `domain` home-reference property to the noun primitives (`resource`/`person`/`role`/`group`) — or to the shared base — so every primitive can name its home. (Field already present on all four nouns; re-specified from "dot-separated path" to a home-by-`name` reference.)
- [ ] 2.4 Schema tests: a thin `Domain` validates; a `Domain` carrying any container array or nested `domains` is rejected; a top-level noun with a `domain` reference validates.

## 3. Core types & helpers (`@dna-codes/dna-core`)

- [x] 3.1 `types/operational.ts`: make `Domain` thin (`name`, `description?`, `owner?`, `parent?`); drop the member-array fields; ensure noun types carry `domain?`.
- [x] 3.2 `types/merge.ts`: move `resources`/`persons`/`roles`/`groups` from `OperationalDNA.domain` to top-level `OperationalDNA` collections; make `domain` the thin node; keep `domains?: unknown[]` flat.
- [x] 3.3 `builders/create.ts` + any `add*` builders: write primitives to the top-level collections with a `domain` reference instead of nesting them under `dna.domain`.
- [x] 3.4 Add a `derivePath(domainName, domainsByName)` helper that computes `path` from the `parent` chain; unit-test it (including a stale authored `path` being overridden).

## 4. Validator (`@dna-codes/dna-core`)

- [x] 4.1 Rewrite `validator.ts` `walk(op.domain)` to collect nouns from the top-level collections (resolving each primitive's home via its `domain` reference) instead of recursing nested `domains`.
- [x] 4.2 Update/extend cross-layer validator tests to the new shape.

## 5. Seeding & API consumers (`@dna-codes/dna-adapters`, `@dna-codes/dna-api`)

- [x] 5.1 `integration/memory` `seedFromDna`: read `NOUN_KEYS` from the document root, not `dna.domain`. Keep foundational + `relationships[]` seeding unchanged.
- [x] 5.2 `integration/neo4j` `seedFromDna`: identical edit, kept in lock-step with memory.
- [x] 5.3 Per-adapter seeding test: a top-level `resources[]` noun seeds as a `ResourceType`; a legacy `dna.domain.resources[]`-only document seeds nothing. (memory adapter — added both cases, green.)
- [x] 5.4 `api/schema/naming.ts`: source pluralization from the top-level `persons[]` collection. (comment-only — no runtime read.)
- [x] 5.5 `input/json` adapter (writer): emit nouns to top-level `resources[]` instead of `domain.resources` (discovered consumer).

## 6. Migrate examples & fixtures

- [x] 6.1 Write a one-shot codemod that flattens a nested operational document (nouns → top-level with `domain`; nested `domains` → flat + `parent`; drop authored `path` or mark derived).
- [x] 6.2 Run it over `examples/{education,healthcare,lending,manufacturing,marketplace,mass-tort,registry}/operational.json`; hand-verify each against the new schema.
- [x] 6.3 Migrate any in-repo fixtures (`packages/core/src/fixtures/*`, engine fixtures) that author the nested shape.

## 7. Verify

- [ ] 7.1 Run the full workspace test suite (`packages/` + `engine/`); fix fallout from the consumer sweep.
- [ ] 7.2 Update `README.md` and any `docs/concepts` text that describes domain containment to the home-reference model.

## 8. Remaining downstream sweep (discovered during apply — paused for review)

The consumer sweep under-counted: many **output renderers** and an **interactive engine editor** walk the nested domain tree. Captured here so the change is resumable.

**Mechanical (packages/):**
- [ ] 8.1 `packages/core/src/merge/merge.test.ts` — migrate nested inputs (`domain:{ name, resources:[…] }`) → top-level; update `result.dna.domain.<noun>` assertions → `result.dna.<noun>` (~17 cases).
- [ ] 8.2 `packages/core/src/builders/builders.test.ts` — same migration for builder fixtures/assertions.
- [ ] 8.3 `packages/core/src/validator.test.ts` — cross-layer tests author nested operational docs; flatten them.
- [ ] 8.4 Adapter output collectors — read top-level nouns instead of walking `domain.{resources,domains}`: `output/markdown/sections/{domain-model,summary}.ts`, `output/html/sections/{domain-model,summary}.ts`, `output/mermaid/util.ts`, `output/text/index.ts`, `output/example/util.ts`, `integration/example/mapping.ts`; update their tests (some assert `# shop.books` title from the now-dropped bookshop `path`).

**Substantial (engine/) — candidate follow-on change:**
- [ ] 8.5 `engine/cba/src/primitives.ts` — domain-tree walk.
- [ ] 8.6 `engine/cba-viz/src/features/{operational-persistence,operational-mutations}.ts` — the visual editor's data model **is** the nested domain tree (insert/move/delete within `domain.domains`/`domain.resources`). Re-modeling onto the flat home-edge shape is a non-mechanical rewrite; recommend its own change (`cba-viz-home-edge-model`).
