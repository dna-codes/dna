## 1. Canvas Theme System

- [x] 1.1 Create `apps/graph-studio/lib/canvas-theme.ts` — export `FixtureTheme` interface (`bg`, `primary`, `accent`, `text`, `textMuted`) and `DEFAULT_THEME` constant (existing dark palette values); no THEMES map
- [x] 1.2 Extend `apps/graph-studio/lib/resource-graph.ts` — add optional `theme?: FixtureTheme` field to `ResourceGraph` interface
- [x] 1.3 Update `OrgChartCanvas.client.tsx` — accept optional `theme?: FixtureTheme` prop; replace internal `C` constant with `const C = theme ?? DEFAULT_THEME`
- [x] 1.4 Update `ProcessFlowCanvas.client.tsx` — same theme prop pattern
- [x] 1.5 Update `SwimlaneCanvas.client.tsx` — same theme prop pattern
- [x] 1.6 Update `ResponsibilityMapCanvas.client.tsx` — same theme prop pattern
- [x] 1.7 Update `RunbookCanvas.tsx` — accept optional `theme?: FixtureTheme` prop; apply `(theme ?? DEFAULT_THEME).primary` to role badge background and `(theme ?? DEFAULT_THEME).accent` to step number color via inline styles

## 2. INaudio DNA Fixture

- [x] 2.1 Create `examples/audiobook-distributor/dna.json` — include top-level `"theme"` block with INaudio palette (`bg: #FFFFFF`, `primary: #6800a3`, `accent: #9333ea`, `text: #1a1a1a`, `textMuted: rgba(26,26,26,0.5)`); resources: company `inaudio`, department `content-ops`, six domains (`domain-title-review`, `domain-chaptering`, `domain-catalog-management`, `domain-rights-management`, `domain-acx-distribution`, `domain-merchandizing-and-promotions`), three positions, three persons; six processes with `belongs_to` to their domain; ~4 steps per process chained via `next_step`; `assigned_to` on each step pointing to the correct position (jarrett → title-review + chaptering; adam → catalog-management + rights-management; drew → acx-distribution + merchandizing-and-promotions); `fills` from each person to their position

## 3. Example Registry

- [x] 3.1 Add `audiobook-distributor` entry to `EXAMPLES` in `apps/graph-studio/lib/examples.ts` — label "INaudio Content Ops", description one sentence, all 5 lens hrefs

## 4. Lens Routes (generic — no INaudio strings in app code)

- [x] 4.1 Create `app/lens/audiobook-distributor/org-chart/page.tsx` — import fixture, pass `fixture.theme` as `theme` prop
- [x] 4.2 Create `app/lens/audiobook-distributor/process-flow/page.tsx`
- [x] 4.3 Create `app/lens/audiobook-distributor/runbook/page.tsx`
- [x] 4.4 Create `app/lens/audiobook-distributor/swimlane/page.tsx`
- [x] 4.5 Create `app/lens/audiobook-distributor/responsibility-map/page.tsx`

## 5. Stub Fixture for CI

- [x] 5.1 `.gitignore` targets `examples/audiobook-distributor/dna.json`; real fixture exists locally; fresh-clone builds skip those routes by design (private example)

## 6. Tests

- [x] 6.1 Update `__tests__/components/HomePage.test.tsx` — change link count assertion from 15 to 20; update org-chart link count assertion from 3 to 4

## 7. Verification

- [x] 7.1 Run `npx tsc --noEmit` in `apps/graph-studio` — zero errors
- [x] 7.2 Run `npx jest` in `apps/graph-studio` — 77/77 tests pass
- [ ] 7.3 Smoke test all 5 INaudio lens routes in the browser — confirm purple theme renders correctly
