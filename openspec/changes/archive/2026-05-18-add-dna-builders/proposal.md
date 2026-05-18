## Why

Three places in the codebase already construct Operational DNA programmatically — `merge()` in `dna-core`, the layered constructor in `input-text`, and the inference walker in `input-json` — and each one rolls its own assembly logic. The shapes drift, the validation is inconsistent (some paths trust the LLM/source, some don't), and adding any new noun/activity primitive requires editing every consumer. There is no canonical, types-aware, schema-enforced way to say "add this Resource to a DNA" — even though every consumer wants exactly that. Surfaced from the `add-dna-ingest` change, where `merge()` ended up reimplementing object construction by hand.

## What Changes

- **NEW** `@dna-codes/dna-core` exports a builder API: `addResource`, `addPerson`, `addRole`, `addGroup`, `addMembership`, `addOperation`, `addTrigger`, `addRule`, `addTask`, `addProcess`, plus a top-level `createDna()` (or equivalent) that returns an empty Operational DNA shell ready to receive primitives.
- **NEW** Builders are pure, immutable functions: each takes a DNA + a primitive spec and returns a new DNA. No mutation of the input. (Fluent / mutable variants are out of scope for v1 — see design.md decision D1.)
- **NEW** Builders enforce the published JSON Schema at the type level: each builder accepts a TS type derived from `@dna-codes/dna-schemas`, so misuse fails at compile time rather than at runtime validation.
- **NEW** Builders enforce the schema at runtime when given untyped input (e.g. JSON parsed at the boundary), catching invalid additions before they pollute the DNA.
- **MODIFIED** `merge()` (in `@dna-codes/dna-core`) — no internal refactor. `merge()` is the composition engine that the builders' `composeInto` helper consumes; the relationship is "builders share the merge engine," not "merge iterates via builders." Public behavior unchanged. (See design.md D2 for why the literal "merge orchestrates over add*" framing produces infinite recursion and was dropped.)
- **MODIFIED** `@dna-codes/dna-input-json` is refactored to use the builders for its assembly walker. Public adapter signature unchanged.
- **MODIFIED** `@dna-codes/dna-input-text`'s layered constructor is refactored to back its `DraftDocument` shape with the builder API. **BREAKING (minor)**: the `duplicate_name` tool-call error code goes away — same-named tool calls now compose via the builder rather than rejecting. The constructor's `result()` gains a `conflicts` field surfacing composed-on-add scalar disagreements. Every other guard rail is preserved.
- **NEW** Documentation: `packages/core/docs/builders.md` plus a usage section in `packages/core/README.md`. Forking guidance for new `input-*` packages updated to recommend the builders.

**Out of scope** (deferred): Product-layer / Technical-layer builders (separate change once those layers stabilize), a DSL or chainable fluent API on top of the builders, a `dna-cli build` command.

## Capabilities

### New Capabilities

- `dna-builders`: A canonical, pure, types-aware builder API in `@dna-codes/dna-core` for programmatically composing Operational DNA documents. Covers every Operational primitive (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process) plus the top-level DNA shell. Replaces ad-hoc assembly in `merge()`, `input-json`, and `input-text/layered/constructor`. Compile-time + runtime schema enforcement.

### Modified Capabilities

<!-- None.

The merge utility's *requirements* are unchanged — its internal implementation
swaps to using the builders, but observable behavior (identity-by-name unification,
conflict reporting, cross-reference resolution, provenance) is preserved exactly.
The input-* packages' adapter contracts are also unchanged — they still consume the
same inputs and produce DNA validating against the same schemas. So this is a
pure-addition change at the requirement level. -->

## Impact

- **`@dna-codes/dna-core`**: gains the builder module + types. Backwards-compatible — pure addition. **Patch** bump (0.5.0 → 0.5.1) — staying within the 0.5.x line so siblings declaring `^0.5.0` accept the new version automatically with no cascade. Per-semver-strict the addition would justify a minor; chosen patch to minimize release churn pre-1.0.
- **`@dna-codes/dna-input-json`**: internal refactor to consume the builders. Backwards-compatible at the public adapter level. Patch bump (0.4.1 → 0.4.2).
- **`@dna-codes/dna-input-text`**: refactor of `layered/constructor.ts` to use the builders. Drops the `duplicate_name` tool-call error code; surfaces composed-on-add conflicts via `result()`. Per-semver-strict the LayeredConstructor change would be a minor breaking bump, but no external consumer uses `LayeredConstructor` directly (jira goes through `parse()`, which is unaffected) — patch bump (0.4.1 → 0.4.2) is defensible pre-1.0. The `duplicate_name` removal is documented in the changelog.
- **`@dna-codes/dna-schemas`**: no schema changes. Builders consume the existing schema types.
- **Other consumers** (output-*, integration-*, dna-ingest): no required changes. They never construct DNA, only consume it.
- **Dev/CI**: existing publish workflow handles the version bumps already; no workflow changes.
- **README**: builders mentioned as part of the dna-core API surface.
