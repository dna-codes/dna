## 1. Server — type-registry view-model & endpoint

- [x] 1.1 Add `packages/mcp/src/lenses/type-registry.ts` with `buildTypeRegistryGraph(store)` returning `{ resourceTypes[], relationshipTypes[] }` from `resourceType.list()` and `relationshipType.list()` (name, category, description, stability, attributes / from, to, cardinality, description, stability).
- [x] 1.2 Add a `GET /lens/type-registry` branch to `handleLensRequest` in `packages/mcp/src/server.ts` (or the lens routing) returning the view-model as JSON.
- [x] 1.3 Export the view-model types from `packages/mcp/src/index.ts` (`TypeRegistryViewModel`, node/edge entry types).
- [x] 1.4 Add a unit test in `packages/mcp/src/__tests__` asserting the view-model lists all types with no instances present; rebuild `dist`.

## 2. App — proxy route

- [x] 2.1 Add `apps/dna-agent/app/api/lens/type-registry/route.ts` proxying `GET /lens/type-registry` (mirror the existing lens route proxies).

## 3. App — Build Graph Explorer (schema graph)

- [x] 3.1 Add a `source?: 'instances' | 'types'` prop to `components/GraphExplorer.tsx` (default `'instances'`); when `'types'`, fetch `/api/lens/type-registry` and map resourceTypes→nodes (id=name, type=category) and relationshipTypes→edges (source=from, target=to, type=name), keeping `from === to` as self-loops.
- [x] 3.2 Use type-oriented empty-state copy when `source === 'types'`.

## 4. App — three structured Build panels

- [x] 4.1 Add `components/TypeOrgChartPanel.tsx`: build a hierarchy from `belongs_to` edges (parent = `to`), annotate `reports_to`; fall back to category grouping when no structural edges exist.
- [x] 4.2 Add `components/TypeReportingChainsPanel.tsx`: list `reports_to`-style relationship types as `from → to` rows.
- [x] 4.3 Add `components/TypeJobDescriptionsPanel.tsx`: one card per resource type — name + category, stability badge, description, attribute fields (name · type · required), and participating relationships split outgoing/incoming.
- [x] 4.4 Give each panel a type-oriented empty state and have it refetch on `refreshSignal`.

## 5. App — wire Build lens set & prompt

- [x] 5.1 In `components/LensPanelShell.tsx`, set `BUILD_TABS` to `[graph-explorer(types), org-chart(types→TypeOrgChartPanel), reporting-chains(types→TypeReportingChainsPanel), job-descriptions(types→TypeJobDescriptionsPanel)]`; pass `source="types"` to the Build Graph Explorer.
- [x] 5.2 In `apps/dna-agent/lib/system-prompt.ts`, update the Build `activate_lens` routing to list the four type lens IDs (replacing "graph-explorer only").

## 6. Spec reconciliation, docs & verification

- [x] 6.1 Update the `build-operate-modes` change's `specs/build-operate-modes/spec.md` "Mode gates the lens set" / Build lens scenarios so the Build set reads as the four type lenses (keep the two changes consistent).
- [x] 6.2 Update `apps/dna-agent/README.md` Build/Operate section to note the Build lenses render the type registry (schema graph, type org-chart, type reporting-chains, type definition cards).
- [x] 6.3 Typecheck the app (`tsc --noEmit`) and run the MCP test suite; confirm green.
- [x] 6.4 Manual verify: in Build with the operational pack and no instances, confirm Graph Explorer shows the schema graph and the three type panels render; switch to Operate and confirm instance lenses are unchanged.
