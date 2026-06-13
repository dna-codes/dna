## 1. Lens definition schema

- [x] 1.1 Define `LensDefinition` types in `packages/core/src/lens/types.ts` — `target: 'schema' | 'data'`, slots `{ slot, type, ref? }`, edges `{ from, to, via }`, optional `scope[]`
- [x] 1.2 Define `ref` as `{ id: string } | { select: { name?, pathPrefix?, attribute? } }`
- [x] 1.3 Define `scope` as `{ from, via: string[], direction: 'out'|'in'|'both', depth: number|'transitive', nodeTypes?: string[] }`
- [x] 1.4 Author the lens meta-schema at `packages/schemas/meta/lens.json` (`$id: …/schemas/meta/lens`); add it to the `schemas` manifest (`meta.lens`) so `allSchemas()` registers it in Ajv; `validateLensDefinition()` wraps `ajv.getSchema('…/meta/lens')`
- [x] 1.5 Enforce: pinning (`ref`) only allowed on `target: 'data'`; `scope.from` must reference a pinned slot
- [x] 1.6 Extend (not replace) the existing `LensDefinition`/`LensNodeSlot` in `packages/core/src/index.ts` — move canonical types to `src/lens/types.ts`, add optional `target`+`scope`+`ref`, re-export from `index.ts` to preserve the import surface; `target` defaults to `'data'`

## 2. Evaluator core

- [x] 2.1 Implement `evaluateLens(def, store)` skeleton returning `LensResult` (data → `{ nodes, links }`; schema → `{ resourceTypes, relationshipTypes }`)
- [x] 2.2 Implement anchor seeding — resolve `ref.id` via `store.instance` and `ref.select` via query + predicate filter
- [x] 2.3 Implement free-slot matching — collect instances by type when no pins
- [x] 2.4 Implement scope expansion — traverse `via` links in `direction` to `depth`, with a visited-set for cycle termination, filtered by `nodeTypes`
- [x] 2.5 Implement free-edge matching — include links of declared relationship types between collected nodes
- [x] 2.6 Implement minimal schema-lens evaluation — return matched `resourceTypes` / `relationshipTypes` from the registry
- [x] 2.7 Export `evaluateLens`, `LensDefinition`, `LensResult` from `packages/core/src/index.ts`

## 3. Tests

- [x] 3.1 Unit tests: free-only data lens matches the type/relationship-type shape
- [x] 3.2 Unit tests: pinned anchor by `id` and by `select` seed correctly
- [x] 3.3 Unit tests: transitive scope expansion + `nodeTypes` filter + cycle termination
- [x] 3.4 Unit tests: validation rejects pinning on schema lens and dangling `scope.from`
- [x] 3.5 Regression test: existing `packages/core/lenses/*.json` validate as all-free data lenses unchanged

## 4. Org-chart migration (proof)

- [x] 4.1 Author `org-chart` as a declarative data lens definition (anchor/scope over company/department/position + `reports_to`/`belongs_to`/`fills`)
- [x] 4.2 Reimplement `packages/mcp/src/lenses/org-chart.ts` `buildOrgChart` to call `evaluateLens` then shape the result
- [x] 4.3 Assert evaluator-backed `buildOrgChart` yields an identical `OrgChartViewModel` on existing fixtures; remove the hardcoded traversal once green

## 5. Wrap-up

- [x] 5.1 Update README(s) for `packages/core` lens evaluation and the lens definition schema
- [x] 5.2 Note follow-on: migrate remaining mcp lenses (`reporting-chains`, `span-of-control`, `pipeline`, `people-positions`, `accounts`, `job-descriptions`) to the evaluator
