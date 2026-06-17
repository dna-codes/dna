/**
 * @dna/ui-library — Tailwind plugin.
 *
 * The second skinning path, alongside the plain-CSS `skin.css`. It does NOT
 * duplicate token values: every theme entry below points at a `--ui-*` CSS
 * custom property, so the tokens stay the single source of truth. Override a
 * `--ui-*` variable and both the utilities and the default skin reskin together.
 *
 * Usage (Tailwind v3 config) — the plugin alone is turnkey:
 *
 *   // tailwind.config.js
 *   const dnaUi = require("@dna/ui-library/tailwind");
 *   module.exports = { plugins: [dnaUi] };
 *
 * That injects everything: the `--ui-*` token values (`:root`), the default
 * skin (the SAME rules as `skin.css`), and the token-backed theme. So Tailwind
 * users do NOT need to import `styles.css` or `skin.css` — though importing
 * them is harmless.
 *
 * The tokens + skin go into Tailwind's **base** layer. That matters: the skin is
 * keyed on `[data-ui-*]` attribute selectors (no class token), so emitting it as
 * `components` would let Tailwind's JIT purge it; the base layer is always
 * emitted. Utility classes still win because Tailwind outputs `utilities` after
 * `base`, so e.g. `className="bg-red-500"` overrides the default surface.
 *
 * You also get token-backed utilities — `bg-ui-primary`, `text-ui-muted`,
 * `rounded-ui-lg`, `shadow-ui-md`, `gap-ui-4`, `z-ui-modal`, `font-ui`, etc. —
 * that re-theme when you override the variables.
 *
 * The injected tokens + skin are generated from `tokens.css`/`skin.css` at build
 * time (see `scripts/gen-skin.mjs`), so there is a single source of truth and no
 * drift. This module is dependency-free: it exports Tailwind's
 * `{ handler, config }` plugin shape directly, so the library does not depend on
 * `tailwindcss`.
 */
import { tokensBase, skinComponents } from "../styles/skin.generated";

/** Minimal shape of the Tailwind plugin API we touch (kept local to avoid a dep). */
interface PluginAPI {
  addBase: (styles: Record<string, unknown>) => void;
}

const colors = {
  primary: "var(--ui-color-primary)",
  "primary-hover": "var(--ui-color-primary-hover)",
  "primary-active": "var(--ui-color-primary-active)",
  "on-primary": "var(--ui-color-on-primary)",
  bg: "var(--ui-color-bg)",
  surface: "var(--ui-color-surface)",
  "surface-raised": "var(--ui-color-surface-raised)",
  "surface-sunken": "var(--ui-color-surface-sunken)",
  muted: "var(--ui-color-muted)",
  "muted-hover": "var(--ui-color-muted-hover)",
  border: "var(--ui-color-border)",
  "border-strong": "var(--ui-color-border-strong)",
  text: "var(--ui-color-text)",
  "text-muted": "var(--ui-color-text-muted)",
  "text-subtle": "var(--ui-color-text-subtle)",
  "text-on-muted": "var(--ui-color-text-on-muted)",
  danger: "var(--ui-color-danger)",
  "danger-hover": "var(--ui-color-danger-hover)",
  "on-danger": "var(--ui-color-on-danger)",
  success: "var(--ui-color-success)",
  "on-success": "var(--ui-color-on-success)",
  warning: "var(--ui-color-warning)",
  "on-warning": "var(--ui-color-on-warning)",
  info: "var(--ui-color-info)",
  overlay: "var(--ui-color-overlay)",
  selection: "var(--ui-color-selection)",
  planned: "var(--ui-color-planned)",
} as const;

const spacing = {
  "ui-1": "var(--ui-space-1)",
  "ui-2": "var(--ui-space-2)",
  "ui-3": "var(--ui-space-3)",
  "ui-4": "var(--ui-space-4)",
  "ui-5": "var(--ui-space-5)",
  "ui-6": "var(--ui-space-6)",
} as const;

const borderRadius = {
  ui: "var(--ui-radius-md)",
  "ui-sm": "var(--ui-radius-sm)",
  "ui-md": "var(--ui-radius-md)",
  "ui-lg": "var(--ui-radius-lg)",
  "ui-xl": "var(--ui-radius-xl)",
  "ui-pill": "var(--ui-radius-pill)",
} as const;

const boxShadow = {
  "ui-sm": "var(--ui-shadow-sm)",
  "ui-md": "var(--ui-shadow-md)",
  "ui-lg": "var(--ui-shadow-lg)",
  "ui-focus": "var(--ui-focus-ring)",
} as const;

const fontSize = {
  "ui-xs": "var(--ui-font-size-xs)",
  "ui-sm": "var(--ui-font-size-sm)",
  "ui-md": "var(--ui-font-size-md)",
  "ui-lg": "var(--ui-font-size-lg)",
  "ui-xl": "var(--ui-font-size-xl)",
} as const;

const fontWeight = {
  "ui-normal": "var(--ui-font-weight-normal)",
  "ui-medium": "var(--ui-font-weight-medium)",
  "ui-semibold": "var(--ui-font-weight-semibold)",
} as const;

const zIndex = {
  "ui-popover": "var(--ui-z-popover)",
  "ui-overlay": "var(--ui-z-overlay)",
  "ui-modal": "var(--ui-z-modal)",
  "ui-toast": "var(--ui-z-toast)",
} as const;

const fontFamily = {
  ui: "var(--ui-font-family)",
  "ui-mono": "var(--ui-font-mono)",
} as const;

/**
 * The plugin's Tailwind config contribution: token-backed theme extensions.
 * Also hung off the default export as `.themeExtend` so consumers can spread it
 * into a custom config instead of registering the plugin as a whole.
 */
const themeExtend = {
  colors: { ui: colors },
  spacing,
  borderRadius,
  boxShadow,
  fontSize,
  fontWeight,
  zIndex,
  fontFamily,
};

/**
 * Tailwind plugin object (`{ handler, config }`). The handler injects the
 * `--ui-*` tokens, keyframes, and the full default skin into the base layer, so
 * the plugin alone delivers the finished look (and nothing is purged).
 *
 * This is the module's ONLY export, so `require("@dna/ui-library/tailwind")`
 * returns the plugin directly (no `.default`), ready to drop into `plugins: []`.
 * For a tokens-only (headless) setup, skip the plugin and spread the exposed
 * `themeExtend` into your own config; the raw `tokensBase`/`skinComponents`
 * style trees are attached too for advanced composition.
 */
const dnaUiPlugin = {
  handler: ({ addBase }: PluginAPI) => {
    addBase({ ...tokensBase, ...skinComponents });
  },
  config: {
    theme: {
      extend: themeExtend,
    },
  },
  themeExtend,
  tokensBase,
  skinComponents,
};

export default dnaUiPlugin;
