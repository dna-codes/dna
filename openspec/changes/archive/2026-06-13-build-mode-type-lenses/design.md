## Context

Build mode (from the `build-operate-modes` change) is type-focused but its only lens, Graph Explorer, renders instances via `buildGraphData` — which lists instances per resource type and emits links. With no instances, `data.nodes.length === 0` and the panel shows "No instances yet." The other instance lenses (`buildOrgChart`, `buildReportingChains`, `buildJobDescriptions`) are likewise instance-driven.

The data needed for type-level lenses already exists on the registry records:
- `ResourceType`: `{ name, category, attribute_schema: AttributeSchemaEntry[], stability, description }`
- `RelationshipType`: `{ name, from, to, cardinality, stability, description }`

So no new persistence is required — only a new read-shaped view-model and panels that render it.

## Goals / Non-Goals

**Goals:**
- One server-side type-level view-model that all four Build lenses consume, keeping server surface minimal.
- Reuse the existing `GraphExplorer` JointJS rendering for the Build schema graph rather than forking a second graph component.
- Build lenses are legible with zero instances and update on the same `refreshSignal` after type patches.

**Non-Goals:**
- Editing types from a lens (read-only views; the agent still mutates types via `patch_graph`).
- A bespoke stability-promotion UI (out of scope; stability is shown, not edited, here).
- Changing Operate-mode lenses or the instance lens builders.

## Decisions

### Decision: One `type-registry` view-model, consumed client-side by all four Build lenses

Add `buildTypeRegistryGraph(store)` returning:

```ts
interface TypeRegistryViewModel {
  resourceTypes: Array<{
    name: string; category: NounCategory; description?: string;
    stability: Stability; attributes: AttributeSchemaEntry[];
  }>
  relationshipTypes: Array<{
    name: string; from: string; to: string;
    cardinality: string; description?: string; stability: Stability;
  }>
}
```

Expose at `GET /lens/type-registry` (alongside the existing `/lens/*` REST branches) and proxy via `/api/lens/type-registry`. The four Build panels each fetch this one payload and present a slice:
- **graph-explorer** → resourceTypes as nodes, relationshipTypes as edges
- **org-chart** → structural subset (`belongs_to`, `reports_to`) as a hierarchy
- **reporting-chains** → `reports_to` edges
- **job-descriptions** → one card per resourceType

*Why one endpoint over four (mirroring the instance lenses):* the registry is small and fully in memory; a single fetch avoids four round-trips and four server branches, and the type graph is the same data sliced differently. The instance lenses are separate because each does heavy instance traversal; type lenses don't.

### Decision: Reuse `GraphExplorer` via a `source` prop, not a fork

`GraphExplorer` already does layout/pan/zoom over `{ nodes, edges }`. Give it a `source: 'instances' | 'types'` prop (default `'instances'`). For `'types'` it fetches `/api/lens/type-registry` and maps `resourceTypes → nodes` (id = name, type = category) and `relationshipTypes → edges` (source = from, target = to, type = name). Self-edges (`from === to`, e.g. `reports_to: position→position`) are kept and rendered as self-loops. Empty-state copy is chosen by `source` ("No types defined yet — ask the agent to model your grammar.").

*Why a prop over a new component:* the ~300 lines of Joint setup are identical; only the fetch + mapping differ. A prop keeps one rendering path.

### Decision: New panels for the three structured Build lenses

`TypeOrgChartPanel`, `TypeReportingChainsPanel`, `TypeJobDescriptionsPanel` are new, lightweight, DOM-rendered panels (no Joint) that fetch the type-registry payload:
- **TypeOrgChartPanel** builds a hierarchy from structural relationship types. Roots are resource types that never appear as the `from` of a `belongs_to` edge; children follow `belongs_to` (to→from). `reports_to` self/peer edges annotate the node ("reports to: position").
- **TypeReportingChainsPanel** lists `reports_to`-category relationship types as `from → to` rows.
- **TypeJobDescriptionsPanel** renders a definition card per resource type: name + category, stability badge, description, attribute_schema fields (name · type · required?), and participating relationships split into outgoing (`from === thisType`) and incoming (`to === thisType`).

*Why DOM panels not Joint:* these are tables/cards/trees, matching the existing instance panels' style (e.g. `JobDescriptionsPanel`), and are cheaper than a graph engine.

### Decision: BUILD_TABS and prompt routing

`LensPanelShell` `BUILD_TABS` becomes `[graph-explorer(types), org-chart(types), reporting-chains(types), job-descriptions(types)]`. The Build branch of `buildModeSection` in `system-prompt.ts` lists these four lens IDs for `activate_lens` routing (replacing "graph-explorer only"). Tab IDs are reused (`org-chart`, `reporting-chains`, `job-descriptions`) so the agent's existing keyword routing maps naturally; the panel rendered differs by mode.

## Risks / Trade-offs

- **Shared tab IDs across modes** (`org-chart` exists in both Build and Operate) → the active-lens fallback in `LensPanelShell` already keys off the current mode's tab set, so switching modes re-resolves correctly. Risk: agent `activate_lens({ lensId: 'org-chart' })` means different panels per mode — acceptable, since the agent prompt is mode-scoped.
- **Type org-chart hierarchy is degenerate for flat registries** → with few structural relationship types the "tree" may be one or two levels. Mitigation: fall back to listing types grouped by category when no `belongs_to` structure exists, so the panel is never blank when types exist.
- **Wildcard structural relationship types** → the seed packs declare `belongs_to` as `*→*` (the concrete containment lives in instance links, not the type). Such wildcard edges cannot nest types, so the org-chart treats only concrete (`from`/`to` ≠ `*`) `belongs_to`/`reports_to` edges as structural; wildcard-only registries fall through to category grouping. The schema-graph (Graph Explorer) drops `*` endpoints naturally since no node has id `*`.
- **`reports_to` self-reference** (`position → position`) can't nest in a literal tree → render it as a node annotation, not a parent edge, to avoid cycles.
- **Stale `build-operate-modes` spec text** ("graph-explorer only") → reconciled by a task that edits that change's spec requirement; no functional risk.

## Resolved Questions

- **Type org-chart with no `belongs_to` spine** → Falls back to listing resource types grouped by category, so the lens always shows something useful when types exist.
