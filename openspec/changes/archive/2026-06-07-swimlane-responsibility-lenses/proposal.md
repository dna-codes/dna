## Why

The three existing lenses (org chart, process flow, runbook) all use the same DNA fixtures but answer the same two questions — hierarchy and sequence. Adding swimlane and responsibility map demonstrates that a single fixture can power qualitatively different visual forms, which is the core promise of DNA as a grammar.

## What Changes

- Add a **swimlane lens**: re-renders process-flow DNA as a horizontal-lane diagram where each lane is an assigned role/position and steps are placed in the lane of their assignee, connected left-to-right by flow edges. Steps without assignments go into an "Unassigned" lane.
- Add a **responsibility map lens**: a force-directed JointJS graph showing positions as hub nodes and steps as leaf nodes, with edges representing `assigned_to` relationships. Position nodes are grouped/colored by their parent department.
- Add both lenses to `lib/examples.ts` for all three examples (mass-torts, ecommerce, lending), bringing each example from 3 to 5 lenses.
- Create six new page routes (`/lens/[example]/swimlane` and `/lens/[example]/responsibility-map` for each example).
- No new fixture data is required — both lenses are projections of existing `process`, `step`, `position`, `department`, `assigned_to`, and `next_step` relationships already present in all three fixtures.

## Capabilities

### New Capabilities
- `swimlane-lens`: Transformer + canvas that groups steps into horizontal role lanes and renders left-to-right flow within each lane
- `responsibility-map-lens`: Transformer + canvas that builds a bipartite graph of positions → steps connected by `assigned_to`, with positions colored by department

### Modified Capabilities
- `example-registry`: Each of the three `EXAMPLES` entries gains two new `LensMeta` entries (`swimlane`, `responsibility-map`)

## Impact

- `apps/graph-studio/lib/examples.ts` — add 2 lens entries per example (6 total new LensMeta objects)
- `apps/graph-studio/lib/lenses/swimlane/fromResourceGraph.ts` — new transformer
- `apps/graph-studio/lib/lenses/responsibility-map/fromResourceGraph.ts` — new transformer
- `apps/graph-studio/components/lenses/SwimlaneCanvas.client.tsx` + thin wrapper
- `apps/graph-studio/components/lenses/ResponsibilityMapCanvas.client.tsx` + thin wrapper
- 6 new page files under `app/lens/[example]/swimlane/` and `app/lens/[example]/responsibility-map/`
- `apps/graph-studio/app/globals.css` — swimlane lane styles (CSS-rendered lanes, not JointJS)
- Existing fixtures unchanged; existing tests unaffected
