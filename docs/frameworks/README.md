# Framework comparisons

DNA is a description language, not a methodology. Most teams that adopt DNA already model their domains in something — DDD, BPMN, ArchiMate, ER diagrams — and want to know how the vocabulary maps. These docs give concept-by-concept tables, list where DNA intentionally differs, and walk through one concrete translation per framework.

## Where each comparison is canonical

These comparisons live in two places, and the split is deliberate. Six of them — DDD, BPMN, ArchiMate, C4, Event Storming, and TOGAF — are canonical at **[dna.codes/docs/frameworks](https://dna.codes/docs/frameworks)**, the reader-facing home; the copies in this directory are kept for repo and offline readers and carry a pointer at the top. The other two — Cedar and Triggers and events — are **canonical here** and have no page on the site.

The `Canonical` column below says which is which for every row, so following a link never lands you on a page that does not carry the comparison you came for.

| Framework | Canonical | When you'd reach for it | DNA mapping |
|---|---|---|---|
| [BPMN 2.0](https://dna.codes/docs/frameworks#bpmn) | dna.codes ([repo copy](./bpmn.md)) | Workflow modeling — graphical process notation | DNA's `Process` / `Step` / `Task` cover the same ground textually; intentionally drops boundary events, inclusive gateways, and inline sub-processes |
| [Domain-Driven Design](https://dna.codes/docs/frameworks#ddd) | dna.codes ([repo copy](./ddd.md)) | Tactical + strategic domain modeling in code | Closest in spirit; Bounded Context = `Domain`, Aggregate Root = `Resource`, Domain Event = `Operation.changes` (no first-class event primitive in DNA today), Specification = condition `Rule` |
| [ArchiMate 3](https://dna.codes/docs/frameworks#archimate) | dna.codes ([repo copy](./archimate.md)) | Enterprise architecture across business, application, and technology layers | Business layer ≈ Operational; Application ≈ Product; Technology ≈ Technical. Motivation/strategy stay out of scope |
| [C4 Model](https://dna.codes/docs/frameworks#c4) | dna.codes ([repo copy](./c4.md)) | Software-architecture diagrams (Context / Container / Component / Code) | Context ≈ Operational `Domain`; Container ≈ Technical `Cell`; Component is implicit; Code is generated. Strongest at the Product/Technical boundary |
| [Event Storming](https://dna.codes/docs/frameworks#event-storming) | dna.codes ([repo copy](./event-storming.md)) | Workshop output → DNA translation | Sticky-color → primitive mapping. Aggregate (tan) = `Resource`; Command (blue) = `Operation`; Event (orange) maps to `Operation.changes` (DNA has no first-class event primitive today); Policy (purple) = `Trigger`; Actor (yellow) = `Person` or `Role` |
| [TOGAF](https://dna.codes/docs/frameworks#togaf) | dna.codes ([repo copy](./togaf.md)) | Enterprise architecture method (ADM phases, content framework, governance) | Positioning, not translation — DNA is what you produce in Phases B/C/D; the rest of ADM (vision, governance, change) sits around DNA, not inside it |
| [Cedar](./cedar.md) | this repository | Authorization policy you'd write next to DNA, not instead of | Cedar's `permit (principal, action, resource)` ≈ DNA's `Rule.allow` over an `Operation`'s actor/target/action; Cedar's `forbid`, entity store, and policy engine have no DNA analog (DNA is description, not runtime) |
| [Triggers and events](./triggers-and-events.md) | this repository | Picking a tool to fire DNA Triggers — n8n, Zapier, GitHub Actions, EventBridge | DNA's `Trigger.source: user \| schedule \| webhook \| operation` lines up cleanly with all four tools' entry-point primitives; tool-specific filtering (e.g., EventBridge event patterns) is intentionally outside DNA |

## How to read each comparison

Every doc follows the same structure:

1. **Concept-by-concept mapping table** — every primitive in the source framework, with its DNA equivalent and a note on the translation.
2. **Where DNA intentionally differs** — features the source framework has that DNA omits on purpose, with the reasoning.
3. **Concrete translation example** — a small model in the source framework, then the same model in DNA, usually pointing at one of the [`examples/`](../../examples/) directories.
4. **See also** — cross-links to the other framework comparisons.

## Coverage status

These comparisons are starting points, not exhaustive treatments. Each is meant to be specific enough that someone fluent in the source framework can sanity-check the mapping by inspection. If you find a primitive that's missing or a translation you'd disagree with, open an issue or PR — these docs evolve with the model.

The six site-canonical files are still here rather than retired because the site sections are not yet at parity: they carry the concept mapping and the "where DNA differs" material, but not the per-doc **See also** cross-links, and the TOGAF section omits several of the repo doc's sections. Once a comparison reaches parity on the site, its repo copy should be retired and every inbound link updated in the same change.

**Deferred:**

- ER / IDEF1X — straightforward Resource/Attribute/Relationship mapping; trivial enough to defer

If you'd find one of these useful, open an issue or PR — defer means "not yet motivated by a real need," not "won't ever do."

## When framework comparison stops being useful

DNA is meant to be readable on its own. If you find yourself reaching for the comparison docs to write basic DNA, it's a sign the README and the Operational layer docs need to be clearer — not that you need a translation table. The comparisons are for cross-team communication ("here's how this concept you already know maps") and for evaluation ("is DNA expressive enough for what we already model"), not as a primary learning resource.
