## 1. Update graph-data types

- [x] 1.1 In `lib/graph-data.ts`, rename `NodeLabel` → `ResourceType` and add `"position"` to the union (removing `"role"`)
- [x] 1.2 In `lib/graph-data.ts`, rename `GraphNode.label` → `GraphNode.type` (using `ResourceType`)
- [x] 1.3 In `lib/graph-data.ts`, add `RelationshipType` union (`"membership" | "reports_to" | "fills" | "belongs_to"`)
- [x] 1.4 In `lib/graph-data.ts`, rename `GraphEdge.label` → `GraphEdge.type` (using `RelationshipType`, optional)

## 2. Update toOrgChartData transformer

- [x] 2.1 In `toOrgChartData.ts`, update all `GraphNode` construction to use `type:` instead of `label:`
- [x] 2.2 In `toOrgChartData.ts`, change role nodes to emit `type: "position"` instead of `label: "role"`
- [x] 2.3 In `toOrgChartData.ts`, update membership edge construction to use `type:` instead of `label:`

## 3. Update OrgChartCanvas component

- [x] 3.1 In `OrgChartCanvas.client.tsx`, rename `LEVEL_ORDER` entry `"role"` → `"position"`
- [x] 3.2 In `OrgChartCanvas.client.tsx`, rename `SIZES` key `role` → `position`
- [x] 3.3 In `OrgChartCanvas.client.tsx`, update `makeCell` and `edgeLabel` calls that reference `node.label` → `node.type`
- [x] 3.4 In `OrgChartCanvas.client.tsx`, update domain filter `n.label === 'domain'` → `n.type === 'domain'`
- [x] 3.5 In `OrgChartCanvas.client.tsx`, update `layoutPositions` grouping to use `n.label` → `n.type`

## 4. Update org-chart page

- [x] 4.1 In `app/lens/org-chart/page.tsx`, update all four filter expressions from `n.label === '...'` → `n.type === '...'`
- [x] 4.2 In `app/lens/org-chart/page.tsx`, rename the `roles` variable to `positions` and update the `DnaStat` label to "Positions"

## 5. Update tests

- [x] 5.1 In `__tests__/components/OrgChartCanvas.test.tsx`, update all `GraphNode` test fixtures from `label:` → `type:`
- [x] 5.2 In `__tests__/components/OrgChartCanvas.test.tsx`, update `"role"` fixture values → `"position"`
- [x] 5.3 In `__tests__/components/OrgChartPage.test.tsx`, verify no field-name references need updating

## 6. Verify

- [x] 6.1 Run `npm test` from `apps/graph-studio` — all tests green
- [x] 6.2 Run `npm run build` from `apps/graph-studio` — TypeScript clean, no type errors
