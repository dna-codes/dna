## 1. Dependencies

- [x] 1.1 Add `@joint/core` and `@dagrejs/dagre` to `apps/dna-agent/package.json`
- [x] 1.2 Run `npm install` from repo root to update lockfile

## 2. MCP Server — New Lens Functions

- [x] 2.1 Create `packages/mcp/src/lenses/people-positions.ts` — query Position instances, find Person instances linked via `fills`, return `{ positions: { name, person: string|null }[] }`
- [x] 2.2 Create `packages/mcp/src/lenses/reporting-chains.ts` — traverse `reports_to` links from each Position upward, return `{ chains: string[][] }`
- [x] 2.3 Create `packages/mcp/src/lenses/span-of-control.ts` — for each Position, count direct and indirect reports via `reports_to`, return `{ positions: { name, directReports, totalReports }[] }`
- [x] 2.4 Create `packages/mcp/src/lenses/graph-data.ts` — list all instances and links, return `{ nodes: { id, type, name }[], edges: { id, source, target, type }[] }`

## 3. MCP Server — New REST Endpoints

- [x] 3.1 Add `GET /lens/people-positions` handler in `packages/mcp/src/server.ts` (same pattern as `/lens/org-chart`)
- [x] 3.2 Add `GET /lens/reporting-chains` handler
- [x] 3.3 Add `GET /lens/span-of-control` handler
- [x] 3.4 Add `GET /graph` handler calling `buildGraphData(dataStore)`
- [x] 3.5 Build `packages/mcp` (`npm run build` inside `packages/mcp`)

## 4. Next.js API Routes

- [x] 4.1 Create `apps/dna-agent/app/api/lens/people-positions/route.ts` — proxies `GET ${DNA_MCP_URL_BASE}/lens/people-positions`
- [x] 4.2 Create `apps/dna-agent/app/api/lens/reporting-chains/route.ts`
- [x] 4.3 Create `apps/dna-agent/app/api/lens/span-of-control/route.ts`
- [x] 4.4 Create `apps/dna-agent/app/api/graph/route.ts` — proxies `GET ${DNA_MCP_URL_BASE}/graph`

## 5. Lens Panel Components

- [x] 5.1 Create `apps/dna-agent/components/PeoplePositionsPanel.tsx` — client component, fetches `/api/lens/people-positions`, re-fetches on `refreshSignal`, renders table of position → person (or "Vacant")
- [x] 5.2 Create `apps/dna-agent/components/ReportingChainsPanel.tsx` — client component, fetches `/api/lens/reporting-chains`, renders each chain as a breadcrumb-style row
- [x] 5.3 Create `apps/dna-agent/components/SpanOfControlPanel.tsx` — client component, fetches `/api/lens/span-of-control`, renders table of position → direct / total

## 6. Graph Explorer Component

- [x] 6.1 Create `apps/dna-agent/components/GraphExplorer.tsx` — `'use client'`, fetches `/api/graph`, dynamic-imports `@joint/core` inside `useEffect`, applies dagre layout, renders `dia.Paper` on a `div` ref
- [x] 6.2 Style nodes by `type` (different fill color per resource type)
- [x] 6.3 Re-initialize canvas on `refreshSignal` change

## 7. LensPanelShell + Page Wiring

- [x] 7.1 Create `apps/dna-agent/components/LensPanelShell.tsx` — renders tab bar (Org Chart | People → Positions | Reporting Chains | Span of Control | Graph Explorer) and the active panel; accepts `refreshSignal` prop
- [x] 7.2 Replace `<OrgChartPanel refreshSignal={refreshSignal} />` with `<LensPanelShell refreshSignal={refreshSignal} />` in `apps/dna-agent/app/page.tsx`

## 8. Verification

- [x] 8.1 TypeScript check passes (`npx tsc --noEmit` in `apps/dna-agent`)
- [ ] 8.2 Manually start MCP server + dna-agent dev server, confirm all five tabs render without errors
- [ ] 8.3 Create sample data via chat (e.g., "add Alice as CEO and Bob as CFO reporting to Alice"), confirm org chart, people-positions, reporting-chains, span-of-control, and graph explorer all update
