# @dna/ui-library

A **prototyping library** for standing up coherent React apps fast: structural
primitives up to the app level, composable components for state-machine UIs, and
a full Radix widget set — **visually sound out of the box yet fully skinnable**.
Built on [Radix UI](https://www.radix-ui.com/) primitives, documented and
developed with [Storybook](https://storybook.js.org/).

> **Architecture:** a headless behavior core plus an *opt-in* default skin, in
> three independently swappable layers:
> 1. **Behavior** — components built on Radix; behaviour + accessibility + stable
>    styling hooks (`data-ui-*` attributes, forwarded `className`/`style`), and
>    **no bundled visual styling**.
> 2. **Tokens** — `--ui-*` CSS custom properties (`@dna/ui-library/styles.css`).
> 3. **Default skin (two interchangeable paths)** — either the plain stylesheet
>    `@dna/ui-library/skin.css` (`[data-ui-*]` selectors) **or** the Tailwind
>    plugin `@dna/ui-library/tailwind` (maps the same `--ui-*` tokens into
>    Tailwind's theme). Both consume only tokens; pick whichever fits your stack.
>
> Take the behavior alone (headless), add a skin (finished look), or override
> tokens (reskin both paths at once) — without editing component source. This is
> shadcn/ui's token-and-variant *philosophy* without its copy-paste distribution:
> we stay a versioned, deduped npm package. See [Component conventions](#component-conventions).

## The default look: a prototype engine

The default skin is deliberately a **dark wireframe / blueprint** aesthetic — a
dotted canvas grid, dashed "scaffold" borders, mono annotations, and teal
selection highlights (palette from [dna.codes](https://dna.codes)). It reads as a
*working skeleton*, signalling "this is structure + behaviour, not finished
design." The intent is that teams keep the structure and state machine, then make
it theirs — including swapping in a light theme by overriding the surface/text
tokens.

Conventions baked into the skin:

| Convention | Meaning |
| ---------- | ------- |
| Dashed borders | scaffolded structure (not finalized) |
| Dotted canvas grid | the prototype "surface" (drawn behind `Application`) |
| `data-ui-planned` | add to **any** element to flag not-yet-built work (dotted outline + "planned" tag) |
| Hatched `Skeleton` | placeholder content |
| Teal highlight / ring | the current selection / active state |

Two ways to evolve it — both are token-only, no component changes:

```css
:root {
  /* RE-BRAND: point the palette at your colors */
  --ui-color-primary: #7c3aed;
  /* PRODUCTIONIZE: drop the wireframe cues */
  --ui-border-style: solid;
  --ui-canvas-grid: none;
}
```

## Tech stack

| Concern        | Tool                          |
| -------------- | ----------------------------- |
| Foundation     | [Radix UI](https://www.radix-ui.com/) primitives (unstyled, headless, accessible) |
| Components     | React 19 + TypeScript         |
| Dev / docs     | Storybook 10 (react-vite)     |
| Build          | Vite 7 library mode + `vite-plugin-dts` |
| Tests          | Vitest 4 + Testing Library    |
| Styling        | Headless components + opt-in tokens, default `skin.css`, **and** a Tailwind plugin (no CSS bundled into components). |
| Lint / format  | ESLint + Prettier             |
| Runtime        | Node 20.19+ (LTS 24 recommended — see `.nvmrc`) |

## Getting started

```bash
npm install
npm run dev        # start Storybook at http://localhost:6006
```

## Scripts

| Script                   | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Run Storybook in watch mode.                 |
| `npm run build`          | Type-check and build the distributable library to `dist/`. |
| `npm run build-storybook`| Build a static Storybook site.               |
| `npm test`               | Run the unit tests once.                     |
| `npm run test:watch`     | Run tests in watch mode.                      |
| `npm run lint`           | Lint the codebase.                           |
| `npm run typecheck`      | Type-check without emitting.                 |
| `npm run format`         | Format source with Prettier.                 |

## Project structure

```
src/
  components/
    Button/
      Button.tsx          # component (built on a Radix primitive)
      Button.stories.tsx  # Storybook stories
      Button.test.tsx     # unit tests
      index.ts            # component barrel
  styles/
    tokens.css            # --ui-* design tokens (the skinning surface)
    skin.css              # opt-in default skin (styles the [data-ui-*] hooks)
  tailwind/
    index.ts              # opt-in Tailwind plugin (same tokens → Tailwind theme)
  utils/
    clsx.ts               # classname helper
  index.ts                # public entry point
.storybook/               # Storybook configuration
```

Components ship **no** `.css` file — they are headless. The default look is
delivered by an opt-in skin (plain CSS or the Tailwind plugin); without it, you
style components via the forwarded `className` or their `data-*` hooks.

## Consuming the library

### Headless (bring your own styles)

```tsx
import { Button } from "@dna/ui-library";

export function Example() {
  // Headless: className and data-* are styling hooks you target however you like.
  return (
    <Button className="my-btn" onClick={() => alert("hi")}>
      Click me
    </Button>
  );
}
```

### Visually sound — option A: the default CSS skin

Import the tokens, then the skin. Components render finished; override any
`--ui-*` token to reskin.

```tsx
import "@dna/ui-library/styles.css"; // --ui-* token values
import "@dna/ui-library/skin.css";   // default look, keyed off [data-ui-*]
import { Button } from "@dna/ui-library";

<Button variant="primary" size="lg">Save</Button>; // variant/size emit hooks
```

### Visually sound — option B: the Tailwind plugin

The plugin alone is turnkey — no CSS imports needed:

```js
// tailwind.config.js
const dnaUi = require("@dna/ui-library/tailwind");
module.exports = { plugins: [dnaUi] };
```

It injects the `--ui-*` token values and the **same** default skin as `skin.css`
into Tailwind's `base` layer (always emitted, never purged; your utility classes
— output in the later `utilities` layer — still override it), and maps the
tokens into Tailwind's theme. So you also get token-backed utilities —
`bg-ui-primary`, `text-ui-muted`, `rounded-ui-lg`, `shadow-ui-md`, `z-ui-modal`,
`font-ui` — that re-theme when you override the variables.

The injected tokens + skin are generated from `tokens.css`/`skin.css` at build
time, so no token value is duplicated and the two skin paths never drift. For a
headless (tokens-only) Tailwind setup, skip the plugin and spread its exposed
`themeExtend` into your own config instead.

Every component supports Radix's [`asChild`](https://www.radix-ui.com/primitives/docs/guides/composition)
composition pattern, so you can keep the behaviour while rendering your own element:

```tsx
<Button asChild>
  <a href="/dashboard">Go to dashboard</a>
</Button>
```

`react` and `react-dom` are peer dependencies. `radix-ui` is a runtime
dependency and is externalized from the bundle so apps dedupe a single Radix
instance. The skinning artifacts are all opt-in: `@dna/ui-library/styles.css`
(the `--ui-*` tokens), `@dna/ui-library/skin.css` (the default CSS skin), and
`@dna/ui-library/tailwind` (the Tailwind plugin). `tailwindcss` is **not** a
dependency of this package — the plugin is dependency-free and only loaded by
consumers who use it.

## Component conventions

This library's foundation is a **headless Radix behavior core plus an opt-in
default skin**. Every component MUST follow these rules:

1. **Build on a Radix primitive.** Import from the `radix-ui` package (e.g.
   `import { Dialog, Slot } from "radix-ui";`). For elements Radix has no
   primitive for (like `Button`), use `Slot` to implement the `asChild`
   composition pattern. Never reach for a bespoke implementation when a Radix
   primitive exists.
2. **The component makes no visual decision.** Ship behaviour and accessibility,
   not visuals. Do **not** add a component `.css` file or bundle styling. Expose
   styling hooks instead: forward `className`/`style` and emit stable `data-*`
   attributes (e.g. `data-ui-button`). `variant`/`size`-style props are allowed
   but only emit a hook (`data-variant`, `data-size`) for the skin to target —
   the component itself picks no look. The default look lives in the opt-in
   `skin.css`, keyed off these hooks.
3. **Preserve accessibility.** Rely on Radix's built-in semantics, keyboard
   handling, and ARIA. Don't strip or override roles/attributes Radix manages.
4. **Forward refs and native props.** Use `forwardRef` and spread the rest of
   the props onto the underlying element.
5. **Support `asChild`** wherever the underlying element may need to be swapped.

## Adding a component

1. Create `src/components/<Name>/` with `<Name>.tsx`, `<Name>.stories.tsx`,
   `<Name>.test.tsx`, and `index.ts` (no `.css` file — components are headless).
2. Build it on the appropriate Radix primitive from the `radix-ui` package.
3. Forward `className`/`ref`, spread native props, expose `data-*` hooks, and
   support `asChild` where relevant — see [Component conventions](#component-conventions).
4. Re-export it from `src/index.ts`.
5. Run `npm test`, `npm run typecheck`, and `npm run dev` to verify.

`Button` is the reference implementation — copy its shape when scaffolding new
components.
