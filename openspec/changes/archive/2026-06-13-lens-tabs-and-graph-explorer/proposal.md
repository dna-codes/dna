## Why

The dna-agent right panel only shows the org-chart lens, so any graph data the agent creates beyond org-chart nodes is invisible to the user. A tabbed lens panel and a raw graph explorer close that gap — letting business leaders see their full graph as they build it, not just one slice of it.

## What Changes

- Replace the single `OrgChartPanel` on the right side with a `LensPanelShell` that renders a tab bar and the active lens view
- Add three additional structured lenses: people→positions, reporting-chains, and span-of-control
- Add a **Graph Explorer** tab powered by JointJS that renders all instances as nodes and all links as directed edges, auto-laid out with dagre
- Add new REST endpoints in `packages/mcp`: `/lens/people-positions`, `/lens/reporting-chains`, `/lens/span-of-control`, and `/graph` (raw nodes + edges)
- Add new Next.js API routes in `apps/dna-agent` to proxy each new endpoint
- Add `@joint/core` to `apps/dna-agent` for the graph explorer canvas

## Capabilities

### New Capabilities

- `lens-tab-bar`: Tabbed panel shell in dna-agent that switches between multiple lens views; active tab persists across `refreshSignal` updates
- `people-positions-lens`: Lens showing each Person instance and the Position it fills (or "vacant" if no person fills it); backed by a new MCP REST endpoint
- `reporting-chains-lens`: Lens showing `reports_to` chains as a flat list of paths from leaf to root; backed by a new MCP REST endpoint
- `span-of-control-lens`: Lens showing each Position with its direct and indirect report count; computable from existing `reports_to` links
- `graph-explorer`: JointJS canvas in dna-agent rendering all instances as nodes and all links as edges; data from a new `/graph` REST endpoint; dynamic import (client-only); dagre layout

### Modified Capabilities

- `org-chart-lens`: No requirement changes — existing `/lens/org-chart` endpoint and `OrgChartPanel` component become one tab inside `LensPanelShell` instead of the only panel

## Impact

- `packages/mcp/src/server.ts` — four new REST endpoints
- `packages/mcp/src/lenses/` — three new lens builder functions
- `apps/dna-agent/app/api/lens/` — three new Next.js route files
- `apps/dna-agent/app/api/graph/route.ts` — new route
- `apps/dna-agent/components/` — `LensPanelShell`, `PeoplePositionsPanel`, `ReportingChainsPanel`, `SpanOfControlPanel`, `GraphExplorer` (client-only)
- `apps/dna-agent/app/page.tsx` — swap `OrgChartPanel` for `LensPanelShell`
- New dependency: `@joint/core` in `apps/dna-agent`
