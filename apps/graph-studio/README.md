# DNA Graph Studio

Visual lenses into Neo4j-backed DNA graphs. Built with Next.js 16, JointJS+ (licensed), XState v5.

## Prerequisites

### JointJS+ (licensed)

The app requires `@joint/plus` v4.2.0 from the local tgz at:

```
/Users/timothypaulkleier/Apps/upgrade/product-architect-app-ui/joint-plus.tgz
```

This is referenced in `package.json` as a `file:` dependency. If you move the tgz, update the path in `package.json`.

A reference OrgChart app using the same JointJS+ version is at:
```
/Users/timothypaulkleier/Apps/upgrade/product-architect-app-ui/jointjs/joint-plus_v4_2_0/apps/OrgChart/ts/
```

### Neo4j (optional)

Set these env vars to connect a live Neo4j graph. Without them, the app falls back to the bundled `examples/mass-tort` fixture:

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
```

Copy `.env.local.example` to `.env.local` and fill in your values.

## Dev setup

```bash
# From the repo root:
npm install
npm run dev --workspace apps/graph-studio
# App runs at http://localhost:3100
```

## Tests

```bash
# Unit + component tests (Jest):
npm test --workspace apps/graph-studio

# E2e (Playwright — requires dev server running):
npm run test:e2e --workspace apps/graph-studio
```

## XState machines

Two state machines govern the app:

| Machine | File | States |
|---|---|---|
| Navigation | `lib/machines/navigation.ts` | `home \| lens \| notFound` |
| Canvas interaction | `lib/machines/canvas-interaction.ts` | `idle \| nodeHovered \| nodeSelected` |

The navigation machine is bound to the Next.js router via `lib/hooks/useNavigationMachine.ts`. The canvas machine drives collapse/expand, hover, and selection in `<OrgChartCanvas>`.

## Examples

Three DNA fixtures live in `examples/`. Each is a self-contained `ResourceGraph` (flat `resources[]` + `relationships[]`) that drives all three lenses.

| Example | Fixture | Domain |
|---|---|---|
| Marshall Fire Justice | `examples/mass-torts-org/org-chart.json` | Mass-tort law firm |
| Apex Commerce | `examples/ecommerce/dna.json` | E-commerce enterprise |
| ClearPath Lending | `examples/lending/dna.json` | Consumer lending |

## Lenses

Each example exposes three lenses at `/lens/[example]/[lens]`:

| Lens | Route pattern | Description |
|---|---|---|
| Org Chart | `/lens/:example/org-chart` | Hierarchy: company → departments → positions, with person avatar badges |
| Process Flow | `/lens/:example/process-flow` | Left-to-right directed graph of process steps with role annotations |
| Runbook | `/lens/:example/runbook` | Numbered ordered list of steps with teal role-badge pills |

The index page (`/`) shows all examples as cards with links to each lens.

## Architecture

- **Server Components** fetch and shape DNA data into `GraphData`
- **Client Components** (`*.client.tsx`) render JointJS canvases with `{ ssr: false }` dynamic wrappers
- **`GraphData`** (`lib/graph-data.ts`) is the server→client contract — pure, testable without JointJS
- **`fromResourceGraph`** — each lens has its own transformer in `lib/lenses/<lens>/fromResourceGraph.ts` that projects the flat fixture into the `GraphData` shape the canvas expects
- **`RunbookCanvas`** is a plain Server Component (no JointJS) — renders a styled numbered list
- **`EXAMPLES`** (`lib/examples.ts`) is the typed registry that powers the index gallery
