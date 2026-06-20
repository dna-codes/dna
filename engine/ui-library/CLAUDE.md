# @dna/ui-library — agent instructions

## Mission

`@dna/ui-library` is a **prototyping library**. The goal is to let someone stand
up a coherent, good-looking app quickly out of three things:

1. **Structural primitives, up to the app level** — `Application` /
   `ApplicationModule` / `Page` + layout landmarks (`Header`, `Footer`,
   `Sidebar`, `Content`, `Container`).
2. **Composable components for state-machine UIs**, powered by **XState v5**.
   The headless `Machine` set (`Machine.Root` / `Machine.State` / `Machine.Send`)
   plus the `useMachine` hook are the engine; `Workflow` (stepper / sequence) is
   built on the shared `createSequenceMachine` factory. This tier grows toward
   wizards, flows, and other driven-by-state interactions. See "State machines"
   below.
3. **The fine-grained Radix widget set** — buttons, dialogs, menus, inputs, etc.

It must be **visually sound out of the box yet fully skinnable**. We achieve that
with a layered architecture — a headless behavior core plus an *opt-in* default
skin — NOT by adopting shadcn/ui's copy-paste distribution or by bundling CSS
into components. We stay a versioned, deduped npm package.

## Architecture: headless core + opt-in skin (three layers)

Each layer is independently swappable. A consumer can take the behavior alone
(fully headless), add the default skin (visually sound), or override tokens
(reskinned) — without touching component source.

- **Layer 0 — Behavior core (the components).** Built on Radix primitives.
  Ships behavior, accessibility, and **styling hooks only**. Makes **zero visual
  decisions** and bundles **no per-component CSS**.
- **Layer 1 — Tokens.** `src/styles/tokens.css` → `@dna/ui-library/styles.css`.
  The `--ui-*` CSS custom properties that are the skinning surface.
- **Layer 2 — Default skin (opt-in), via two interchangeable paths.** Both
  style components purely via `[data-ui-*]`/`data-variant`/`data-size` hooks and
  consume **only** `--ui-*` tokens; both are never bundled into a component:
  - **Plain CSS** — `src/styles/skin.css` → `@dna/ui-library/skin.css`. Import
    it (after the tokens) for the finished look.
  - **Tailwind plugin** — `src/tailwind/index.ts` → `@dna/ui-library/tailwind`.
    A dependency-free Tailwind plugin (`{ handler, config }` shape, so this repo
    needs no `tailwindcss`). It is turnkey: it injects the `--ui-*` token values
    and the **same skin** as `skin.css` into the base layer (always emitted, so
    nothing is purged; user utilities in the later `utilities` layer still win),
    and maps the tokens into Tailwind's theme
    (`bg-ui-primary`, `rounded-ui-lg`, `shadow-ui-md`, `z-ui-modal`, …). The
    injected tokens + skin are **generated from `tokens.css`/`skin.css` at build
    time** (`scripts/gen-skin.mjs` → `src/styles/skin.generated.ts`), so there is
    **no duplication** — the CSS files stay the single source of truth and
    overriding a `--ui-*` reskins both paths at once.

  Importing a skin path makes the library look finished; overriding tokens
  reskins it; omitting both leaves the components headless.

  The default skin is intentionally a **dark prototype-engine / wireframe** look
  (deep-navy canvas + dotted grid, dashed "scaffold" borders, mono annotations,
  bright-teal selection highlights; palette from dna.codes) — it should read as a
  working skeleton, not finished design. Keep it token-driven so teams can RE-BRAND
  (override `--ui-color-*`) or PRODUCTIONIZE in one line each
  (`--ui-border-style: solid`, `--ui-canvas-grid: none`). Conventions to
  preserve when extending the skin: dashed borders = scaffolded structure;
  `[data-ui-planned]` (a consumer-applied attribute) = not-yet-built work
  (dotted outline); hatched `Skeleton` = placeholder; teal highlight = current
  selection/active state.

## Component rules (non-negotiable)

Every component — existing and future — MUST follow these. When in doubt, prefer
the Radix-native approach.

1. **Build on a Radix primitive.** Import from the unified `radix-ui` package
   (namespaced, e.g. `import { Dialog, Slot } from "radix-ui";` then use
   `Dialog.Root`, `Slot.Root`). For elements Radix has no primitive for (like
   `Button`), use `Slot` to implement the `asChild` composition pattern. Do not
   hand-roll behaviour/accessibility that a Radix primitive already provides.
   Structural primitives Radix has no equivalent for are "Radix-compatible":
   same contracts, with accessibility from semantic HTML + ARIA landmarks.
2. **The component makes no visual decision.** Ship behaviour + accessibility,
   never opinionated visuals. Do **not** create component `.css` files or bundle
   styling. Expose styling hooks instead:
   - forward `className` and `style` to the underlying element, and
   - emit stable `data-*` attributes (e.g. `data-ui-button`).
3. **Variants/sizes are data attributes, not styles.** A `variant`/`size`-style
   prop is allowed, but it ONLY emits a hook (`data-variant="primary"`,
   `data-size="sm"`) for the skin layer to target. The component itself picks no
   colors, dimensions, or look. Keep the prop's allowed values as a TS union.
4. **Accessibility comes from Radix.** Don't strip or override the roles,
   keyboard handling, or ARIA that Radix manages.
5. **Forward refs + native props.** Use `forwardRef`; spread remaining props
   onto the underlying element.
6. **Support `asChild`** wherever the rendered element may need swapping.

## State machines (Tier 2)

The state-machine tier runs on **XState v5**. Public surface lives in
`src/machine/` and `src/components/Machine/`, all re-exported from the barrel:

- **`Machine.Root` / `Machine.State` / `Machine.Send`** — the headless engine.
  `Root` takes either a `machine` (it runs the actor) or an existing `actorRef`
  (you own it); `State` renders for the matching state(s); `Send` dispatches an
  event and auto-disables via `snapshot.can`. Same rules as every component:
  built with `Slot`/`asChild`, `forwardRef`, `data-ui-machine*` + `data-state`
  hooks, **no visual decisions, no CSS**.
- **`useMachine` / `useMachineActor` / `useMachineState`** — hooks; the latter
  two read the actor provided by `Machine.Root`. The XState authoring toolkit
  (`setup`, `createMachine`, `assign`, …) is re-exported too.
- **`createSequenceMachine`** — the reusable linear-sequence machine (context =
  `{ steps, value }`) that backs `Workflow`. `Workflow.Root` keeps its public
  `value`/`defaultValue`/`onValueChange` contract: in controlled mode the
  displayed value follows the prop and changes are reported via `onValueChange`
  without mutating the machine.

**Retrofitting Radix widgets onto a machine is opt-in and must NOT replace
Radix's internal behaviour or a11y** (rules #1/#4 still bind). Use the binding
adapters — `useDisclosureBinding` (→ `open`/`onOpenChange`) and
`useValueBinding` (→ `value`/`onValueChange`) — which only make a machine the
*owner of the controlled value the widget already accepts*. Do not rewrite a
widget to require a machine. See the `*.machine.stories.tsx` demos.

## Build / dependency notes

- `radix-ui` is a runtime **dependency** and is **externalized** in
  `vite.config.ts` (alongside `react`/`react-dom`) so consumers dedupe one Radix
  instance. Keep new `@radix-ui/*` and `radix-ui` imports external there.
- `xstate` and `@xstate/react` are runtime **dependencies** powering the
  state-machine tier, **externalized** the same way (`xstate`, `@xstate/react`,
  `/^xstate\//`, `/^@xstate\//`) so consumers dedupe one XState instance. They
  are re-exported through the `.` barrel (via `src/machine/`), not a separate
  `exports` path. The build keeps them out of `dist/*.js` — verify a build does
  not inline them.
- Components ship no CSS. The skinning artifacts live under `src/styles/` and
  `src/tailwind/`, all opt-in: `tokens.css` (`--ui-*`, exported as
  `@dna/ui-library/styles.css`), `skin.css` (`@dna/ui-library/skin.css`), and the
  Tailwind plugin (`@dna/ui-library/tailwind`). Components must not depend on any
  of them — they work headless without them.
- The Tailwind plugin is a **second build entry** in `vite.config.ts` (alongside
  `index`), emitted to `dist/tailwind.{js,cjs,d.ts}`. It is the module's sole
  (default) export so `require("@dna/ui-library/tailwind")` returns the plugin
  directly. The build also copies `tokens.css`→`dist/ui-library.css`,
  `skin.css`→`dist/skin.css`, and `dna.css`→`dist/dna.css`. Keep all five
  `exports` paths in `package.json` in sync when you touch these.
- `src/styles/dna.css` (`@dna/ui-library/dna.css`) is the shipped **DNA.codes
  theme**: the productionized brand (solid borders, no canvas grid) in two
  `data-theme` modes (light/dark). It is **self-contained** — it restates every
  `--ui-*` token the skin reads rather than importing `tokens.css`, so the
  `dna.css` + `skin.css` pair works without `styles.css` (a source/dist filename
  mismatch — `tokens.css` vs `ui-library.css` — makes a relative `@import`
  fragile). Its non-color structural tokens mirror `tokens.css`; if you change a
  shared structural token there, mirror it here. Colors are the white-label
  surface — keep every brand value a `--ui-*` token in both mode blocks.
- When you add or change a component's styling hooks (`data-ui-*`, `data-variant`,
  `data-size`, states), edit **`skin.css`** (and add any new token to `tokens.css`
  + the Tailwind plugin's theme map). The Tailwind plugin's injected skin is
  generated from `skin.css` by `npm run gen:skin` (which `npm run build` runs
  first), so you do **not** hand-edit `skin.generated.ts` — regenerate it. The
  skin is the contract that delivers "visually sound."

## Component layout

```
src/components/<Name>/
  <Name>.tsx          # built on a Radix primitive; headless
  <Name>.stories.tsx  # Storybook stories (CSF3)
  <Name>.test.tsx     # Vitest + Testing Library
  index.ts            # barrel: export component + its prop types
```

Re-export every component from `src/index.ts`. `Button` is the reference
implementation — copy its shape.

## Verify before finishing

```bash
npm run typecheck && npm test && npm run lint && npm run build
```

`npm test` runs the jsdom unit suite (the `unit` Vitest project: `*.test.tsx`).
Stories are also tests: `npm run test:storybook` runs every `*.stories.tsx`
(and its `play`) in a real browser via Playwright (the `storybook` Vitest
project — `@storybook/addon-vitest`). Browser mode is required so a story's
`getComputedStyle` resolves the `--ui-*` skin tokens (see `Button`'s `CssCheck`
story, the canary that proves the preview loaded `tokens.css` + `skin.css`).
