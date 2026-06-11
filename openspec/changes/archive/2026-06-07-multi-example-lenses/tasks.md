## 1. Foundation — types and registry

- [x] 1.1 Add `next_step` and `assigned_to` to `RelationshipType` in `lib/graph-data.ts`
- [x] 1.2 Create `lib/examples.ts` with `ExampleMeta` / `LensMeta` types and `EXAMPLES` array (3 entries — mass-torts, ecommerce, lending — 3 lenses each)
- [x] 1.3 Rewrite `app/page.tsx` as an example gallery rendering cards from `EXAMPLES`

## 2. Process-flow lens

- [x] 2.1 Create `lib/lenses/process-flow/fromResourceGraph.ts` — projects `process`/`step` nodes; `next_step` edges; sets `attrs.assignedTo` from `assigned_to` relationships
- [x] 2.2 Create `components/lenses/ProcessFlowCanvas.client.tsx` — left-to-right JointJS layout, step nodes with sublabel and optional role badge
- [x] 2.3 Write transformer unit tests in `lib/lenses/process-flow/fromResourceGraph.test.ts`

## 3. Runbook lens

- [x] 3.1 Create `lib/lenses/runbook/fromResourceGraph.ts` — projects `step` nodes with topological ordering, sets `attrs.assignedTo`
- [x] 3.2 Create `components/lenses/RunbookCanvas.client.tsx` — numbered vertical list; teal role-badge pill for assigned steps; no arrow rendering
- [x] 3.3 Write transformer unit tests in `lib/lenses/runbook/fromResourceGraph.test.ts`

## 4. E-commerce example fixture

- [x] 4.1 Create `examples/ecommerce/dna.json` — Apex Commerce: company, 4 departments (Catalog, Orders, Fulfillment, Payments), 8 positions, 6 persons with `fills`
- [x] 4.2 Extend fixture with order-fulfillment process: 5 steps connected by `next_step`, 3 steps with `assigned_to`
- [x] 4.3 Extend fixture with payment-failure runbook: 5 steps, 4 with `assigned_to`

## 5. Lending example fixture

- [x] 5.1 Create `examples/lending/dna.json` — ClearPath Lending: company, 4 departments (Origination, Underwriting, Servicing, Collections), 7 positions, 5 persons with `fills`
- [x] 5.2 Extend fixture with loan-application process: 5 steps (intake → credit check → underwriting review → approval decision → offer generation), `next_step` chain, 3 with `assigned_to`
- [x] 5.3 Extend fixture with loan-closing runbook: 5 steps, 3 with `assigned_to` (Loan Officer, Closing Coordinator, Compliance Reviewer)

## 6. Mass-torts fixture augmentation

- [x] 6.1 Add case-intake process to `examples/mass-torts-org/org-chart.json`: 5 steps with `next_step` and 3 `assigned_to` relationships
- [x] 6.2 Add client-onboarding runbook process: 5 steps, 4 with `assigned_to`

## 7. Org-chart pages — new routes

- [x] 7.1 Create `app/lens/mass-torts/org-chart/page.tsx` (copy of current `app/lens/org-chart/page.tsx`, updated fixture path)
- [x] 7.2 Create `app/lens/ecommerce/org-chart/page.tsx`
- [x] 7.3 Create `app/lens/lending/org-chart/page.tsx`

## 8. Process-flow pages

- [x] 8.1 Create `app/lens/mass-torts/process-flow/page.tsx`
- [x] 8.2 Create `app/lens/ecommerce/process-flow/page.tsx`
- [x] 8.3 Create `app/lens/lending/process-flow/page.tsx`

## 9. Runbook pages

- [x] 9.1 Create `app/lens/mass-torts/runbook/page.tsx`
- [x] 9.2 Create `app/lens/ecommerce/runbook/page.tsx`
- [x] 9.3 Create `app/lens/lending/runbook/page.tsx`

## 10. Navigation and shared shell

- [x] 10.1 Add a shared `LensShell` server component (`components/LensShell.tsx`) — nav bar with back-to-gallery link, example label, lens label; replaces duplicated nav in each page
- [x] 10.2 Update all 9 lens pages to use `LensShell`
- [x] 10.3 Update README to document the new examples and lens routes

## 11. Verification

- [x] 11.1 Run `pnpm test` from `apps/graph-studio` — all tests pass (update count assertions broken by fixture augmentation)
- [x] 11.2 Run `pnpm tsc --noEmit` — no TypeScript errors
- [ ] 11.3 Smoke-test each of the 9 lens routes in the browser — mass-torts, ecommerce, lending × org-chart, process-flow, runbook (dev server at localhost:3100)
