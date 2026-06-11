## Why

Graph Studio currently demonstrates a single DNA example (mass-torts org chart) through a single lens. To show the full expressive power of DNA — where one fixture drives many visualizations — we need multiple domain examples each rendered through multiple lenses, so developers and stakeholders can see the same resources and relationships surface differently depending on the question being asked.

## What Changes

- Add two new DNA example fixtures: an e-commerce enterprise and a consumer lending / loan origination domain
- Keep the existing mass-torts law firm fixture; extend it with additional relationships to support process-flow and runbook lenses
- Introduce two new lens types across all examples: **process-flow** (directed step graph) and **runbook** (ordered operational procedure)
- Refactor the app's index page from a single lens link to a multi-example gallery: each example card lists its available lenses
- Each lens routes under `/lens/<example>/<lens-type>` so URLs are stable and bookmarkable
- Shared transformer infrastructure: `fromResourceGraph` stays the single entry point; each lens adds its own transformer module

## Capabilities

### New Capabilities
- `example-registry`: A typed registry (`lib/examples.ts`) that maps each example name to its fixture path and available lenses, powering the index gallery and routing
- `process-flow-lens`: Transformer + canvas for rendering Process/Step resources as a directed flowchart (nodes = steps, edges = sequence/decision transitions)
- `runbook-lens`: Transformer + canvas for rendering an ordered operational procedure — numbered steps, role assignments, and decision branches
- `ecommerce-example`: DNA fixture for an e-commerce enterprise (catalog, orders, fulfillment, payments domains with their resources and relationships)
- `lending-example`: DNA fixture for a consumer lending company (origination, underwriting, servicing, collections departments; loan-application process; loan-closing runbook)

### Modified Capabilities
- `org-chart-lens`: Route pattern changes from `/lens/org-chart` to `/lens/<example>/org-chart`; transformer interface unchanged

## Impact

- `apps/graph-studio/app/` — new route segments `[example]/[lens]`; index page becomes gallery
- `apps/graph-studio/lib/` — new `examples.ts` registry; new lens transformer modules
- `apps/graph-studio/components/lenses/` — new `ProcessFlowCanvas` and `RunbookCanvas` client components
- `examples/` — two new fixture directories alongside `mass-torts-org/`
- Existing org-chart tests remain valid; transformer contracts unchanged
