## Context

Graph Studio currently has one example (mass-torts law firm) and one lens (org chart), hard-coded in `app/lens/org-chart/page.tsx`. The fixture is loaded directly in the page; the canvas component is imported inline. There is no concept of "example" or "lens registry" — routes, fixtures, and canvases are coupled.

The DNA model already supports everything needed for process flows and runbooks: `process`, `step`, `assigned_to`, `next_step` resource/relationship types are in the grammar. The transformers just need to be written.

## Goals / Non-Goals

**Goals:**
- Three domain examples with independent DNA fixtures, each exposing at least two lenses
- E-commerce enterprise is one of the three examples
- Index page becomes a gallery: example cards each listing available lenses
- URL scheme `/lens/[example]/[lens]` — stable, bookmarkable, one page per combination
- All lenses for an example derive from one fixture — no duplicated data
- Two new lens types: process-flow and runbook

**Non-Goals:**
- Runtime fixture switching (no file picker or URL-based fixture loading)
- Lens composition (e.g., overlaying two lenses on one canvas)
- Authentication or persistence
- Removing the existing `/lens/org-chart` route until it's explicitly deprecated

## Decisions

### D1: Static routes over a single dynamic `[example]/[lens]` page

**Choice:** One `page.tsx` per `app/lens/[example]/[lens]/` folder, ~9 files total.

**Rationale:** Each page is a React Server Component that imports a specific fixture and passes typed `graphData` to a specific canvas. Static routes are straightforward in Next.js, fully type-safe, and produce zero runtime dispatch logic. A single dynamic `[example]/[lens]/page.tsx` would need a runtime registry lookup with a type-cast to pick the right fixture JSON and canvas component — adding complexity for no user-facing benefit at this scale (3 examples × 3 lenses = 9 pages).

**Alternative considered:** `generateStaticParams` with one dynamic route. Rejected: adds indirection, requires a runtime switch statement or record lookup with `as` casts; errors surface at runtime not build time.

### D2: Example registry lives in `lib/examples.ts` and drives the index gallery only

**Choice:** `lib/examples.ts` exports a typed array of `ExampleMeta` objects (id, label, description, lenses) used by the index page to render cards. It does NOT dynamically import fixtures; each page imports its fixture directly.

**Rationale:** Separates "what exists and how to display it" (registry) from "what data to render" (page). The index page only needs metadata (labels, hrefs). Keeping fixture imports in individual pages preserves Next.js static analysis and tree-shaking.

### D3: Lens transformer interface stays `fromResourceGraph(graph: ResourceGraph): GraphData`

**Choice:** Each lens transformer exports a function with the same signature as the existing org-chart transformer.

**Rationale:** The `ResourceGraph` type (flat `resources[]` + `relationships[]`) is already defined in `lib/lenses/org-chart/fromResourceGraph.ts`. All three lenses can use the same input shape — they just filter and project differently. This keeps fixtures free of lens-specific fields.

### D4: New relationship types for process flows — `next_step` and `assigned_to`

**Choice:** Add `next_step` (step → step sequential flow) and `assigned_to` (step → position, who performs it) to `RelationshipType`. Add `process` and `step` (already in `ResourceType`) to the fixture contracts.

**Rationale:** Process/runbook DNA is expressed naturally as steps in a process with assignments. `next_step` edges power both the process-flow canvas (directed graph) and the runbook canvas (ordered list). `assigned_to` edges let the runbook canvas annotate each step with a role badge — same avatar pattern as org chart.

### D5: Three examples

| Key | Domain | Description |
|---|---|---|
| `mass-torts` | Law firm | Existing fixture; augment with a case-intake process and a client-onboarding runbook |
| `ecommerce` | E-commerce enterprise | Apex Commerce — catalog, orders, fulfillment, payments; order-fulfillment process; payment-failure runbook |
| `lending` | Consumer lending | ClearPath Lending — origination/underwriting/servicing/collections org, loan-application process, loan-closing runbook |

Each example exposes: `org-chart`, `process-flow`, `runbook`.

## Risks / Trade-offs

- **9 near-identical page files**: Accepted trade-off for D1. They are thin shell files (~20 lines each); duplication is trivial.
- **Fixture augmentation breaks existing tests**: Adding new resources/relationships to `mass-torts-org/org-chart.json` could change node/edge counts. Tests that assert exact counts must be updated.
- **Process-flow canvas is new code with no tests yet**: Plan covers adding transformer tests; canvas visual tests deferred (same policy as org-chart canvas).
- **`RelationshipType` union expansion**: Adding `next_step` and `assigned_to` is backward-compatible; existing fixtures that omit them are unaffected.
