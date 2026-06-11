## Why

Graph Studio currently has three generic business examples (mass-torts, ecommerce, lending) that demonstrate DNA lenses with neutral styling. Adding a real-world client example — INaudio's Content Operations department — validates that the lens system works with domain-specific operational data and that per-example theming is possible, moving the app closer to a client-facing demo.

## What Changes

- New DNA fixture at `examples/audiobook-distributor/dna.json` modelling INaudio > Content Operations: the company, the department, three positions (Adam Barresse / Director, Jarrett Catcott / Specialist, Drew Hill / Specialist), and six operational domains with their processes and steps (title-review, chaptering, catalog-management, rights-management, acx-distribution, merchandizing-and-promotions)
- New example entry `audiobook-distributor` added to `lib/examples.ts` EXAMPLES registry with all 5 lens hrefs
- 15 new lens route pages under `app/lens/audiobook-distributor/[lens]/page.tsx`
- Per-example theme system: a `CanvasTheme` type + `THEMES` map keyed by example id; INaudio theme uses their brand purple `#6800a3` accent on a clean white/light background; existing examples keep their current dark theme
- All five JointJS canvas components (`OrgChartCanvas`, `ProcessFlowCanvas`, `SwimlaneCanvas`, `ResponsibilityMapCanvas`) and the server `RunbookCanvas` accept an optional `theme` prop and apply it when provided

## Capabilities

### New Capabilities
- `audiobook-distributor-example`: DNA fixture + all 5 lens routes for INaudio Content Operations
- `canvas-theming`: Per-example `CanvasTheme` type, `THEMES` registry, and theme prop threading through canvas components

### Modified Capabilities
- `example-registry`: Add `audiobook-distributor` as a fourth entry with 5 lenses

## Impact

- `lib/examples.ts` — one new entry
- `lib/canvas-theme.ts` — new file
- `examples/audiobook-distributor/dna.json` — new file
- `app/lens/audiobook-distributor/*/page.tsx` — 5 new route pages
- `components/lenses/*.tsx` — each canvas gains an optional `theme` prop
- `app/lens/*/page.tsx` (existing 15 pages) — no changes required; theme prop is optional
- No new dependencies
