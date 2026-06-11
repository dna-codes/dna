## Context

Three lenses exist (org chart, process flow, runbook). All use the same `fromResourceGraph(fixture): GraphData` transformer pattern — a plain function, one per lens, that projects fixture data into `GraphData`. Canvases are either JointJS client components (wrapped with `next/dynamic` for SSR) or plain React server components (RunbookCanvas). `LensShell` and `DnaStat` are shared shell components. The `EXAMPLES` registry in `lib/examples.ts` drives the index gallery.

All three existing fixtures already have the data needed for both new lenses: `step`, `process`, `position`, `department` resources, and `assigned_to`, `next_step`, `belongs_to`, `reports_to` relationships.

## Goals / Non-Goals

**Goals:**
- Swimlane canvas: horizontal lanes keyed by role, steps positioned left-to-right within their lane, flow arrows across lane boundaries
- Responsibility map canvas: bipartite force-directed graph — department nodes → position nodes → step nodes, edges from `assigned_to`; positions colored by department
- Both use existing fixture data, no schema changes
- Each example gets both lenses in the gallery (5 lens pills per card)

**Non-Goals:**
- Swimlane vertical stacking for multi-process fixtures (lanes merge across processes for simplicity)
- Animated force simulation (static layout with deterministic positioning)
- Editing or filtering interactions beyond existing drag support

## Decisions

### D1: Swimlane as a CSS-rendered layout, not JointJS for the lanes themselves

**Choice:** Render lane bands as CSS `div`s in a React Server Component; place JointJS `Paper` inside each lane `div`. One JointJS graph per lane.

**Rationale:** JointJS has no native swimlane primitive. Rendering lanes as CSS divs gives crisp, responsive lane headers and backgrounds with zero JointJS configuration. Each lane's Paper only needs to hold a linear sequence of steps — the layout is trivial (horizontal, single row). The alternative (one giant JointJS graph with custom background shapes for lanes) is significantly more complex and harder to keep aligned with lane labels.

**Alternative considered:** Single JointJS paper with lane background rects. Rejected: lane height is dynamic (depends on step count per lane), requiring manual re-layout after every data change.

### D2: Responsibility map as a static radial/tree layout, not force-directed simulation

**Choice:** Deterministic positional layout — departments form an outer ring, positions are placed near their department, steps radiate outward from their assigned position. No physics/simulation.

**Rationale:** Force simulation requires requestAnimationFrame and is difficult to test or make SSR-safe. A deterministic layout (concentric rings or department-clustered sectors) is computable server-side, predictable, and visually clear. JointJS has no built-in force-directed layout in the free tier — it would need to be hand-rolled or bring in a dependency.

**Layout algorithm:** Divide the circle into equal sectors, one per department. Place the department node at the sector midpoint on an inner ring. Place its positions on a middle ring within the sector. Place each position's assigned steps on an outer ring, fanned around the position.

**Alternative considered:** D3-force layout. Rejected: adds a new dependency; non-deterministic; harder to test.

### D3: Swimlane transformer groups ALL steps across ALL processes by role

**Choice:** The swimlane transformer collects every step in the fixture (across all processes), looks up each step's `assigned_to` relationship, and groups by target position name. Steps within a lane are sorted by topological order within their process.

**Rationale:** A per-process swimlane would produce one diagram per process, requiring either tabs or multiple canvases. A cross-process view (grouped by role) shows the full picture of who does what across all workflows — more useful as a single lens.

### D4: Responsibility map transformer is separate from process-flow transformer

**Choice:** `lib/lenses/responsibility-map/fromResourceGraph.ts` returns a `GraphData` with three node types (`department`, `position`, `step`) and two edge types (`has_position` for dept→position, `assigned_to` for position→step). The canvas uses node type to determine visual style and layout tier.

**Rationale:** The responsibility map needs different node types and edge semantics than process-flow. Reusing the process-flow transformer would require canvas-side heuristics to infer what to show. A dedicated transformer is clean and testable.

## Risks / Trade-offs

- **Swimlane with many lanes + many steps**: layout could become very wide. Mitigation: `overflowX: auto` on the container (same as other canvases); individual Papers per lane keep heights reasonable.
- **Steps unassigned in responsibility map**: steps with no `assigned_to` have no position node to connect to — they become isolated nodes. Mitigation: place them in a dedicated "Unassigned" cluster.
- **Swimlane CSS+JointJS hybrid**: lane sizing depends on step count; each lane's Paper must be sized to fit its steps. Mitigation: compute lane width = `PAD + n * (STEP_W + H_GAP)` before rendering.
