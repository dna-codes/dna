# graph-explorer Specification

## Purpose
TBD - created by archiving change lens-tabs-and-graph-explorer. Update Purpose after archive.
## Requirements
### Requirement: Graph explorer renders all instances and links on a JointJS canvas

The system SHALL expose `GET /graph` on the MCP server returning `{ nodes: GraphNode[], edges: GraphEdge[] }` where each node is an instance and each edge is a link. The dna-agent SHALL proxy this at `GET /api/graph` and render it in `GraphExplorer`, a client-only component that uses `@joint/core` loaded via dynamic import.

#### Scenario: Graph with instances and links
- **WHEN** the store contains instances and links
- **THEN** the canvas renders one node per instance and one directed edge per link

#### Scenario: Empty graph
- **WHEN** the store contains no instances
- **THEN** the canvas renders an empty state message (not an empty canvas)

#### Scenario: Client-only rendering
- **WHEN** the component is server-rendered
- **THEN** JointJS is NOT imported on the server (dynamic import with no SSR)

### Requirement: Graph explorer auto-lays out nodes with dagre

The system SHALL apply dagre hierarchical layout to the graph after populating nodes and edges, so nodes do not overlap and edges have a readable direction.

#### Scenario: Layout applied on data load
- **WHEN** graph data is fetched and the canvas initializes
- **THEN** nodes are positioned by dagre before the paper renders

### Requirement: Graph explorer re-fetches on refresh signal

The system SHALL re-fetch `/api/graph` and re-render the canvas whenever `refreshSignal` changes.

#### Scenario: Agent patches graph while Graph Explorer tab is active
- **WHEN** the agent calls `patch_graph` and `refreshSignal` increments
- **THEN** the canvas re-fetches and redraws with the updated nodes and edges

