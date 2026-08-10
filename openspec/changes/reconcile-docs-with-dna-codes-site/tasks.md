# Tasks — reconcile-docs-with-dna-codes-site

## Phase 1: Decide

- [x] 1.1 Decide whether `cedar.md` and `triggers-and-events.md` get ported to `dna.codes/docs/frameworks` or stay canonical in this repo — **stay canonical here**; rationale in `proposal.md`
- [x] 1.2 If ported: file the follow-up change against `dna-codes-site` (it owns the page) — n/a, not ported

## Phase 2: Framework docs

- [x] 2.1 Rewrite the `docs/frameworks/README.md` preamble — the six ported comparisons are canonical at `https://dna.codes/docs/frameworks`
- [x] 2.2 Mark each of the six ported rows (DDD, BPMN, ArchiMate, C4, Event Storming, TOGAF) with its canonical link — new `Canonical` column; the framework name links to the site anchor, the repo copy stays reachable
- [x] 2.3 Mark `cedar.md` and `triggers-and-events.md` as canonical here, per the Phase 1 decision
- [x] 2.4 Verify every link in the index table resolves — link checker over `README.md` + `docs/**`; the six site anchors match the `id=` values in the site's `frameworks.astro`
- [x] 2.5 *(added)* Banner each of the eight files with its canonical home, so a reader landing on a file directly can tell which copy governs

## Phase 3: Concepts

- [x] 3.1 Retire `docs/concepts/lenses.json` — superseded by the published lens definitions `/docs/lenses` generates from
- [x] 3.2 Confirm nothing in `integration/neo4j` or the adapters still reads `lenses.json` before removing it — no reader anywhere in the repo; the adapter now lives at `packages/adapters/src/integration/neo4j`
- [x] 3.3 Keep `resource-types.md` and `product-ui.md`; add a header to each naming the DSL as authoritative where vocabulary differs — same header added to `docs/concepts/README.md`, the directory's entry point
- [x] 3.4 Apply the same test to `compositions/` — keep if it has live references and no home on the site, retire if not — **kept**: `access-control.md` is linked from six places and has no site page
- [x] 3.5 *(added)* Unlink the nine Composition names that never had a doc (42 broken links across `README.md` and `resource-types.md`); index now marks which are written up

## Phase 4: Repo README

- [x] 4.1 Rewrite the `docs/concepts/` paragraph (`README.md:145`) — drop "reconciliation is an open thread", name the DSL as authoritative
- [x] 4.2 Verify the two deep links to `resource-types.md#stability-lifecycle` (`README.md:208`, `README.md:388`) still resolve — both do; file kept, anchor intact
- [x] 4.3 Verify the `product-ui.md` link (`README.md:217`) still resolves
- [x] 4.4 *(added)* Rewrite the framework-comparisons paragraph (`README.md:141`), which listed only the six ported docs and pointed all of them at repo files

## Phase 5: Verify

- [x] 5.1 No markdown link in `README.md` or `docs/**` points at a retired file — link checker (paths + `.md` anchors) reports all resolving across 14 files; two unrelated pre-existing breaks fixed en route
- [x] 5.2 `openspec validate --all` passes
