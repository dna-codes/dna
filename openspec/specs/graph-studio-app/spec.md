# graph-studio-app Specification

## Purpose
TBD - created by archiving change dna-graph-studio. Update Purpose after archive.
## Requirements
### Requirement: App exists at `apps/graph-studio/` as a workspace member

A Next.js 15 TypeScript application SHALL exist at `apps/graph-studio/` and SHALL be declared in the root `package.json` workspaces array. It SHALL declare `@dna-codes/dna-core` and `@dna-codes/dna-adapters` as runtime dependencies via workspace `file:` references, and `@joint/core` as a `file:` reference to `../../vendor/jointjs`.

#### Scenario: App is listed in root workspaces

- **WHEN** the root `package.json` is read
- **THEN** the `workspaces` array SHALL include `apps/graph-studio`

#### Scenario: App builds without errors

- **WHEN** `npm run build --workspace apps/graph-studio` is invoked with a valid `vendor/jointjs` present
- **THEN** Next.js emits a production build to `apps/graph-studio/.next/` without TypeScript or build errors

#### Scenario: App dev server starts

- **WHEN** `npm run dev --workspace apps/graph-studio` is invoked
- **THEN** the Next.js dev server starts on port 3100 (default for graph-studio) without errors

### Requirement: Home page lists available lenses

The root route (`/`) SHALL render a page listing all available lenses by name and description. Each lens SHALL be a link to its route (`/lens/[name]`). The page SHALL be a Server Component.

#### Scenario: Home page renders lens list

- **WHEN** a GET request is made to `/`
- **THEN** the response HTML SHALL include the text "Org Chart" and a link to `/lens/org-chart`

#### Scenario: Home page renders without a database connection

- **WHEN** `NEO4J_URI` is unset and a GET request is made to `/`
- **THEN** the page SHALL render the lens list with a visible "No database connected" notice — it SHALL NOT throw or return a 500

### Requirement: Lens route mounts the named lens

The route `/lens/[name]` SHALL dynamically load and render the lens component registered for `name`. An unknown `name` SHALL render a 404 page. Lens components are registered in a static `LENS_REGISTRY` map.

#### Scenario: Known lens route renders the lens

- **WHEN** a GET request is made to `/lens/org-chart`
- **THEN** the response SHALL include the org chart lens shell (canvas container element present in the HTML)

#### Scenario: Unknown lens route returns 404

- **WHEN** a GET request is made to `/lens/unknown-lens`
- **THEN** Next.js SHALL return a 404 response

### Requirement: `<GraphCanvas>` is a Client Component that mounts JointJS

A `<GraphCanvas graphData={...} />` Client Component SHALL exist. It SHALL use `useRef` to attach a JointJS `dia.Paper` and `dia.Graph` to a container `div`. It SHALL accept a `GraphData` prop and apply it to the JointJS graph on mount and on prop change. It SHALL be loaded with `{ ssr: false }` to prevent server-side rendering.

#### Scenario: Canvas renders a container div

- **WHEN** `<GraphCanvas graphData={{ nodes: [], edges: [] }} />` is rendered in a jsdom test environment
- **THEN** a `div` with `data-testid="graph-canvas"` SHALL be present in the output

#### Scenario: Canvas does not render server-side

- **WHEN** the `<GraphCanvas>` import is inspected at the module level
- **THEN** it SHALL be wrapped with `next/dynamic` and `ssr: false`

### Requirement: Neo4j connection configured via environment variables

The app SHALL read `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` from `process.env` in a single `lib/db.ts` module. That module SHALL export a `getDb(): DnaDataStore | null` function that returns `null` (not throws) when any required variable is absent.

#### Scenario: `getDb` returns a client when env vars are set

- **WHEN** `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` are set in the environment
- **THEN** `getDb()` SHALL return a `DnaDataStore` instance

#### Scenario: `getDb` returns null when env vars are absent

- **WHEN** `NEO4J_URI` is unset
- **THEN** `getDb()` SHALL return `null` without throwing

### Requirement: Navigation state is modelled as an XState machine wired to the Next.js router

A `navigationMachine` (`lib/machines/navigation.ts`) SHALL model app routing with states `home`, `lens`, and `notFound`. A `useNavigationMachine` hook SHALL bind the machine to `useRouter`: state transitions to `lens` SHALL call `router.push('/lens/[name]')`; state transitions to `home` SHALL call `router.push('/')`. Browser back/forward (detected via `router.pathname`) SHALL send the corresponding event (`SELECT_LENS` or `GO_HOME`) into the machine so the machine stays in sync with the URL.

#### Scenario: Selecting a lens transitions machine to `lens` state and pushes route

- **WHEN** `SELECT_LENS` with `{ name: 'org-chart' }` is sent to the navigation machine
- **THEN** the machine transitions to the `lens` state with `context.activeLens === 'org-chart'` and `router.push('/lens/org-chart')` is called

#### Scenario: GO_HOME transitions machine to `home` and pushes root route

- **WHEN** the machine is in the `lens` state and `GO_HOME` is sent
- **THEN** the machine transitions to `home` and `router.push('/')` is called

#### Scenario: Machine stays in sync when browser navigates back

- **WHEN** the browser navigates back to `/` (router.pathname changes to `/`)
- **THEN** the `useNavigationMachine` hook sends `GO_HOME` to the machine without calling `router.push` again

#### Scenario: Navigation machine is unit-testable without a router

- **WHEN** the `navigationMachine` is created and `SELECT_LENS` is sent using XState's `createActor`
- **THEN** the resulting state is `lens` with the correct `activeLens` — no Next.js router required

### Requirement: TDD harness is configured and passing

The app SHALL include a `jest.config.ts` using `next/jest` transform with `jsdom` test environment. `@testing-library/react` and `@testing-library/jest-dom` SHALL be installed. A `playwright.config.ts` SHALL be present for e2e tests targeting the dev server. All tests SHALL pass with `npm test --workspace apps/graph-studio`.

#### Scenario: Jest runs without configuration errors

- **WHEN** `npm test --workspace apps/graph-studio` is invoked (with no test files present)
- **THEN** Jest exits 0 with "no tests found" or equivalent — it SHALL NOT exit with a configuration error

#### Scenario: A sample component test passes

- **WHEN** a test renders the home page component with React Testing Library
- **THEN** the test SHALL find the lens list and pass

