## Context

Three places in the codebase already build Operational DNA programmatically and each uses a different shape:

- **`merge()` in `@dna-codes/dna-core`** (added in `add-dna-ingest`) constructs the merged DNA by direct property assignment on a `mergedDomain: Record<string, unknown>` and a `mergedDna: OperationalDNA` object, then recursively merges per-primitive children with hand-rolled `mergeObject`/`mergeArray` helpers.
- **`@dna-codes/dna-input-json`** walks input JSON, accumulates `ParsedResource` / `ParsedRelationship` records in `Map<string, ...>` structures, and emits an Operational DNA at the end via direct object literals.
- **`@dna-codes/dna-input-text`'s layered constructor** maintains a `DraftDocument` shape with explicit `domain.resources: unknown[]`, `memberships: unknown[]`, `operations: unknown[]`, etc., and adds tool-call results into those arrays imperatively.

Each path validates the result differently: input-text validates the final DNA, input-json doesn't, merge doesn't. Each path has its own concept of "the Loan resource exists already; merge into it." Nothing today gives a developer a one-liner that means "add this Resource to this DNA, type-checked, schema-enforced."

The DNA JSON schema is the contract; `@dna-codes/dna-core` ships the typed schema bindings + validator. Builders are the missing piece between "I have a Resource I want to add" and "I have a valid OperationalDNA."

## Goals / Non-Goals

**Goals:**

- One canonical builder module exported from `@dna-codes/dna-core` covering every Operational primitive (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process) plus a top-level DNA factory.
- TypeScript types for builder inputs derived from `@dna-codes/dna-schemas` (so misuse fails at compile time, not just at runtime validation).
- Pure, immutable functions: each builder returns a new DNA; the input is untouched. Safe to use with `merge()` (already pure).
- Idempotent `add*` semantics: adding a same-named primitive merges with the existing one using the same rules `merge()` uses internally — never silent overwrite.
- Runtime schema enforcement at the boundary: `addResource(dna, untypedJson)` validates against the published JSON Schema before composing.
- `merge()`, `input-json`, and `input-text/layered/constructor` are refactored in this same change to consume the builder API. Behavior unchanged from each consumer's external contract.

**Non-Goals:**

- Product-layer / Technical-layer builders. Those layers are still evolving; revisit once they stabilize.
- A fluent / chainable / mutable builder DSL. Pure-immutable is enough for v1; if a fluent API turns out to be useful, it can layer on top later as a separate export.
- A `dna-cli build` command. Library-first; CLI lands when the shape stabilizes.
- "Smart" builders that infer fields the caller didn't provide. Builders are surface-area helpers, not LLM tools — input that's missing required fields is rejected.
- Cross-layer refactors of every consumer everywhere. We retrofit the three internal consumers (`merge`, `input-json`, `input-text/layered/constructor`); other consumers (`integration-jira`, examples, `dna-ingest`) don't construct DNA and don't need touching.

## Decisions

### D1: Pure immutable builders, not fluent / mutable

```ts
const dna1 = createOperationalDna({ name: 'lending' })
const dna2 = addResource(dna1, { name: 'Loan', attributes: [...] })
// dna1 unchanged; dna2 is a new DNA
```

Each builder takes a DNA + a primitive and returns a new DNA.

**Why:** `merge()` is already a pure value transformation. `input-json` is a one-shot walker that emits at the end — pure builders compose naturally there. The layered constructor maintains a `DraftDocument` between tool calls — pure builders + a single re-assignment per tool call (`draft = addResource(draft, ...)`) is barely more code than the current imperative `draft.domain.resources.push(...)` and gets us referential transparency.

**Alternatives considered:**

- **Fluent / chained API**: `dna.addResource(...).addPerson(...)`. Rejected for v1. Requires either a wrapper class (gives up structural typing) or proxy-based magic. Easy to add later as a thin wrapper if it's actually wanted.
- **Mutable in-place builders**: `addResource(dna, ...)` mutates `dna`. Rejected. Breaks `merge()`'s purity guarantee, makes the layered constructor racy if tool calls ever go concurrent, hostile to anyone trying to test.

**Trade-off:** Each retrofit site does `draft = addResource(draft, ...)` instead of `draft.domain.resources.push(...)`. Trivially more verbose; that's the price of immutability. Compilers / minifiers handle the structural sharing fine.

### D2: Builders own merge-on-add; consumers stop replicating dedup logic

```ts
addResource(dna, { name: 'Loan', attributes: [{ name: 'amount', ... }] })
// Returns: { dna, conflicts }
//
// If `Loan` already exists, the new Resource is composed into it using the
// rules merge() applies: list-shaped children union by name; scalar
// disagreements emit Conflict entries with the v1 recommendation policy.
// The composed Resource is written into the merged DNA so the result is
// always schema-valid.
//
// Builders never throw on duplicate names. Same-name == same-identity ==
// compose. Consumers who want a hard "this is a new name" guarantee should
// pre-check by walking the existing DNA themselves.
```

**Why:** Three places in the codebase already implement their own duplicate-handling — `merge()` does per-primitive identity-by-name composition, `input-json`'s walker maintains a `Map<name, Resource>` plus a per-attribute `seen` set, and the layered constructor pre-checks duplicate names before pushing. Three places, three subtly-different answers. Centralizing the merge-on-add semantics in the builders means each consumer can drop its custom dedup code and trust the builder.

**Architecture:** the builders' `composeInto` helper delegates to `merge()` to do the actual composition. So `merge()` IS the composition engine; builders are the user-facing API on top of it. After the retrofits:

- `merge()` retains its existing N-way merge logic (source-count → recency → string-length → stable order recommendation policy depends on seeing all chunks together; pairwise reduction would lose the source-count semantic). No internal change required from this proposal — `merge()` already shares the engine that builders consume via `composeInto`.
- `input-json`'s walker drops its `Map` and `seen` set; emits attributes one at a time via `addResource(dna, { name, attributes: [oneAttr] })`.
- The layered constructor drops its `duplicate_name` pre-check; an LLM re-emitting the same Resource with new attributes silently composes (which is correct), and conflicting scalars surface as conflicts in the constructor's result. Iteration cap (`maxToolCalls`) backstops any LLM that loops forever re-declaring the same primitive.

**An earlier framing of this design said "merge() becomes an orchestrator over the add* builders."** That framing was aspirational — having `merge()` literally call `addX` per primitive in its emit phase would create infinite recursion (`addX` → `composeInto` → `merge()` → `addX` → …) unless we extracted a separate non-merge pairwise composition helper. The recursion-breaking refactor is real work and produces no observable benefit (same tests pass either way); the actual relationship between merge and builders is cleaner expressed as "they share a composition engine via `composeInto`'s delegation." Tasks have been adjusted to reflect this.

**Return shape:** every builder returns `{ dna, conflicts }`. Always. No `*Unsafe` variant — there's no scenario where a caller should silently discard conflicts that were genuinely produced. Callers who don't care about conflicts can destructure `{ dna }` and ignore the rest; conflicts cost nothing to allocate when they're empty (the common case).

**Implementation:** `addResource(dna, resource)` delegates internally to `merge([dna, { domain: { name: dna.domain.name, resources: [resource] } }])`, plumbing the result back out as `{ dna, conflicts }`. Initial pass keeps it that direct; if per-call cost matters in profiling, optimize later.

**Loss:** the layered constructor's existing `duplicate_name` early-failure signal goes away. Acceptable because (a) merging is correct, not wrong, when the LLM re-declares; (b) `maxToolCalls` still catches infinite-loop pathology; (c) any conflict the LLM introduces by re-declaring will surface in the result, so it's not silent.

### D3: Compile-time types from `@dna-codes/dna-schemas`

The schemas package ships JSON Schema files. We don't currently auto-generate TS types from them — the validator works against the runtime JSON. For builders, we need TS types that reflect the schema.

**Approach:** Hand-write TS types for each Operational primitive in `packages/core/src/types/operational.ts` (or co-locate next to each builder). Keep them in sync with the JSON Schemas via tests that round-trip example data through both.

**Alternative considered:** Auto-generate TS types from JSON Schema (e.g. via `json-schema-to-typescript`). Rejected for v1 — adds a build step, the generator's output is verbose, and the Operational schemas are small enough to maintain by hand. Revisit if the schema set grows.

**Why:** Compile-time safety is the headline value-add of builders over raw object-literal construction. Without it, builders are just nice-named wrappers around `dna.domain.resources.push(...)`. With it, the call site gets autocomplete on every primitive shape and the wrong field-name fails at build.

### D4: Runtime validation default-on, opt-out

```ts
addResource(dna, resource)                       // validates against schema; default
addResource(dna, resource, { validate: false })  // opt-out for hot paths (e.g. merge() emit loop)
```

Default behavior: validate every primitive against the published JSON Schema before composing. Callers in hot paths or who already know their input is valid opt out via `{ validate: false }`.

**Why default-on:** TS types are an under-approximation of the real schema. Patterns like `Operation.action`'s `^[A-Z][a-zA-Z0-9]*$` and `Attribute.values` (required when `type === 'enum'`) aren't expressible in plain TS, so a TS-typed call can still produce schema-invalid DNA. Default-on validation catches those without every caller having to remember.

**Why opt-out exists:** `merge()` after the retrofit emits hundreds of primitives in a tight loop. Each primitive came from a chunk that was either schema-valid by construction (merge()'s pre-condition) or already validated upstream by the input adapter that produced it. Validating every primitive again on emit is wasted cycles. `merge()` opts out via `{ validate: false }`; everyone else stays on the default.

**Why this differs from the original framing:** The original "opt-in" framing assumed TS types + author discipline are enough at most call sites. They're not — schema-only invariants slip through. Defaulting to validation makes the safe path the easy path.

### D5: Builder location and file structure

```
packages/core/src/builders/
  index.ts              ← public re-exports
  create.ts             ← createOperationalDna()
  resource.ts           ← addResource()
  person.ts             ← addPerson()
  role.ts               ← addRole()
  group.ts              ← addGroup()
  membership.ts         ← addMembership()
  operation.ts          ← addOperation()
  trigger.ts            ← addTrigger()
  rule.ts               ← addRule()
  task.ts               ← addTask()
  process.ts            ← addProcess()
  shared.ts             ← merge-on-add helper, validation harness
```

Each builder is its own file so imports tree-shake cleanly and the test layout mirrors source 1:1.

**Why:** Mirrors how `merge` is laid out (`packages/core/src/merge/`) and how the schema package organizes per-primitive JSON files.

### D6: Refactor target — start with `merge()`, then input-json, then layered constructor

Order matters. `merge()` is the most disciplined consumer (well-tested by 18 spec scenarios, pure value transform). Refactoring it first proves the builder API: if the merge tests still pass after merge() is rebuilt as a thin orchestrator over `add*` calls, the builder API is good enough for the rest. `input-json` next — straightforward walker that emits attributes one at a time after the retrofit. `input-text/layered/constructor.ts` last because it's the most stateful and behaviorally subtle (tool-call lifecycle, finalize-retry, transcript bookkeeping).

**Acceptance criterion for each retrofit:** every existing test for that consumer passes unchanged. No behavioral regressions; no public API changes. (Exception: the layered constructor's tool-call response shape *may* gain a `conflicts` field surfacing same-name compositions — see D2. If a test asserts the absence of that field, the test is updated; if a test asserts the `duplicate_name` error code, that test is removed because the behavior is intentionally gone.)

**What changes vs. today:**

| Consumer | Before | After |
|---|---|---|
| `merge()` | Bespoke per-primitive merge logic in `merge.ts` | Unchanged internally — `merge()` is the composition engine builders consume via `composeInto`. Test suite verifies behavior is preserved end-to-end. |
| `input-json` walker | `Map<name, Resource>` + per-attribute `seen` set | `addResource(dna, { name, attributes: [oneAttr] })` per scalar key — no manual dedup |
| Layered constructor | Pre-check `duplicate_name` → push to draft array | `draft = addResource(draft, args).dna` — duplicates compose, conflicts surface in `result()` |

**Why:** Builders' value is only realized when consumers use them. If we ship the API and don't retrofit, the abstractions drift again immediately. Coherent unit: builders + retrofits + verification all in one change.

### D7: Versioning & release — patch-only

- `@dna-codes/dna-core` 0.5.0 → **0.5.1** (additive: builders + types). Per-semver-strict an addition justifies minor; we deliberately stay patch within the 0.5.x line so every sibling declaring `^0.5.0` picks it up with zero cascade.
- `@dna-codes/dna-input-json` 0.4.1 → **0.4.2** (internal refactor; public API unchanged).
- `@dna-codes/dna-input-text` 0.4.1 → **0.4.2** (LayeredConstructor changes — `duplicate_name` removed, `result()` shape updated). Pre-1.0 patch is defensible because no external consumer uses `LayeredConstructor` directly (jira's `parse()` path is unaffected); changelog documents the constructor-level change.
- `@dna-codes/dna-integration-jira`: no change. Stays on its existing `^0.4.0` input-text dep range (which accepts 0.4.2) and its existing `0.4.0` version. Verified: jira consumes input-text via `parse()` and `ParseResult` only — none of the LayeredConstructor changes affect those.
- All other workspaces depending on `@dna-codes/dna-core`: **no change**. Their existing `^0.5.0` dep range accepts `0.5.1`; nothing to bump.

Tag `v0.5.1`.

**Why:** This is the practical answer to the cascade pain. Earlier drafts of D7 mirrored the `add-dna-ingest` release pattern (cascade across every sibling). After explore-mode discussion of consolidation vs v1.0 vs cascade-automation, the user chose the simplest path: keep dna-core within 0.5.x. Pre-1.0 caret semantics are restrictive (`^0.5.0` rejects 0.6.0 but accepts 0.5.1), so staying patch eliminates the cascade. The trade-off — adding new public API (builders) under a patch number — is acceptable pre-1.0 and documented in the changelog.

**Future:** When `dna-core` next has a genuinely breaking change, cut a real minor (0.6.0) and pay the cascade tax that one time, OR cut v1.0.0 and adopt strict semver going forward (so future minor bumps don't cascade). That's a separate decision.

## Risks / Trade-offs

- **[Risk]** Builder API design churn after first use. → **Mitigation**: ship 0.6.0 marked as "API likely to evolve in 0.7.x" in the README. Consumers depending on builders should pin a minor range. Lock the v1 contract behind the three retrofit sites (merge, input-json, input-text) — if the API survives those, it's good enough to release.
- **[Risk]** Compile-time types drift from the JSON Schemas. → **Mitigation**: ship a contract test in `dna-core` that loads each schema's `examples[]` from the JSON file and asserts each example type-checks against the corresponding builder's input type. If a schema gains a field and the type doesn't, the test fails.
- **[Risk]** Refactoring the layered constructor (`input-text`) regresses the LLM tool-call lifecycle. → **Mitigation**: existing tests in `packages/input-text/src/layered/` are the contract. Don't change them; if any test fails after the refactor, fix the refactor, not the test.
- **[Trade-off]** Every `add*` call now returns `{ dna, conflicts }` instead of just `dna`. Every retrofit site has to thread `conflicts` somewhere. → Accepted; it's the honest shape, and it matches what `merge()` already returns. The escape hatch is `addResourceUnsafe` (or a `.dna`-only flag) for the rare case where callers genuinely don't care.
- **[Trade-off]** Builders are pure-immutable, so the layered constructor pays one structural-sharing cost per tool call. The DNA tree is small (single-digit MB at worst); GC handles it fine. Not a perf concern.

## Migration Plan

1. Land builders + types + tests in `dna-core` (no behavior change yet — builders exist alongside existing code).
2. Refactor `merge()` to consume the builders. All 18 existing merge tests must pass unchanged.
3. Refactor `input-json` walker. All existing input-json tests must pass unchanged.
4. Refactor `input-text/layered/constructor.ts`. All existing layered-constructor tests must pass unchanged.
5. Bump versions per D7.
6. Tag `v0.6.0`. Existing `publish.yml` workflow handles the cascade.
7. Update `packages/ingest/AGENTS.md` to recommend builders for any future input-* package being forked.

**Rollback:** Builders are a pure addition at the public API. If the retrofits break a consumer, revert that consumer's commit and ship 0.5.1 (or 0.4.2 for input-* packages) without touching the builder export. The builder module itself is independently revertable too — unpublish 0.6.0 of dna-core and republish 0.5.1 with the builder folder removed if needed.

## Resolved Questions

The following questions were open in the first draft and have been locked in via the explore-mode walkthrough:

- **Q1 (collision policy)**: ~~Throw vs `{ dna, conflicts }` vs silent overwrite~~. **Resolved**: every builder merges-on-add and returns `{ dna, conflicts }`. Builders own the merge semantics; consumers drop their custom dedup. Never throws on same-name. See D2.
- **Q2 (factory naming)**: ~~`createOperationalDna` vs `createDna({ layer })`~~. **Resolved**: `createOperationalDna(opts)`. Per-layer factories ship as new layers ship; no layer enum is locked in early.
- **Q3 (sub-builders vs inline partials)**: ~~Sub-builders or inline partials?~~ **Resolved**: inline partials matching the JSON shape. Validated by the `input-json` retrofit, which now calls `addResource(dna, { name, attributes: [oneAttr] })` repeatedly to build a Resource one attribute at a time — the inline-partial path is actively used, not just convenient.
- **Q4 (sub-domain placement)**: ~~Always flat or accept a domain path arg?~~ **Resolved**: flat in v1. All three retrofit consumers operate on a flat single-domain. `addResource(dna, r, { domain: 'acme.lending' })` can land later if a real use case appears.

## Open Questions

- **Q5**: Should the layered constructor's `result()` (or its tool-call responses) surface composed-on-add conflicts, or stay silent and let the caller validate at the end? Leaning toward exposing conflicts in `result()` so callers can audit; tool-call responses stay clean to avoid breaking the LLM tool schema.
- **Q6**: Validation default-on cost on the `merge()` retrofit emit loop is unmeasured. Plan: measure with a representative chunk corpus (canonical fixtures) before declaring `validate: false` mandatory in merge(). If the cost is negligible, leave validation on everywhere for safety.
