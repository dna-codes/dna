import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle, useTheme } from "./ThemeToggle";

// Load the DNA theme so toggling actually re-skins the preview (the control
// writes data-theme on <html>, which dna.css keys off).
import "../../styles/dna.css";

const meta = {
  title: "Appearance/ThemeToggle",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Readout() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <p style={{ margin: 0, color: "var(--ui-color-text-muted)", fontSize: "var(--ui-font-size-sm)" }}>
      preference: <strong>{theme}</strong> · in effect:{" "}
      <strong>{resolvedTheme}</strong>
    </p>
  );
}

/**
 * The canonical Light / Dark / System appearance control. Pick an option and the
 * whole surface re-skins — the control writes `data-theme` to the document and
 * persists the choice; `System` follows the OS setting. Drive it from code with
 * the `useTheme()` hook.
 */
export const Default: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "var(--ui-space-4)",
        justifyItems: "center",
        padding: "var(--ui-space-6)",
        background: "var(--ui-color-surface)",
        color: "var(--ui-color-text)",
        border:
          "var(--ui-border-width) var(--ui-border-style) var(--ui-color-border)",
        borderRadius: "var(--ui-radius-lg)",
        fontFamily: "var(--ui-font-family)",
      }}
    >
      <ThemeToggle />
      <Readout />
    </div>
  ),
};
