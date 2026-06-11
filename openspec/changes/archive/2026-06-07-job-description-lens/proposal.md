## Why

The graph-studio app demonstrates DNA as a living operational model, but currently has no way to show what an individual *position* is actually responsible for. A job description lens closes this gap — generating a structured, human-readable document for each position directly from the DNA graph, proving that the data model is rich enough to produce hiring-grade output without any external content authoring.

## What Changes

- Add `description` fields to `position` and `process` resources in all example DNA JSON files (ecommerce, lending, audiobook-distributor, mass-torts-org)
- Create a new `job-description` lens with a `fromResourceGraph` transform that compiles each position's responsibilities from `assigned_to` step relationships, grouped by process, plus org context (department, reports-to, who fills the role)
- Create a document-style renderer component (`JobDescriptionCanvas.tsx`) — not a graph canvas, but a formatted text output styled to look like an actual job description
- Add `app/lens/{example}/job-description/page.tsx` routes for each example that has positions

## Capabilities

### New Capabilities
- `job-description-lens`: A lens that reads DNA graph data and outputs one formatted job description per position, each listing: title, department, reporting line, role summary (from `position.description`), and key responsibilities derived from assigned process steps (with process context from `process.description`)

### Modified Capabilities
- `example-registry`: Examples (ecommerce, lending, audiobook-distributor, mass-torts-org) gain `description` fields on position and process nodes — no spec-level behavior change, but the data model is enriched

## Impact

- **DNA JSON files**: `examples/ecommerce/dna.json`, `examples/lending/dna.json`, `examples/audiobook-distributor/dna.json`, `examples/mass-torts-org/org-chart.json` — all gain `description` on position and process resources
- **New lib**: `apps/graph-studio/lib/lenses/job-description/fromResourceGraph.ts`
- **New component**: `apps/graph-studio/components/lenses/JobDescriptionCanvas.tsx`
- **New routes**: `apps/graph-studio/app/lens/{ecommerce,lending,audiobook-distributor,mass-torts}/job-description/page.tsx`
- **Lens registry**: `apps/graph-studio/lib/lens-registry.ts` gains the new lens entry
- No new dependencies; no breaking changes
