## Context

DNA documents are validated and persisted in Neo4j via `@dna-codes/dna-adapters/integration/neo4j`. A GraphQL API (`@dna-codes/dna-api`) exists as a standalone server. React hooks (`@dna-codes/dna-react`) exist for operation-oriented UIs. No tooling exists to visually explore the graph structure of a DNA document — domain hierarchy, org membership, role scoping, process flow.

The user has a licensed copy of JointJS, which handles hierarchical/compound graphs natively (nested containers, ports, custom shapes). It requires a DOM and runs client-side only.

## Goals / Non-Goals

**Goals:**
- New `apps/graph-studio/` Next.js 16 (^16.2.7) app, workspace-integrated, TDD from day one
- Org chart lens: render Domain → Sub-Domain → Group → Role → Person hierarchy with Membership edges
- Clean server/client split: Server Components fetch DNA data; Client Components own the JointJS canvas
- OpenSpec adopted inside the app — lens specs live at `apps/graph-studio/openspec/`

**Non-Goals:**
- Modifying any existing package
- Replacing or wrapping `@dna-codes/dna-api` — data fetched directly via `dna-adapters` in Next.js Server Components
- Building process-flow, access-control, or execution lenses in this change
- Implementing real-time / live-update of the graph

## Decisions

### D1 — App location: `apps/graph-studio/` not `examples/`

`examples/` holds thin, single-domain demos. This is a multi-domain product app. A new top-level `apps/` directory signals that distinction and gives room for future apps (CLI studio, embed widget, etc.).

*Alternatives considered*: `examples/graph-studio/` — rejected because it implies demo status and mixes with fixture-like examples.

### D2 — Data fetching: Server Components → Neo4j direct (no GraphQL hop)

Next.js Server Components can import and call `@dna-codes/dna-adapters/integration/neo4j` directly — no HTTP round-trip, no Apollo client, no separate API server process. Simpler local dev, simpler deployment.

`@dna-codes/dna-api` remains available as an optional remote data source (env flag), but the default is direct adapter access.

*Alternatives considered*: Proxy through `dna-api` GraphQL — rejected for this change; adds a required running process and Apollo Client setup for no gain over direct adapter calls.

### D3 — JointJS via `file:` reference to existing licensed tgz

The user's licensed `@joint/plus` v4.2.0 copy already exists as a pre-built tgz at `/Users/timothypaulkleier/Apps/upgrade/product-architect-app-ui/joint-plus.tgz` — the same mechanism used by the existing `product-architect-app-ui` app (`"@joint/plus": "file:joint-plus.tgz"`). The graph-studio `package.json` references it with a relative path:

```json
"@joint/plus": "file:../../../../upgrade/product-architect-app-ui/joint-plus.tgz",
"@joint/core": "^4.2.1"
```

`@joint/core` is open source (MPL-2.0) and installed from npm. `@joint/plus` depends on it as a peer. No files are copied into the DNA repo; the licensed tgz stays in its original location.

A reference OrgChart app built with joint-plus exists at `/Users/timothypaulkleier/Apps/upgrade/product-architect-app-ui/jointjs/joint-plus_v4_2_0/apps/OrgChart/ts/` — use it during implementation.

*Alternatives considered*: Copy tgz into `vendor/` — rejected to avoid duplicating the licensed file; `@joint/react` (alpha, no built dist) — deferred; direct `@joint/plus` API is sufficient for this change.

### D4 — Client component boundary: `<GraphCanvas>` owns JointJS

JointJS needs a DOM `ref` and must run in the browser. The boundary is a single `<GraphCanvas>` Client Component that receives a serializable `GraphData` prop from its Server Component parent. All DNA queries and data shaping happen server-side; JointJS rendering is client-side only.

This also makes `GraphData` the stable contract — it can be tested in isolation without mounting JointJS.

### D5 — `GraphData` as the server/client contract

```ts
type GraphNode = {
  id: string
  label: string         // 'domain' | 'process' | 'step' | 'group' | 'role' | 'person'
  name: string
  parentId?: string     // for compound/nested containment
}

type GraphEdge = {
  id: string
  source: string
  target: string
  label?: string        // e.g. 'membership', 'depends_on'
}

type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] }
```

Server shaping functions are pure and unit-testable without a browser or JointJS.

### D6 — TDD harness: Jest + RTL for units; Playwright for e2e

- `jest.config.ts` with `jsdom` environment for component tests
- `@testing-library/react` for Server/Client component rendering
- Playwright for full-browser e2e covering the JointJS canvas
- Each lens ships a `__tests__/` folder; spec scenarios map 1:1 to test descriptions

### D7 — OpenSpec inside the app

Each lens gets its own spec at `apps/graph-studio/openspec/specs/<lens>/spec.md`. The root `openspec/` carries the change-level artifacts (this design, tasks). This mirrors the monorepo pattern and keeps lens specs co-located with lens code.

### D8 — XState v5 for machines with named states and transitions; useState for local UI values

XState (`xstate` + `@xstate/react`) is used wherever a thing has distinct named states and guarded transitions. Two machines in this change:

**Navigation machine** (`lib/machines/navigation.ts`) — models app-level routing state: `home | lens | notFound`. Wired to the Next.js router via a `useNavigationMachine` hook: transitions push to `router.push`; browser back/forward sends events back into the machine. This is the single source of truth for "what is the app showing."

```
home ──SELECT_LENS──▶ lens ──GO_HOME──▶ home
                           ──NOT_FOUND──▶ notFound
notFound ──GO_HOME──▶ home
```

**Canvas interaction machine** (`lib/machines/canvas-interaction.ts`) — models the JointJS canvas: `idle | nodeHovered | nodeSelected`. Context carries `collapsed: Set<string>` (domain expand/collapse) and `selectedNodeId`. `TOGGLE_DOMAIN` is a self-transition on all states (updates context without changing state). This replaces the ad-hoc `useState` in `<OrgChartCanvas>`.

```
idle ──HOVER_NODE──▶ nodeHovered ──HOVER_END──▶ idle
idle ──SELECT_NODE──▶ nodeSelected ──DESELECT──▶ idle
TOGGLE_DOMAIN available in all states (self-transition, updates collapsed set)
```

**Where XState is NOT used — and why:**
- Simple component-local UI values (tooltip visibility, input value, hover on a small element) → `useState`. These aren't *states* in the machine sense — they're mutable variables with no named transitions or guards.
- Server-fetched data — handled by Next.js Server Components; no client state machine needed.
- The rule: if a thing has ≥3 named states, guarded transitions, or side effects tied to state changes (routing, fetch) → XState. Otherwise → `useState`.

**Future fit:** DNA resources carry status enums (e.g. `Case.status: intake | discovery | settlement | closed`). A future change can generate XState machines directly from DNA status attributes — the grammar and the state charts are the same thing. This change lays the machine file structure to support that.

## Risks / Trade-offs

**JointJS is client-only → SSR hydration mismatch risk** → Mitigate with `dynamic(() => import('./GraphCanvas'), { ssr: false })` in Next.js. Canvas renders after hydration; no mismatch.

**`file:` joint-plus dep path is machine-local** → Document the tgz path in `apps/graph-studio/README.md`. CI skips JointJS-dependent tests if the tgz is absent (gate on env var `JOINT_PLUS_AVAILABLE`).

**Neo4j required for data** → All data-shaping functions accept a `GraphData` value directly; tests use fixture JSON, not a live database. E2e tests can run against a local Neo4j in Docker.

**Org chart ≠ strict reporting hierarchy** → DNA has no `reportsTo` edge. "Reporting structure" is derived from domain nesting + role scoping + membership. The lens renders *structural containment*, not management chains. Label clearly in UI.

## Open Questions

- Which Neo4j DNA fixture drives the initial dev/demo? (Recommend `examples/mass-tort` — rich roles, groups, persons)
