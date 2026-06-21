## Why

`@dna/ui-library` ships two overlapping "top of the app" primitives: a thin
`Header` (a bare `<header>` semantic element) and a richer `AppBar` (the
GitHub-style compound chrome: brand, nav, search, actions). Two names for the
same banner landmark is confusing, and the genuinely reusable full-app
composition currently only exists as a Storybook story (`AppBar > ApplicationShell`),
so consumers can't import it. Consolidating on one `Header` name and promoting
the shell to a real component gives one obvious entry point per concept.

## What Changes

- **BREAKING**: Rename the `AppBar` compound component to `Header`
  (`Header.Root`/`Brand`/`Nav`/`Search`/`Spacer`/`Actions`). The `AppBar` export
  and `./components/AppBar` are removed.
- **BREAKING**: Remove the existing thin `Header` semantic-element component
  (the old `createSemanticElement` `<header>`); the new compound `Header.Root`
  takes over the `banner` landmark role it provided.
- **BREAKING**: Rename the styling hooks `data-ui-appbar*` → `data-ui-header*`
  in `skin.css`, the Tailwind-generated skin, and component output. The old
  `data-ui-header` (thin-Header hook) is superseded by `data-ui-header` on
  `Header.Root`.
- Promote the `AppBar > ApplicationShell` Storybook story into its own
  **`ApplicationShell`** component — the full chrome composition
  (`Application` + `Header` + `Sidebar`/`NavRail` + `Page` + `PageHeader`) —
  with its own folder, stories, and tests.
- Update the barrel (`src/index.ts`), Storybook story titles, tests, README, and
  CLAUDE.md references from `AppBar`/old-`Header` to the new layout.

## Capabilities

### New Capabilities
- `ui-header-chrome`: The compound `Header` global application bar (formerly
  `AppBar`) — a headless `banner` landmark with `Root`/`Brand`/`Nav`/`Search`/`Spacer`/`Actions`
  parts exposing `data-ui-header*` hooks.
- `ui-application-shell`: The `ApplicationShell` component — a reusable
  full-page chrome composition over the structural primitives, replacing the
  former demo-only `AppBar > ApplicationShell` story.

### Modified Capabilities
<!-- No existing OpenSpec spec covers these ui-library components; both are new. -->

## Impact

- **Package**: `engine/ui-library`
- **Components**: removes `src/components/AppBar/` and the old
  `src/components/Header/` semantic element; adds the new compound
  `src/components/Header/` and `src/components/ApplicationShell/`.
- **Barrel/exports**: `src/index.ts` export lines for `Header`, `AppBar`, plus a
  new `ApplicationShell` export.
- **Skin**: `src/styles/skin.css` `data-ui-appbar*` selectors → `data-ui-header*`;
  regenerate `src/styles/skin.generated.ts` (`npm run gen:skin`).
- **Consumers (in-repo)**: `Application.stories.tsx` uses the old thin `Header`.
- **Docs**: `engine/ui-library/README.md`, `engine/ui-library/CLAUDE.md`.
- **BREAKING for downstream consumers** of `@dna/ui-library` importing `AppBar`
  or the thin `Header`, or styling against `data-ui-appbar*`.
