## Why

DNA graphs exist in Neo4j but there is no visual interface for exploring them — practitioners work blind when reasoning about org structure, process flow, and access control. A graph studio with JointJS lenses makes the implicit structure of any DNA document visible, starting with the org chart: who belongs where, who reports to whom, and which roles scope to which groups.

## What Changes

- New Next.js application at `apps/graph-studio/` — full-stack with API routes, TDD via Jest + Testing Library
- JointJS (licensed) wired as the graph rendering engine — compound nodes for domains, shaped nodes for persons/roles/groups
- **Org Chart lens** as the first lens — renders the reporting/membership structure from DNA primitives (Domains → Groups → Roles → Persons via Memberships)
- API route layer that queries Neo4j via `@dna-codes/dna-api` / `@dna-codes/dna-adapters` and transforms results into JointJS graph data
- OpenSpec workflow adopted inside the app: specs live at `apps/graph-studio/openspec/`

## Capabilities

### New Capabilities

- `graph-studio-app`: Next.js 15 app scaffold — routing, JointJS provider, Neo4j connection config, TDD harness (Jest + Testing Library + Playwright for e2e)
- `org-chart-lens`: First lens — maps DNA structural primitives (Domain, Group, Role, Person, Membership) into a JointJS hierarchical org chart showing containment and membership edges; supports expanding/collapsing domain nodes

### Modified Capabilities

- none

## Impact

- **New app**: `apps/graph-studio/` added to root workspace
- **Existing packages consumed**: `@dna-codes/dna-core` (types + queries), `@dna-codes/dna-adapters/integration/neo4j` (data), `@dna-codes/dna-api` (GraphQL, optional)
- **JointJS**: licensed copy provided by user — treated as a local workspace package or direct file dependency
- **No changes** to existing packages
