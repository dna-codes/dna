## 1. Foundation

- [x] 1.1 Update `lib/examples.ts` — add `swimlane` and `responsibility-map` LensMeta entries to all three EXAMPLES
- [x] 1.2 Create `lib/lenses/swimlane/fromResourceGraph.ts` — groups all steps by assigned position into `SwimlaneData` lanes; topologically orders steps within each lane; collects cross-lane `next_step` edges; "Unassigned" lane for unassigned steps
- [x] 1.3 Create `lib/lenses/responsibility-map/fromResourceGraph.ts` — emits department, position, step nodes; `has_position` edges (dept→position); `assigned_to` edges (position→step); unassigned steps included with no edges

## 2. Swimlane canvas

- [x] 2.1 Create `components/lenses/SwimlaneCanvas.client.tsx` — CSS lane bands as outer divs, one JointJS Paper per lane containing that lane's steps laid out left-to-right; cross-lane arrows rendered in a top-level overlay Paper
- [x] 2.2 Create `components/lenses/SwimlaneCanvas.tsx` — `next/dynamic` wrapper (`ssr: false`)
- [x] 2.3 Add swimlane CSS to `globals.css` — `.swimlane-wrap`, `.swimlane-lane`, `.swimlane-lane-label`, `.swimlane-lane-body`
- [x] 2.4 Write transformer unit tests in `__tests__/lenses/fromResourceGraph.swimlane.test.ts`

## 3. Responsibility map canvas

- [x] 3.1 Create `components/lenses/ResponsibilityMapCanvas.client.tsx` — radial sector layout: inner ring = departments (teal circles), middle ring = positions (slate rects) within their sector, outer ring = assigned steps fanned around their position; unassigned steps in a dedicated cluster; thin accent lines, no arrowheads
- [x] 3.2 Create `components/lenses/ResponsibilityMapCanvas.tsx` — `next/dynamic` wrapper (`ssr: false`)
- [x] 3.3 Write transformer unit tests in `__tests__/lenses/fromResourceGraph.responsibilityMap.test.ts`

## 4. Swimlane pages

- [x] 4.1 Create `app/lens/mass-torts/swimlane/page.tsx`
- [x] 4.2 Create `app/lens/ecommerce/swimlane/page.tsx`
- [x] 4.3 Create `app/lens/lending/swimlane/page.tsx`

## 5. Responsibility map pages

- [x] 5.1 Create `app/lens/mass-torts/responsibility-map/page.tsx`
- [x] 5.2 Create `app/lens/ecommerce/responsibility-map/page.tsx`
- [x] 5.3 Create `app/lens/lending/responsibility-map/page.tsx`

## 6. Verification

- [x] 6.1 Run `npx jest --passWithNoTests` — all tests pass
- [x] 6.2 Run `npx tsc --noEmit` — no TypeScript errors
- [ ] 6.3 Smoke-test all 6 new routes in the browser (dev server at localhost:3100)
