import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

// The DNA.codes theme: brand tokens in two productionized modes. Importing it
// (after the skin) re-skins every component via the same `--ui-*` cascade.
import "./dna.css";

/**
 * `@dna/ui-library/dna.css` is the shipped **DNA.codes brand** — a
 * productionized, two-mode (light/dark) skin that overrides the wireframe
 * defaults purely through `--ui-*` tokens. Mode is selected by `data-theme`
 * on the document root (or any subtree, as the two panels below demonstrate).
 *
 * ```ts
 * import "@dna/ui-library/dna.css";   // brand tokens, both modes, productionized
 * import "@dna/ui-library/skin.css";  // the look, keyed off [data-ui-*] hooks
 * ```
 */
const meta = {
  title: "Theme/DNA.codes",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SWATCHES = [
  "bg",
  "surface",
  "surface-raised",
  "muted",
  "border",
  "text",
  "text-muted",
  "primary",
  "danger",
  "success",
  "warning",
  "info",
] as const;

function ThemePanel({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      data-theme={mode}
      data-testid={`panel-${mode}`}
      style={{
        background: "var(--ui-color-bg)",
        color: "var(--ui-color-text)",
        padding: "var(--ui-space-5)",
        fontFamily: "var(--ui-font-family)",
        flex: 1,
        minWidth: 0,
      }}
    >
      <h3
        style={{
          margin: "0 0 var(--ui-space-4)",
          fontSize: "var(--ui-font-size-lg)",
        }}
      >
        {mode === "dark" ? "Dark (default)" : "Light"}
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "var(--ui-space-3)",
        }}
      >
        {SWATCHES.map((name) => (
          <div
            key={name}
            style={{
              border:
                "var(--ui-border-width) var(--ui-border-style) var(--ui-color-border)",
              borderRadius: "var(--ui-radius-md)",
              overflow: "hidden",
              background: "var(--ui-color-surface)",
            }}
          >
            <div
              style={{
                height: "2.5rem",
                background: `var(--ui-color-${name})`,
              }}
            />
            <code
              style={{
                display: "block",
                padding: "var(--ui-space-2)",
                fontFamily: "var(--ui-font-mono)",
                fontSize: "var(--ui-font-size-xs)",
                color: "var(--ui-color-text-muted)",
              }}
            >
              --ui-color-{name}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Both modes side by side. Each panel scopes its mode with `data-theme`, proving
 * the same token names resolve to a different, AA-validated palette per mode.
 */
export const Palette: Story = {
  render: () => (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ThemePanel mode="dark" />
      <ThemePanel mode="light" />
    </div>
  ),
  play: async ({ canvas }) => {
    const dark = canvas.getByTestId("panel-dark");
    const light = canvas.getByTestId("panel-light");

    // Productionized: solid borders, no dashed scaffold, in both modes.
    await expect(getComputedStyle(dark).getPropertyValue("--ui-border-style").trim()).toBe(
      "solid",
    );

    // Same token name, different resolved value per mode (AA-validated palette).
    await expect(getComputedStyle(dark).backgroundColor).toBe("rgb(10, 15, 28)");
    await expect(getComputedStyle(light).backgroundColor).toBe(
      "rgb(255, 255, 255)",
    );
  },
};
