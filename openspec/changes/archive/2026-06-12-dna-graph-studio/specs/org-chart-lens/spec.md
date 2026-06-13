# org-chart-lens Specification

## Purpose

Defines the Org Chart lens — the first visual lens in DNA Graph Studio. It maps DNA structural primitives (Domains, Sub-Domains, Groups, Roles, Persons, Memberships) into a JointJS hierarchical org chart. The chart shows *structural containment and membership* — who belongs where, and in what role — derived from the DNA graph in Neo4j.

## ADDED Requirements

### Requirement: DNA structural primitives map to `GraphData` nodes

A pure server-side function `toOrgChartData(dna: OperationalDNA): GraphData` SHALL transform a loaded `OperationalDNA` into a `GraphData` value suitable for the `<GraphCanvas>` component. Each Domain, Group, Role, and Person primitive SHALL become a `GraphNode`. Each Membership SHALL become a `GraphEdge` from the Person node to the Role node.

#### Scenario: Domain becomes a node with label "domain"

- **WHEN** `toOrgChartData` is called with a DNA containing a domain named "marshall"
- **THEN** the result `nodes` SHALL include `{ id: "domain:marshall", label: "domain", name: "marshall" }`

#### Scenario: Sub-domain carries parentId of its parent domain

- **WHEN** the DNA contains a subdomain "lending" nested inside domain "finance"
- **THEN** the "lending" node SHALL have `parentId: "domain:finance"`

#### Scenario: Group becomes a node scoped to its domain

- **WHEN** the DNA contains a Group named "Case" inside domain "marshall"
- **THEN** the result SHALL include a node `{ id: "group:Case", label: "group", name: "Case", parentId: "domain:marshall" }`

#### Scenario: Role becomes a node with its scoping group as parentId

- **WHEN** the DNA contains a Role named "LeadCounsel" with `scope: "Case"`
- **THEN** the result SHALL include `{ id: "role:LeadCounsel", label: "role", name: "LeadCounsel", parentId: "group:Case" }`

#### Scenario: Unscoped role has no parentId

- **WHEN** the DNA contains a Role with no `scope` field
- **THEN** its node SHALL have no `parentId` (or `parentId: undefined`)

#### Scenario: Person becomes a leaf node

- **WHEN** the DNA contains a Person named "Partner"
- **THEN** the result SHALL include `{ id: "person:Partner", label: "person", name: "Partner" }` with no `parentId`

#### Scenario: Membership becomes an edge from Person to Role

- **WHEN** the DNA contains a Membership `{ person: "Partner", role: "LeadCounsel" }`
- **THEN** the result `edges` SHALL include `{ source: "person:Partner", target: "role:LeadCounsel", label: "membership" }`

#### Scenario: Empty DNA produces empty GraphData

- **WHEN** `toOrgChartData` is called with a DNA whose domain has no resources, persons, roles, or groups
- **THEN** the result SHALL be `{ nodes: [], edges: [] }`

### Requirement: JointJS shapes map to DNA node labels

The `<OrgChartCanvas>` Client Component SHALL render each `GraphNode` using a JointJS shape determined by its `label`:

- `domain` → `shapes.standard.Rectangle` with a bold title, acts as a compound parent container
- `group` → `shapes.standard.Rectangle` with a lighter style, nested inside its parent domain compound node
- `role` → `shapes.standard.Ellipse` nested inside its scoping group compound node
- `person` → `shapes.standard.Circle` (leaf, free-floating or below its role)
- Membership edges → dashed `shapes.standard.Link`

#### Scenario: Domain node renders as a compound container

- **WHEN** `toOrgChartData` produces a domain node and a group node with `parentId` pointing to the domain
- **THEN** the JointJS graph SHALL have the group cell embedded in the domain cell (`parent` set)

#### Scenario: Role node is embedded in its scoping group

- **WHEN** a Role node has `parentId: "group:Case"`
- **THEN** the JointJS role cell SHALL be embedded inside the "Case" group cell

#### Scenario: Membership edge renders as a dashed link

- **WHEN** a `GraphEdge` with `label: "membership"` is applied to the JointJS graph
- **THEN** a `shapes.standard.Link` with `strokeDasharray` set SHALL connect the Person and Role cells

### Requirement: Org chart lens fetches data via a Server Component

The lens route `/lens/org-chart` SHALL use a Next.js Server Component to call `toOrgChartData` with the loaded DNA (from `getDb()` or a static fixture when no DB is connected). The resulting `GraphData` SHALL be passed as a prop to the `<OrgChartCanvas>` Client Component. No data fetching SHALL occur inside the Client Component.

#### Scenario: Org chart page renders canvas container with graph data

- **WHEN** a GET request is made to `/lens/org-chart` with a database connected and a DNA loaded
- **THEN** the response HTML SHALL include a `div[data-testid="graph-canvas"]`

#### Scenario: Org chart page renders with fixture data when no DB is connected

- **WHEN** `NEO4J_URI` is unset and a GET request is made to `/lens/org-chart`
- **THEN** the page SHALL render using the bundled `examples/mass-tort` fixture DNA — it SHALL NOT return a 500

### Requirement: Domain nodes are collapsible in the JointJS canvas

The `<OrgChartCanvas>` SHALL support click-to-collapse and click-to-expand on Domain compound nodes. When a domain node is collapsed, its children (groups, roles, persons nested inside) SHALL be hidden. When expanded, they SHALL be revealed. Collapsed state is tracked in React component state, not in the JointJS model.

#### Scenario: Clicking a domain node toggles its collapsed state

- **WHEN** the user clicks a domain node in the canvas
- **THEN** the children of that domain SHALL toggle between visible and hidden

#### Scenario: Collapsed domain node shows a visual indicator

- **WHEN** a domain node is in collapsed state
- **THEN** the domain cell SHALL display a "▶" or "+" indicator to signal expandability

### Requirement: Canvas interaction state is modelled as an XState machine

A `canvasInteractionMachine` (`lib/machines/canvas-interaction.ts`) SHALL model the JointJS canvas interaction with states `idle`, `nodeHovered`, and `nodeSelected`. Its context SHALL carry `collapsed: string[]` (domain node ids that are currently collapsed) and `selectedNodeId: string | null`. A `TOGGLE_DOMAIN` event SHALL be a self-transition on all states that adds or removes the domain id from `collapsed`. The `<OrgChartCanvas>` component SHALL use `useMachine(canvasInteractionMachine)` instead of `useState` for all interaction state.

#### Scenario: Machine starts in idle state with empty context

- **WHEN** `canvasInteractionMachine` is created via `createActor`
- **THEN** the initial state is `idle` with `collapsed: []` and `selectedNodeId: null`

#### Scenario: HOVER_NODE transitions to nodeHovered

- **WHEN** `HOVER_NODE` with `{ nodeId: 'domain:marshall' }` is sent
- **THEN** the machine transitions to `nodeHovered` with `hoveredNodeId: 'domain:marshall'`

#### Scenario: SELECT_NODE transitions to nodeSelected from any state

- **WHEN** the machine is in `idle` or `nodeHovered` and `SELECT_NODE` with `{ nodeId: 'role:LeadCounsel' }` is sent
- **THEN** the machine transitions to `nodeSelected` with `selectedNodeId: 'role:LeadCounsel'`

#### Scenario: TOGGLE_DOMAIN adds domain id to collapsed set

- **WHEN** `TOGGLE_DOMAIN` with `{ nodeId: 'domain:marshall' }` is sent from `idle`
- **THEN** the state remains `idle` and `context.collapsed` includes `'domain:marshall'`

#### Scenario: TOGGLE_DOMAIN on already-collapsed domain removes it

- **WHEN** `context.collapsed` contains `'domain:marshall'` and `TOGGLE_DOMAIN` is sent with `{ nodeId: 'domain:marshall' }`
- **THEN** `context.collapsed` no longer contains `'domain:marshall'`

#### Scenario: DESELECT returns to idle

- **WHEN** the machine is in `nodeSelected` and `DESELECT` is sent
- **THEN** the machine transitions to `idle` with `selectedNodeId: null`

### Requirement: `toOrgChartData` is covered by unit tests using DNA fixtures

The `toOrgChartData` function SHALL have a `__tests__/toOrgChartData.test.ts` test file. It SHALL test against the `examples/mass-tort` DNA fixture (loaded as JSON). Each scenario in this spec's first requirement SHALL have a corresponding `it(...)` block.

#### Scenario: All mapping scenarios covered by tests

- **WHEN** `npm test --workspace apps/graph-studio` is run
- **THEN** the `toOrgChartData` test suite SHALL pass with one test per scenario in the "DNA structural primitives map to GraphData nodes" requirement
