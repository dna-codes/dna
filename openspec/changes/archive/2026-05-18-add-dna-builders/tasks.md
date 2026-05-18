## 1. Pre-implementation (open questions resolved in design.md)

Q1–Q4 are resolved (see design.md "Resolved Questions"). Q5 (layered constructor surfacing conflicts) and Q6 (validation cost on merge() emit loop) remain — to be answered during implementation.

- [x] 1.1 Surveyed `LayeredConstructor.result()` callers: only one internal caller (`packages/input-text/src/index.ts:110`) and a README example. No downstream package depends on `result()`'s shape. Decision: change `result()` to return `{ document, conflicts }` directly (matches the spec's `result().conflicts` references).
- [x] 1.2 Resolved by 5.7: builders default to `validate: true`; `{ validate: false }` opt-out is wired through `BuilderOptions`. `merge()` does not route through builders, so no validation-cost measurement was needed — the hot-path concern doesn't exist.

## 2. TypeScript types for Operational primitives

- [x] 2.1 Hand-write TS types for each Operational primitive in `packages/core/src/types/operational.ts` (Resource, Person, Role, Group, Membership, Operation, Trigger, Rule, Task, Process), kept in sync with `@dna-codes/dna-schemas`
- [x] 2.2 Add a contract test that loads each schema's `examples[]` from the JSON file and asserts each example type-checks against the corresponding TS type — fails the build if the schema gains a field the type doesn't know about
- [x] 2.3 Re-export the new types from `@dna-codes/dna-core`'s entry point alongside `OperationalDNA`

## 3. Builder module

- [x] 3.1 Create `packages/core/src/builders/` with `index.ts`, per-primitive files, and `shared.ts`
- [x] 3.2 Implement `createOperationalDna(opts)` in `create.ts` returning an empty-but-valid Operational DNA shell
- [x] 3.3 Implement the merge-on-add helper in `shared.ts` (`composeInto`) — delegates to `merge([dna, wrapper])` and unwraps to `{ dna, conflicts }`; drops provenance map
- [x] 3.4 Implement `addResource`, `addPerson`, `addRole`, `addGroup` (noun primitives)
- [x] 3.5 Implement `addMembership`, `addOperation`, `addTrigger`, `addRule`, `addTask`, `addProcess` (activity primitives), plus `addRelationship` (one extra builder beyond the proposal — needed for input-json's walker retrofit; trivially small to include for parity)
- [x] 3.6 Wire default-on runtime validation in `composeInto` — validates input primitive against the relevant schema; throws with concatenated AJV error messages
- [x] 3.7 `{ validate: false }` opt-out wired uniformly through `BuilderOptions`
- [x] 3.8 Re-exported all 11 builders + types from `@dna-codes/dna-core` entry point

## 4. Builder tests

- [x] 4.1 `createOperationalDna` tests (empty case, with description+path, no extra collections)
- [x] 4.2 Per-noun-builder matrix: empty-DNA add, add-distinct, compose-by-name (children union), scalar-disagreement-emits-Conflict, never-throws-on-duplicate
- [x] 4.3 Activity builders covered: addOperation, addTrigger, addRule, addTask, addProcess, addMembership, addRelationship
- [x] 4.4 TS negative tests captured as commented `@ts-expect-error` blocks (uncommenting any block produces a compile error)
- [x] 4.5 Validation tests: enum-without-values throws by default, lowercase action throws, valid input passes, `{ validate: false }` opt-out skips
- [x] 4.6 End-to-end test composes a non-trivial DNA (Loan, Borrower, Employee, BankDepartment, Underwriter, EmployeeUnderwriter membership, two Operations, Trigger, Rule, Task, Process) and asserts `DnaValidator.validate(_, 'operational').valid === true`
- [x] 4.7 No-inline-_provenance/_source regression test included
- [x] 4.8 Never-throws-on-duplicate test covered in 4.2's matrix

## 5. `merge()` shares the engine with builders (no refactor needed)

Resolved in design.md D2 (post-explore): the literal "merge() iterates via add* in its emit step" produces infinite recursion through `composeInto`. The actual architecture is "builders consume the merge engine via `composeInto`'s delegation to `merge()`" — they share the composition logic, just with builders as the user-facing API.

- [x] 5.1 Confirmed: builders' `composeInto` helper delegates to `merge()` for the actual composition. Builders and merge share the same engine.
- [x] 5.2 No internal refactor needed in `merge()`. The N-way merge logic stays — its source-count → recency → length → stable-order recommendation policy depends on seeing all chunks at once; reducing pairwise via builders would lose the source-count semantic and break the `most-sources beats recency` test.
- [x] 5.3 Provenance map construction stays inside `merge()` (unchanged).
- [x] 5.4 Cross-reference resolution stays inside `merge()` (unchanged).
- [x] 5.5 Verified all existing merge tests pass after builders ship — see `npm test --workspace @dna-codes/dna-core`.
- [x] 5.6 N/A — no refactor to round-trip against.
- [x] 5.7 Q6 resolved: builders default to `validate: true` for safety; the spec already documents `{ validate: false }` opt-out for hot paths. `merge()` doesn't go through builders, so no measurement needed.

## 6. Refactor `input-json` to use builders

The walker today maintains `Map<name, ParsedResource>` plus a per-attribute `seen` set; both go away. Walker becomes: emit each scalar key as a single-attribute Resource via `addResource(dna, { name, attributes: [oneAttr] })`. Same-named children compose, attribute-level dedup happens in the builder.

- [x] 6.1 Read existing `input-json` tests; confirmed the contract surface (relationship-emission, array-of-scalars-dropped, resourceNameFromKey override, schema conformance)
- [x] 6.2 Replaced the walker's `Map<name, ParsedResource>` and per-attribute `seen` set with repeated `addResource(dna, { name, attributes: [oneAttr] })` calls on a builder-managed DNA
- [x] 6.3 Relationships emitted via `addRelationship(dna, ...)` — same pattern as resources
- [x] 6.4 17 of 18 existing tests pass unchanged. One test (`honors resourceNameFromKey override`) was passing a lowercase-returning override and silently producing schema-invalid Resources under the old walker; updated to a PascalCase override (the test was asserting a latent bug). Added `@dna-codes/dna-core@^0.5.0` as a runtime dependency; updated package description; bumped to 0.4.2.

## 7. Refactor `input-text/layered/constructor` to use builders

The intentional behavior change: `duplicate_name` as a tool-call error code goes away. An LLM re-emitting a Resource with new attributes silently composes; an LLM re-emitting with conflicting scalars surfaces the conflict in `result()`. Iteration cap (`maxToolCalls`) backstops infinite loops.

- [x] 7.1 Confirmed existing tests' contract surface (40 tests across constructor + parse + tools + index)
- [x] 7.2 Replaced `DraftDocument` with `OperationalDNA`; `dna = addX(dna, args, {validate:false}).dna` per tool call; `accumulatedConflicts: Conflict[]` collects compose-on-add disagreements across the constructor's lifetime
- [x] 7.3 Removed the `duplicate_name` error code from `ToolCallResult` and `checkNameUniqueness()` from the constructor; same-named tool calls now compose via the builder
- [x] 7.4 `result()` now returns `LayeredResult { document, conflicts }`; updated the internal caller (`packages/input-text/src/index.ts:110`) and the README example. Successful `finalize` tool result also gains a `conflicts` field
- [x] 7.5 Preserved: `duplicate_call` (consecutive-signature) check, all `checkReferences` cross-ref guard rails, `handleFinalize` retry/exhaustion behavior, iteration cap, transcript bookkeeping
- [x] 7.6 Two tests updated (the ones that asserted `duplicate_name`): one rewritten to assert compose-on-add union of attributes; one new test added asserting `conflicts` surface scalar disagreements. The `duplicate_call` test tightened from "either `duplicate_call` or `duplicate_name`" to specifically `duplicate_call`. Bumped `dna-input-text` to 0.5.0; bumped `dna-integration-jira` to 0.4.1 with `^0.5.0` input-text dep range.

## 8. Documentation

- [x] 8.1 Wrote `packages/core/docs/builders.md` — surface, compose-on-duplicate semantics, default-on validation + opt-out, TS types contract, relationship to merge(), v1 simplifications, common patterns
- [x] 8.2 Added builders usage section to `packages/core/README.md` linking to docs/builders.md
- [x] 8.3 Updated `packages/ingest/AGENTS.md` — recommends builders for new input-* packages, includes a code example
- [x] 8.4 Updated `packages/input-example/AGENTS.md` — hard-contract section now mentions builders explicitly

## 9. Release

- [x] 9.1 **Patch-only release strategy** (decided in explore mode after weighing v0.6.0 cascade vs v1.0 cut vs consolidation). Bumped `@dna-codes/dna-core` to **0.5.1** and stayed within the 0.5.x line so every sibling declaring `^0.5.0` accepts the new version with no cascade. Reverted the v0.6.0-era cascade bumps on input-openapi, output-html/markdown/mermaid/openapi/text, ingest — these stay at 0.4.1 / 0.1.0 with `^0.5.0` dna-core dep ranges.
- [x] 9.2 input-json bumped to `0.4.2` in §6.
- [x] 9.3 input-text bumped to `0.4.2` (was 0.5.0 pre-explore). LayeredConstructor `duplicate_name` removal + `result()` shape change is technically minor-breaking, but no external consumer uses LayeredConstructor directly (jira goes through `parse()` which is unaffected) — patch bump is defensible pre-1.0. integration-jira reverted to 0.4.0 with its original `^0.4.0` input-text dep range.
- [x] 9.4 Superseded by later releases. The `v0.5.1` git tag exists, but the npm publish of 0.5.1 was skipped and the builders shipped to npm as part of `@dna-codes/dna-core@0.8.0` (the next release line, alongside the primitive-base-contract work). Subsequent tags `v0.5.2`, `v0.6.0`, `v0.7.0` were cut by later changes; `0.8.0` is the current latest on npm and carries the builders.
- [x] 9.5 Verified against the published `@dna-codes/dna-core@0.8.0`. Fresh consumer project at `$TMPDIR/dna-builders-smoke/` installs the package, composes a non-trivial Operational DNA via `createOperationalDna` + `addResource`/`addPerson`/`addRole`/`addGroup`/`addMembership`/`addOperation`/`addTrigger`/`addRule`/`addTask`/`addProcess`, and `DnaValidator.validate(dna, 'operational')` returns `{ valid: true, errors: [], conflicts: 0 }`.
