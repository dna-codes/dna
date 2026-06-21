## Context

`@dna/ui-library` is a headless prototyping library: components make no visual
decisions and expose `data-ui-*` hooks consumed by the opt-in skin. Two
top-of-app primitives exist today:

- `src/components/Header/Header.tsx` — a thin `createSemanticElement("Header",
  "header", "data-ui-header")`. Used only in `Application.stories.tsx` as a
  styled banner.
- `src/components/AppBar/AppBar.tsx` — the compound chrome
  (`Root`/`Brand`/`Nav`/`Search`/`Spacer`/`Actions`), each part a `Slot`-based
  `asChild` element emitting `data-ui-appbar*`. Its `AppBar.stories.tsx` has a
  `Default` story plus an `ApplicationShell` story that composes the entire app
  chrome end-to-end.

The skin (`src/styles/skin.css`) styles `data-ui-appbar*`; the Tailwind plugin's
`skin.generated.ts` is regenerated from `skin.css` via `npm run gen:skin`.

## Goals / Non-Goals

**Goals:**
- One name — `Header` — for the global application bar, replacing both `AppBar`
  and the thin `Header`.
- A real, importable `ApplicationShell` component for the full-page composition.
- Preserve the headless contract: behavior + a11y + `data-ui-*` hooks only, no
  bundled CSS, `forwardRef`, `asChild`.
- Keep the skin visually identical after the hook rename.

**Non-Goals:**
- No new visual design or token changes beyond renaming hooks.
- No backward-compatibility shim/alias for `AppBar` or the old thin `Header`
  (this is a pre-1.0 prototyping library; clean break).
- No changes to `Application`, `Sidebar`, `Page`, `PageHeader`, `NavRail`
  internals.

## Decisions

### 1. New `Header` is the compound (former `AppBar`), not a merge of both
The thin `Header` only ever rendered a bare `<header>`; `Header.Root` already
renders `<header>` with the `banner` landmark and supports `asChild`, so it fully
subsumes the thin component. We delete the thin `Header` rather than keep a
separate callable. **Alternative considered**: make `Header` both callable
(`<Header>`) and namespaced (`<Header.Root>`) — rejected; the compound object
shape (`{ Root, Brand, … }`) matches the `AppBar`/`Table` pattern already used in
the library, and a dual callable/namespace export adds complexity for no gain.

The in-repo consumer `Application.stories.tsx` switches from
`<Header style=…>Application banner</Header>` to `<Header.Root>…</Header.Root>`
(or simply demonstrates `ApplicationShell`).

### 2. Hook rename `data-ui-appbar*` → `data-ui-header*`
Component output, `skin.css` selectors, and the generated Tailwind skin all move
from `appbar` to `header`. The thin Header's old `data-ui-header` had no skin
rule, so there is no selector collision. Regenerate `skin.generated.ts` with
`npm run gen:skin` (never hand-edit it).

### 3. `ApplicationShell` is a thin compositional component, not a new primitive
The library's components are headless primitives, but `ApplicationShell` is a
**convenience composition** — it wires `Application` > (`Header` + a flex row of
`Sidebar`/`NavRail` and `Page`/`PageHeader`). To stay faithful to the library's
"no visual decisions" rule, it ships as a small compound with named slots rather
than hardcoding content:

- `ApplicationShell.Root` — renders `Application`, emits `data-ui-app-shell`.
- `ApplicationShell.Header` — the top `Header.Root` slot (`asChild` to `Header`).
- `ApplicationShell.Body` — the flex row wrapper (`data-ui-app-shell-body`) that
  lays out sidebar + main side by side.
- `ApplicationShell.Sidebar` — wraps `Sidebar` for the rail.
- `ApplicationShell.Main` — wraps `Page` (the routed `<main>` region).

This keeps consumers composing real primitives (brand, nav items, page content
stay theirs) while giving them one import for the standard arrangement. The
former `ApplicationShell` story becomes the `Default` story of the new
component, now using these slots. **Alternative considered**: ship
`ApplicationShell` as a single fixed-markup component with props for brand/nav —
rejected; it would bake visual/content decisions into a component, violating the
headless rule and reducing flexibility. The slot composition is the minimum that
makes the arrangement reusable without opinionating content.

### 4. Story titles / catalog placement
`Structure/Header` (replacing `Structure/AppBar` and the old `Structure/Header`)
and `Structure/ApplicationShell`. README's "Application chrome" section and
CLAUDE.md's structural-primitive list update `AppBar` → `Header` and add
`ApplicationShell`.

## Risks / Trade-offs

- [Breaking change for downstream consumers importing `AppBar` or the thin
  `Header`, or styling `data-ui-appbar*`] → Acceptable pre-1.0; documented as
  **BREAKING** in the proposal and changelog. A grep across the monorepo
  confirms only in-library usage today.
- [`ApplicationShell` slot API could over-engineer a convenience wrapper] →
  Keep the slot set minimal (Root/Header/Body/Sidebar/Main); all slots support
  `asChild` so consumers can drop down to raw primitives anytime.
- [Skin regression if a `data-ui-appbar*` selector is missed] → Sweep `skin.css`
  for `appbar`, regenerate, and rely on the Storybook browser tests
  (`getComputedStyle` canary) plus a visual check.

## Migration Plan

1. Replace `import { AppBar }` → `import { Header }`; `AppBar.X` → `Header.X`.
2. Replace the thin `<Header>` usage with `<Header.Root>` (or `ApplicationShell`).
3. Update any CSS targeting `data-ui-appbar*` to `data-ui-header*`.
4. For the full-chrome layout, import `ApplicationShell` instead of copying the
   former story.

No rollback concern beyond reverting the change; no data or runtime state.

## Open Questions

- None blocking. The `ApplicationShell` slot names (`Body`/`Main`) are chosen to
  read clearly alongside `Page`/`Sidebar`; open to renaming during review.
