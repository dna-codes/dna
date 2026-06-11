## Context

Graph Studio renders DNA fixtures through five lens transformers. All three existing examples share the same dark brand palette baked into the canvas components. INaudio has a distinct light/purple identity that should apply to their lenses — but INaudio-specific code should not live in the app. The fixture itself should be the sole carrier of its own identity.

## Goals / Non-Goals

**Goals:**
- Add `examples/audiobook-distributor/dna.json` with INaudio Content Operations data and an embedded `theme` block — the fixture is fully self-describing
- Extend `ResourceGraph` with an optional `theme?: FixtureTheme` field so any fixture can opt into a custom palette
- Thread the theme from fixture → page → canvas component
- Add all 5 lens routes under `app/lens/audiobook-distributor/`; page code is generic (no INaudio strings)
- `examples/audiobook-distributor/` is gitignored — private fixtures stay local

**Non-Goals:**
- Changing any existing example's visual output
- Runtime theme switching; themes are static, embedded in the fixture
- A full design-token system; only the five tokens each canvas already uses (`bg`, `primary`, `accent`, `text`, `textMuted`) need theming
- Storing the example registry label/description anywhere except the fixture's `name`/`description` fields and `lib/examples.ts`

## Decisions

### 1. Theme lives in the fixture, not in app code

The `ResourceGraph` interface gains an optional `theme?: FixtureTheme` field. A fixture that wants custom branding includes it:

```json
{
  "name": "INaudio Content Ops",
  "theme": { "bg": "#FFFFFF", "primary": "#6800a3", "accent": "#9333ea", "text": "#1a1a1a", "textMuted": "rgba(26,26,26,0.5)" },
  "resources": [...],
  "relationships": [...]
}
```

**Why:** App code stays generic. No `THEMES['audiobook-distributor']` map. Any future private fixture brings its own palette without touching the app.

**Alternative considered:** `THEMES` map keyed by example id in `lib/canvas-theme.ts`. Rejected because it embeds client-specific identifiers in the app bundle.

### 2. `FixtureTheme` type exported from `lib/canvas-theme.ts`

`lib/canvas-theme.ts` exports only:
- `FixtureTheme` interface (`bg`, `primary`, `accent`, `text`, `textMuted`)
- `DEFAULT_THEME` constant (existing dark palette)

No `THEMES` map. The page imports the fixture (which may have `.theme`) and passes `fixture.theme ?? undefined` to the canvas. The canvas falls back to `DEFAULT_THEME` when no theme is provided.

### 3. Canvas components accept `theme?: FixtureTheme`

Each canvas receives an optional `theme` prop. Internally it uses `const C = theme ?? DEFAULT_THEME` instead of the previous hardcoded `C` constant. This is a drop-in swap with zero visible change for existing routes.

### 4. Page routes are fully generic

The `audiobook-distributor` page files contain no INaudio strings. They follow the exact same pattern as existing lens pages, importing from `../../../../examples/audiobook-distributor/dna.json` and passing `fixture.theme` to the canvas. The fixture's `name` field drives the `LensShell` label; the fixture is the source of truth.

### 5. INaudio brand palette (embedded in fixture)

| Token      | Value                      |
|------------|----------------------------|
| `bg`       | `#FFFFFF`                  |
| `primary`  | `#6800a3`                  |
| `accent`   | `#9333ea`                  |
| `text`     | `#1a1a1a`                  |
| `textMuted`| `rgba(26,26,26,0.5)`       |

## Risks / Trade-offs

- **Existing tests count links (15 total):** Adding the 4th example adds 5 more links → homepage test assertion updates to 20.
- **`ResourceGraph` is extended:** Adding `theme?` is backward-compatible (optional field). Existing fixtures without it continue to work.
- **Fixture is gitignored:** The 5 lens routes reference `examples/audiobook-distributor/dna.json` via a static import. If a developer clones the repo without the fixture, Next.js will fail to compile those routes. A stub fixture or conditional import would prevent this — handled by providing an optional stub in the tasks.
