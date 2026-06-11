## Context

`lib/graph-data.ts` defines the internal wire format used by every lens in graph-studio. Its current shape:

```typescript
export type NodeLabel = 'domain'|'process'|'step'|'group'|'role'|'person'
export interface GraphNode { id: string; label: NodeLabel; name: string; parentId?: string }
export interface GraphEdge { id: string; source: string; target: string; label?: string }
```

The DNA grammar has settled on "all nouns are Resources with a `type` field". Using `label` as the discriminator is a mismatch that will confuse new lens authors as they join and grow the codebase. The rename is contained to a single module and its call sites — no network, no external packages, no migrations.

## Goals / Non-Goals

**Goals:**
- Rename `GraphNode.label` → `GraphNode.type` and `NodeLabel` → `ResourceType`
- Rename `GraphEdge.label` → `GraphEdge.type`
- Replace resource type string `"role"` with `"position"` throughout
- Keep all existing tests green (updated to new field name)
- Keep the canvas rendering and org-chart page behaviour identical

**Non-Goals:**
- Changing `packages/core` DNA primitives — that is a future grammar-level proposal
- Adding new resource types beyond the existing set
- Changing the layout, visual style, or fixture data structure of the org chart

## Decisions

### 1. Rename `label` → `type` on both `GraphNode` and `GraphEdge`

The proposal establishes `type` as the discriminator for both Resources and Relationships. Keeping `label` would require a dual-field approach or a compatibility shim; a clean rename is simpler and the blast radius is fully known (grep shows 6 files).

*Alternative considered*: add `type` as a new field and deprecate `label`. Rejected — this is pre-v1 internal code with no external consumers; deprecation adds noise without benefit.

### 2. `ResourceType` as a named union, `RelationshipType` as a named union

Promotes the string literals to named types, making the discriminator intent explicit in the type system. Future resource types (e.g., `"trigger"`, `"operation"`) are added here in one place.

### 3. Replace `"role"` with `"position"` as a resource type string

Org charts show positions (slots in a hierarchy that persons fill), not roles (behavioural responsibilities). Using `"position"` is semantically correct and avoids confusion with the future `role` concept in DNA grammar. The canvas `LEVEL_ORDER` and `SIZES` constants already have `"role"` — these are renamed in the same pass.

### 4. No runtime migration needed

All data is derived at render time from the mass-tort fixture via `toOrgChartData`. There is no persisted JSON or API response that uses `label` — the rename is purely a TypeScript and runtime object key change.

## Risks / Trade-offs

- [Rename ripple] A call site is missed → TypeScript catches it at build time; `tsc --noEmit` in CI is the backstop.
- [Test coverage gap] A test checks the old field name and silently passes on a stale mock → All mock constructors return objects with the new field; tests are updated in the same PR.

## Migration Plan

1. Update `lib/graph-data.ts` types
2. Update `toOrgChartData.ts` (output fields + `"role"` → `"position"`)
3. Update `OrgChartCanvas.client.tsx` (all `n.label` reads + `LEVEL_ORDER`/`SIZES` key)
4. Update `app/lens/org-chart/page.tsx` (filter expressions)
5. Update `__tests__/` (field names + `"role"` → `"position"` in fixtures)
6. Run `npm test` from graph-studio — all tests green
7. Run `npm run build` — TypeScript clean

Rollback: revert the PR; no data migration to undo.
