## Why

`dna.codes/docs` shipped (`add-docs-section` in the `dna-codes-site` repo), and it is now the
reader-facing home for DNA's documentation. Two cleanup items were written into that change's task
list, but both act on files in **this** repo, so neither could be done there:

- Mark `docs/frameworks/README.md` as superseded by `https://dna.codes/docs/frameworks`.
- Decide the fate of `docs/concepts/`.

They are handed off here so the site change can close and the work stays visible.

Two findings from the handoff change the shape of the work:

**The site carries six of the eight framework comparisons.** `/docs/frameworks` covers DDD, BPMN,
ArchiMate, C4, Event Storming, and TOGAF. `cedar.md` and `triggers-and-events.md` — both governed by
the `framework-docs` spec here — were never ported. Marking the README wholesale superseded would
point readers at a page missing two of the comparisons it indexes.

**`docs/concepts/` is not inert.** `README.md` links into it four times, twice as deep links to
content the site does not cover (`resource-types.md#stability-lifecycle`, cited from both the
stability section and the `dna-api` package table, and `product-ui.md`). The active
`domain-home-edge-migration` change also has an open task to update `docs/concepts` text for the
home-reference model. Retiring the directory outright would break live references and orphan an
in-flight change.

So the honest framing is not "retire the old docs" but "say which home is canonical for what, and
retire only what is genuinely superseded."

## What Changes

- **MODIFIED** `docs/frameworks/README.md` — state that the six ported comparisons are canonical at
  `https://dna.codes/docs/frameworks`, and that `cedar.md` and `triggers-and-events.md` remain
  canonical here until ported. The index table stays; each row gains its canonical home.
- **DECISION (made) — `cedar.md` and `triggers-and-events.md` stay canonical in this repository.**
  No follow-up change is filed against `dna-codes-site`. The site page is titled *Framework
  Comparisons* and carries six modeling-vocabulary maps; these two are a different genre — Cedar is an
  adjacent-tool boundary note ("isn't this just Cedar?"), and triggers-and-events is tool selection
  across n8n / Zapier / GitHub Actions / EventBridge. Neither answers "how does my modeling vocabulary
  map to DNA", which is what a reader arrives at that page for. Keeping them here also needs no
  cross-repo work to be correct today. Reversible: porting them later is a `dna-codes-site` change
  plus a banner swap in the two files.
- **MODIFIED** `docs/concepts/` — retire `lenses.json`, which is superseded by the published lens
  definitions the site's `/docs/lenses` generates from. Keep `resource-types.md` and `product-ui.md`,
  which carry content with live inbound links and no home on the site. Keep `compositions/` pending
  the same test.
- **MODIFIED** `README.md` — rewrite the `docs/concepts/` paragraph. It currently says the concepts
  docs "may use names that differ from the DSL primitives documented below; reconciliation is an open
  thread." That open thread is what this change closes: name which vocabulary is authoritative (the
  DSL) and what the concepts material is for.

**Out of scope:** porting `cedar.md` / `triggers-and-events.md` to the site (that is a
`dna-codes-site` change, filed only if the decision above goes that way); rewriting
`resource-types.md` or `product-ui.md` to the DSL's vocabulary; the `domain-home-edge-migration`
task, which stays with that change.

## Capabilities

### Modified Capabilities

- `framework-docs` — the framework index gains a requirement that each comparison names where it is
  canonical, so a reader is never sent to a page that does not carry the doc they are indexing.

### New Capabilities

- `docs-canonical-source` — for each documentation area in this repo, exactly one canonical home,
  stated in the docs themselves. Material superseded by another home is retired rather than left to
  drift alongside it.

## Impact

- **Readers** stop meeting two descriptions of the same model with no indication which one governs.
- **`dna-codes-site`** — `add-docs-section` can close; its Phase 6 cleanup is tracked here.
- **`domain-home-edge-migration`** — unaffected. Its `docs/concepts` task survives, because the files
  it touches are the ones this change keeps.
- **Risk** — the deep link `docs/concepts/resource-types.md#stability-lifecycle` is cited twice from
  `README.md`, including the package table. Any retirement of that file must fix both.

## Notes from applying

- **The six site-canonical files were kept, not retired.** The site sections carry the concept mapping
  and the "where DNA differs" material but drop each doc's **See also** cross-links, and the TOGAF
  section omits several sections the repo doc has (Building Blocks, Architecture Content Framework
  deliverables, Recommended workflow). Not full coverage, so the retirement requirement in
  `docs-canonical-source` does not fire yet. Each of the six now carries a banner naming the site as
  canonical; `docs/frameworks/README.md` records parity as the trigger for retiring them.
- **`lenses.json` had no programmatic reader.** The `integration/neo4j` path in the old README text no
  longer exists — the adapter moved to `packages/adapters/src/integration/neo4j`, and nothing in the
  repo loaded `docs/concepts/lenses.json`. It was the one clean full-coverage case: the published
  definitions under `packages/core/lenses/` are what the adapter, tooling and `/docs/lenses` consume.
- **Nine of the ten Composition docs were never written.** `docs/concepts/README.md` and
  `resource-types.md` linked to them 42 times; every link but Access Control's was already broken.
  Those names are now unlinked, with the index marking which are written up — link hygiene the change's
  own verification task (5.1) would otherwise have failed on.
- **Two further pre-existing broken links** turned up in the same sweep and were fixed:
  `README.md`'s `packages/integration-jira/src/cli.ts` (now `packages/adapters/src/integration/jira/cli.ts`)
  and `triggers-and-events.md`'s pointer to its design notes, which had since been archived.
