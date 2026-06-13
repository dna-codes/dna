## Why

Build mode is meant for modeling the grammar — resource and relationship *types* — but its lenses are blank. Every lens builder (`org-chart`, `reporting-chains`, `job-descriptions`, `graph-data`) constructs its view-model from **instances**, and Build mode has none. So Graph Explorer shows "No instances yet" and there is nothing else to look at. A modeler needs to *see* the grammar they're shaping: the types, how they relate, and each type's definition — without populating a single instance.

## What Changes

- Add a server-side **type-level view-model** (`buildTypeRegistryGraph`): resource types as nodes (name, category, description, stability, attribute_schema) and relationship types as directed edges (name, from→to, cardinality, description, stability). Expose it over REST at `GET /lens/type-registry` and proxy it through the app at `/api/lens/type-registry`.
- Make the four **Build-mode lenses render this type payload** instead of instances:
  - **Graph Explorer (Build)** — the full schema graph: resource types as nodes, relationship types as labeled directed edges. Reuses the existing `GraphExplorer` rendering via a type-graph data source, fixing the empty-graph problem.
  - **Org Chart (Build)** — the structural type spine as a hierarchy from structural relationship types (`belongs_to`, `reports_to`) between types, e.g. `company ← department ← position`, with `reports_to` shown as a self-relation.
  - **Reporting Chains (Build)** — the `reports_to` relationship-type wiring among role/position types.
  - **Job Descriptions (Build)** — a definition card per resource type (especially `category:role`) showing its description, a stability badge, its attribute_schema fields, and the relationship types it participates in (incoming/outgoing).
- Wire `BUILD_TABS` to `[graph-explorer, org-chart, reporting-chains, job-descriptions]` (all type-level) and scope the Build system-prompt `activate_lens` routing to these IDs.
- Build-lens empty-state copy references **types**, not instances.
- Operate-mode lenses are unchanged (still instance-based).

## Capabilities

### New Capabilities
- `type-registry-lens`: A type-level view-model of the registry (resource types as nodes, relationship types as edges, with stability/attribute metadata), its REST + app-proxy endpoint, and the four Build-mode lens panels that render it (schema graph, type org-chart, type reporting-chains, type definition cards), including type-oriented empty states.

### Modified Capabilities
<!-- build-operate-modes is not yet archived, so there is no openspec/specs entry to delta against.
     Its "Build lens set" requirement (previously graph-explorer only) is reconciled by a task in this
     change that updates that requirement's text to the expanded type-level lens set. -->

## Impact

- **MCP server (`packages/mcp`)**: new `src/lenses/type-registry.ts` (`buildTypeRegistryGraph`); `src/server.ts` adds the `GET /lens/type-registry` branch; new exported view-model types in `src/index.ts`. Rebuild `dist`.
- **App (`apps/dna-agent`)**: new `app/api/lens/type-registry/route.ts` proxy; `GraphExplorer` gains a type-graph source (prop or adapter); new `TypeOrgChartPanel`, `TypeReportingChainsPanel`, `TypeJobDescriptionsPanel` components; `LensPanelShell` `BUILD_TABS` rewired; `lib/system-prompt.ts` Build lens routing updated.
- **Specs**: new `type-registry-lens`; the unarchived `build-operate-modes` Build-lens requirement text is updated for consistency (task, not a delta).
- No data-model change — reads existing resource/relationship type records and their `stability` / `attribute_schema`.
