## Context

The graph-studio app renders DNA graphs through typed lenses (org-chart, process-flow, swimlane, etc.). Each lens has a `fromResourceGraph` transform in `lib/lenses/<name>/` and a canvas component in `components/lenses/`. All existing lenses produce `GraphData` (nodes + edges) and render via a 2D canvas or diagram library.

A job description lens is fundamentally different: the output is a structured document, not a graph. Each position in the DNA becomes one job description entry listing its title, department, reporting line, and responsibilities (derived from `assigned_to` step relationships grouped by process). This means the lens has its own output type (`JobDescriptionData`) and a document-style React component instead of a canvas.

Current gap: `ResourceItem` in `resource-graph.ts` has no `description` field. DNA JSON nodes also lack descriptions. Both must be addressed for the lens to produce meaningful content.

## Goals / Non-Goals

**Goals:**
- Extend `ResourceItem` with an optional `description?: string` field
- Add `description` to position and process nodes in all four example DNA JSON files
- Implement `lib/lenses/job-description/fromResourceGraph.ts` returning a typed `JobDescriptionData` structure (not `GraphData`)
- Implement `components/lenses/JobDescriptionCanvas.tsx` as a scrollable document (plain TSX, no canvas/graph library)
- Add `/lens/{example}/job-description/page.tsx` for ecommerce, lending, audiobook-distributor, and mass-torts examples
- Register the lens in `lib/lens-registry.ts`

**Non-Goals:**
- Generating job descriptions via AI/LLM — content comes from the DNA JSON only
- PDF export or print formatting
- Editing job descriptions within the UI
- Supporting the older `case-operations/org-chart.json` format (no processes, no `assigned_to`)

## Decisions

### D1: Separate output type (`JobDescriptionData`) rather than reusing `GraphData`
`GraphData` is nodes + edges for rendering graphs. Job descriptions are structured documents. Forcing them into `GraphData` would mean meaningless edges and attrs hacks. A purpose-built type is cleaner and makes the lens self-documenting.

```ts
export interface JobResponsibility {
  processName: string
  processDescription?: string
  steps: string[]
}

export interface JobDescription {
  positionId: string
  title: string
  department: string
  reportsTo?: string
  filledBy?: string
  summary?: string          // from position.description
  responsibilities: JobResponsibility[]
}

export interface JobDescriptionData {
  orgName: string
  positions: JobDescription[]
}
```

Alternative considered: returning a markdown string per position — rejected because it makes the component stateless and untestable at the data level.

### D2: Extend `ResourceItem` with `description?: string`
Adding it at the shared interface level is the least-invasive option. Existing lenses ignore it; the job-description transform reads it. No other files change.

Alternative considered: casting `(r as any).description` in the transform only — rejected because it bypasses typing with no benefit.

### D3: Document renderer — plain TSX, no canvas library
The output is a scrollable list of formatted job description cards. Using a canvas library (Cytoscape, React Flow) for text documents adds unnecessary complexity. A simple styled `<article>` per position, inside the existing `.canvas-wrap` / `.dna-summary` shell via `LensShell`, is sufficient.

### D4: Content sourcing — descriptions authored directly in DNA JSON
Job description summaries come from `position.description`. Responsibility groupings come from `assigned_to` → step → process relationships. Process context comes from `process.description`. No external content store is needed — the DNA IS the source of truth.

### D5: Examples covered
Ecommerce (`dna.json`), lending (`dna.json`), audiobook-distributor (`dna.json`), and mass-torts-org (`org-chart.json`) all have positions with `assigned_to` step relationships. The older `case-operations/org-chart.json` lacks processes entirely and is skipped.

## Risks / Trade-offs

- **[Risk] Positions with no assigned steps produce empty responsibility lists** → The renderer shows a "No responsibilities mapped" placeholder; the transform still returns the position so org context is visible.
- **[Risk] `description` fields in DNA JSON are manually authored** → They could drift from reality. Mitigation: descriptions are short and deliberately close to the name to minimize maintenance burden.
- **[Trade-off] `JobDescriptionData` is not `GraphData`** → The lens-registry `href` still works; the page just doesn't use the shared `GraphData` pipeline. This is intentional — job description is a document lens, not a graph lens.
