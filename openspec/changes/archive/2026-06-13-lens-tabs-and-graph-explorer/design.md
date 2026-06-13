## Context

`apps/dna-agent` currently renders a single `OrgChartPanel` in the right half of the two-panel layout. The agent can create any resource/relationship type and instance, but only org-chart data is ever visible. The MCP server already exposes `GET /lens/org-chart` as a REST endpoint outside the MCP protocol; the same pattern will be extended to new lenses. JointJS (`@joint/plus`) is already in use in `apps/graph-studio` via a local `.tgz` and dynamic import.

## Goals / Non-Goals

**Goals:**
- Replace `OrgChartPanel` with a `LensPanelShell` that renders a tab bar and the active view
- Add three structured lenses: people→positions, reporting-chains, span-of-control
- Add a graph explorer tab using JointJS that renders raw instances and links
- Keep the refresh-on-patch signal (`refreshSignal`) working for all tabs

**Non-Goals:**
- Interactive graph editing via JointJS (read-only explorer only)
- Type filtering or search within the graph explorer (v1 scope)
- Persisting active tab across page reloads
- Full lens suite (process, RACI, skills) — those follow naturally once the tab shell exists

## Decisions

### 1. REST endpoints, not MCP tools, for lens data

**Decision**: Keep new lenses as `GET /lens/<name>` REST endpoints served by `packages/mcp/src/server.ts`, proxied by Next.js API routes — the same pattern as `org-chart`.

**Rationale**: The Next.js UI does not need an MCP client to fetch lens data; a simple fetch is faster and avoids round-tripping through the agent loop. MCP tools are for the agent; REST endpoints are for the UI.

**Alternative considered**: Expose lenses as MCP resources. Rejected — resources require an MCP client connection and add session complexity for what is a simple read.

### 2. `@joint/core` (open-source) instead of `@joint/plus` (paid)

**Decision**: Add `@joint/core` to `apps/dna-agent`. Do not copy the `joint-plus.tgz` path from graph-studio.

**Rationale**: The graph explorer only needs basic node/link rendering and dagre layout — no premium features (routing, shapes library, etc.) are required. `@joint/core` is MIT-licensed, published on npm, and avoids coupling dna-agent to the local paid archive. `@joint/plus` can be swapped in later without changing the component interface.

**Alternative considered**: Copy `file:../../../../upgrade/product-architect-app-ui/joint-plus.tgz` reference. Rejected — path is relative to graph-studio and would break from dna-agent's directory; the tgz is not in this repo.

### 3. Dagre layout via `@dagrejs/dagre`

**Decision**: Use `@dagrejs/dagre` (already available on npm, commonly paired with JointJS) for auto-layout. Apply layout after populating the graph, before rendering.

**Rationale**: Force-directed layout has poor results for sparse organizational graphs. Dagre gives a clean hierarchical layout that matches the mental model of an org chart explorer.

### 4. Client-only dynamic import for JointJS

**Decision**: `GraphExplorer` is a `'use client'` component; JointJS is loaded via `await import('@joint/core')` inside `useEffect`, matching the pattern in `apps/graph-studio/components/GraphCanvas.client.tsx`.

**Rationale**: JointJS manipulates the DOM directly and has no SSR path. Dynamic import keeps it out of the server bundle.

### 5. `/graph` endpoint returns `{ nodes, edges }` in `GraphData` shape

**Decision**: New `GET /graph` endpoint returns `{ nodes: GraphNode[], edges: GraphEdge[] }` using the same types defined in `apps/graph-studio/lib/graph-data.ts` (duplicated/inline in dna-agent — no cross-app import).

**Rationale**: Reusing the shape ensures the JointJS rendering logic can be lifted from graph-studio if needed. A separate import from graph-studio would create an untracked inter-app dependency.

## Risks / Trade-offs

- **Large graphs become unreadable** → Acceptable for v1; add pagination/filtering in a follow-up
- **`@joint/core` bundle size** (~400 KB gzipped) adds to dna-agent client bundle → Mitigated by dynamic import (loaded only when Graph Explorer tab is active)
- **Dagre layout on every refresh** is O(n²) for dense graphs → Acceptable for typical org sizes (<200 nodes)
- **Lens data staleness** — each tab fetches independently on `refreshSignal`; if two tabs are open and a patch fires, only the active tab re-fetches immediately → Both tabs re-fetch on the same `refreshSignal` prop change, so this is not a real issue

## Migration Plan

1. Build and verify new packages/mcp endpoints with existing tests
2. Add `@joint/core` + `@dagrejs/dagre` to dna-agent
3. Implement new lens functions and `/graph` endpoint
4. Build `LensPanelShell` + per-lens components
5. Swap `OrgChartPanel` for `LensPanelShell` in `page.tsx`
6. Manual smoke test: start MCP server + dna-agent dev, create sample data via chat, verify all tabs render

Rollback: revert `page.tsx` to `OrgChartPanel` — no data migration required.
