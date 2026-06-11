## 1. Repo & Workspace Scaffold

- [x] 1.1 Create `apps/` directory and `apps/graph-studio/` with `package.json` — Next.js `^16.2.7`, TypeScript; declare `@joint/plus` as `"file:../../../../upgrade/product-architect-app-ui/joint-plus.tgz"`, `@joint/core` as `"^4.2.1"`, `xstate` as `"^5"`, `@xstate/react` as `"^5"`
- [x] 1.2 Add `apps/graph-studio` to root `package.json` workspaces array
- [x] 1.3 Add `apps/graph-studio/tsconfig.json` extending root config
- [x] 1.4 Add `apps/graph-studio/next.config.ts` (port 3100, no other changes yet)
- [x] 1.5 Run `npm install --workspace apps/graph-studio` and verify `@joint/plus`, `@joint/core`, `xstate`, and `@xstate/react` resolve; note the joint-plus OrgChart reference app at `../../../../upgrade/product-architect-app-ui/jointjs/joint-plus_v4_2_0/apps/OrgChart/ts/` in `apps/graph-studio/README.md`

## 2. TDD Harness

- [x] 2.1 Install `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom` as devDependencies
- [x] 2.2 Add `jest.config.ts` using `next/jest` transform with `jsdom` environment
- [x] 2.3 Add `playwright.config.ts` targeting `http://localhost:3100`
- [x] 2.4 Verify `npm test --workspace apps/graph-studio` exits 0 with no test files present

## 3. XState — Navigation Machine

- [x] 3.1 Write failing tests for `navigationMachine`: initial state is `home`; `SELECT_LENS` transitions to `lens` with correct `activeLens`; `GO_HOME` from `lens` returns to `home`; machine is testable with `createActor` (no router)
- [x] 3.2 Implement `lib/machines/navigation.ts` — `createMachine` with states `home | lens | notFound`, context `activeLens: string | null`; all tests pass
- [x] 3.3 Write failing test for `useNavigationMachine` hook: `SELECT_LENS` calls `router.push('/lens/org-chart')`; `GO_HOME` calls `router.push('/')` (mock `useRouter`)
- [x] 3.4 Implement `lib/hooks/useNavigationMachine.ts` — binds machine to `useRouter`; syncs browser back/forward into machine via `router.pathname` effect; tests pass

## 4. XState — Canvas Interaction Machine

- [x] 4.1 Write failing tests for `canvasInteractionMachine`: initial state idle/empty context; `HOVER_NODE` → `nodeHovered`; `SELECT_NODE` → `nodeSelected`; `DESELECT` → `idle`; `TOGGLE_DOMAIN` adds/removes from `collapsed`; second toggle removes (idempotent)
- [x] 4.2 Implement `lib/machines/canvas-interaction.ts` — `createMachine` with states `idle | nodeHovered | nodeSelected`; `TOGGLE_DOMAIN` self-transition on all states; all tests pass

## 5. Neo4j Connection Module

- [x] 5.1 Write failing test for `lib/db.ts`: `getDb()` returns null when `NEO4J_URI` unset
- [x] 5.2 Write failing test: `getDb()` returns a `DnaDataStore` when all env vars present
- [x] 5.3 Implement `lib/db.ts` — `getDb(): DnaDataStore | null` reading env vars; tests pass

## 6. `GraphData` Type Contract

- [x] 6.1 Create `lib/graph-data.ts` exporting `GraphNode`, `GraphEdge`, `GraphData` types (as per design D5)
- [x] 6.2 Write a type-level test (compile-time) that a valid `GraphData` object satisfies the type

## 7. `<GraphCanvas>` Client Component

- [x] 7.1 Write failing test: canvas renders `div[data-testid="graph-canvas"]` given empty `GraphData`
- [x] 7.2 Implement `components/GraphCanvas.tsx` as a Client Component with `useRef` + JointJS `dia.Paper` / `dia.Graph` mount (conditional on `typeof window !== 'undefined'`)
- [x] 7.3 Wrap export with `next/dynamic(..., { ssr: false })`; test passes
- [x] 7.4 Write test: GraphData nodes are applied to JointJS graph on prop change (mock JointJS in jsdom)

## 8. Home Page & Lens Registry

- [x] 8.1 Write failing test: home page renders "Org Chart" with link to `/lens/org-chart`
- [x] 8.2 Create `lib/lens-registry.ts` with static `LENS_REGISTRY` map (initial entry: `org-chart`)
- [x] 8.3 Implement `app/page.tsx` Server Component rendering the lens list; uses `useNavigationMachine` for client-side lens selection; test passes
- [x] 8.4 Write test: home page renders "No database connected" notice when `getDb()` returns null

## 9. Lens Route

- [x] 9.1 Write failing test: `/lens/org-chart` route renders canvas container element
- [x] 9.2 Create `app/lens/[name]/page.tsx` Server Component — looks up lens in registry, passes `GraphData` to canvas
- [x] 9.3 Return Next.js `notFound()` for unknown lens names, triggering machine `NOT_FOUND` event; add test
- [x] 9.4 Verify both tests pass

## 10. `toOrgChartData` — Mapping Function

- [x] 10.1 Create `__tests__/toOrgChartData.test.ts` with one failing test per spec scenario (8 tests total) using `examples/mass-tort/operational.json` as fixture
- [x] 10.2 Implement `lib/lenses/org-chart/toOrgChartData.ts` — domain nodes with `label: "domain"`
- [x] 10.3 Implement sub-domain nesting (`parentId` propagation)
- [x] 10.4 Implement Group nodes with `parentId` pointing to their domain
- [x] 10.5 Implement Role nodes with `parentId` pointing to their scoping Group (or none if unscoped)
- [x] 10.6 Implement Person nodes (leaf, no `parentId`)
- [x] 10.7 Implement Membership → `GraphEdge` from Person to Role
- [x] 10.8 Verify all 8 `toOrgChartData` tests pass

## 11. `<OrgChartCanvas>` — JointJS Shape Mapping

- [x] 11.1 Write failing test: domain node maps to a JointJS compound `Rectangle` cell
- [x] 11.2 Write failing test: role node maps to an `Ellipse` cell embedded in its group cell
- [x] 11.3 Write failing test: membership edge maps to a dashed `Link`
- [x] 11.4 Implement `components/lenses/OrgChartCanvas.tsx` — shape mapping per spec (domain, group, role, person, membership edge); use `useMachine(canvasInteractionMachine)` for all interaction state
- [x] 11.5 Implement compound embedding: group cells embedded in domain cells, role cells in group cells
- [x] 11.6 Verify all shape-mapping tests pass

## 12. Collapse / Expand Interaction (XState-driven)

- [x] 12.1 Write failing test: `TOGGLE_DOMAIN` event sent to canvas machine causes domain's children to be hidden in the JointJS graph
- [x] 12.2 Write failing test: collapsed domain cell shows "▶" indicator (inspect cell attrs)
- [x] 12.3 Implement collapse/expand by reading `state.context.collapsed` in `<OrgChartCanvas>` and toggling JointJS cell visibility; dispatch `TOGGLE_DOMAIN` on domain cell click; tests pass

## 13. Org Chart Lens Page Integration

- [x] 13.1 Create `app/lens/org-chart/page.tsx` Server Component — calls `getDb()`, loads DNA, calls `toOrgChartData`, passes to `<OrgChartCanvas>`
- [x] 13.2 Implement fixture fallback: when `getDb()` is null, use bundled `examples/mass-tort` JSON
- [x] 13.3 Write integration test: page renders canvas with fixture data when no DB connected
- [x] 13.4 Register `org-chart` in `LENS_REGISTRY` pointing to this page

## 14. Smoke Test & README

- [x] 14.1 Run `npm run build --workspace apps/graph-studio` and confirm clean build
- [x] 14.2 Run `npm test --workspace apps/graph-studio` and confirm all tests pass
- [x] 14.3 Update `apps/graph-studio/README.md` with dev setup instructions (joint-plus tgz path, Neo4j env vars, XState machine overview, `npm run dev`)
- [x] 14.4 Update root `README.md` to reference `apps/graph-studio`
