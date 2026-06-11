## 1. Data model

- [x] 1.1 Add `description?: string` to `ResourceItem` in `apps/graph-studio/lib/resource-graph.ts`
- [x] 1.2 Add `description` fields to all `position` and `process` resources in `examples/ecommerce/dna.json`
- [x] 1.3 Add `description` fields to all `position` and `process` resources in `examples/lending/dna.json`
- [x] 1.4 Add `description` fields to all `position` and `process` resources in `examples/audiobook-distributor/dna.json`
- [x] 1.5 Add `description` fields to all `position` and `process` resources in `examples/mass-torts-org/org-chart.json`

## 2. Lens transform

- [x] 2.1 Create `apps/graph-studio/lib/lenses/job-description/fromResourceGraph.ts` with `JobDescriptionData`, `JobDescription`, `JobResponsibility` types and the `fromResourceGraph` function

## 3. Renderer component

- [x] 3.1 Create `apps/graph-studio/components/lenses/JobDescriptionCanvas.tsx` — document-style React component rendering one card per position

## 4. Routes

- [x] 4.1 Create `apps/graph-studio/app/lens/ecommerce/job-description/page.tsx`
- [x] 4.2 Create `apps/graph-studio/app/lens/lending/job-description/page.tsx`
- [x] 4.3 Create `apps/graph-studio/app/lens/audiobook-distributor/job-description/page.tsx`
- [x] 4.4 Create `apps/graph-studio/app/lens/mass-torts/job-description/page.tsx`

## 5. Registry

- [x] 5.1 Add `job-description` entry to `LENS_REGISTRY` in `apps/graph-studio/lib/lens-registry.ts`

## 6. Verification

- [x] 6.1 Run `npm run build` (or `next build`) in `apps/graph-studio` — no type errors
- [x] 6.2 Start dev server and confirm all four `/lens/{example}/job-description` routes render correctly
