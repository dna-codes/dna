## Why

The graph-studio's internal graph-data model uses `label` as the discriminator field on `GraphNode`, but the DNA grammar decision is that all nouns are Resources with a `type` field. Aligning the internal model to the grammar removes the mismatch before it propagates into more lenses and makes the codebase match the mental model.

## What Changes

- **BREAKING** (internal): `GraphNode.label` renamed to `GraphNode.type`
- **BREAKING** (internal): `NodeLabel` type alias renamed to `ResourceType`
- **BREAKING** (internal): `GraphEdge.label` renamed to `GraphEdge.type`
- Resource type `"role"` replaced with `"position"` — positions are what org charts show; roles are behavioural
- All downstream call sites updated: `toOrgChartData.ts`, `OrgChartCanvas.client.tsx`, org-chart page, and all tests
- No changes to `packages/core` or any external package — scope is `apps/graph-studio` only

## Capabilities

### New Capabilities

- `graph-data-resource-model`: `GraphNode` and `GraphEdge` types in `lib/graph-data.ts` use `type` as the discriminator field, matching the DNA Resource/Relationship model. `ResourceType` and `RelationshipType` replace the old `NodeLabel` alias.

### Modified Capabilities

- `org-chart-lens`: Org-chart transformer produces `type: "position"` instead of `label: "role"`, and all canvas/page code filters by `n.type` instead of `n.label`.

## Impact

- `apps/graph-studio/lib/graph-data.ts` — type renames
- `apps/graph-studio/lib/lenses/org-chart/toOrgChartData.ts` — output field and `"role"` → `"position"`
- `apps/graph-studio/components/lenses/OrgChartCanvas.client.tsx` — all `n.label` reads
- `apps/graph-studio/app/lens/org-chart/page.tsx` — filter expressions
- `apps/graph-studio/__tests__/` — OrgChartCanvas and OrgChartPage tests
- No breaking changes to any public API, npm packages, or external data sources
