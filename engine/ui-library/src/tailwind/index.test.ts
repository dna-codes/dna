import { describe, it, expect } from "vitest";
import dnaUi from "./index";

/** Capture what the plugin pushes into Tailwind's base layer. */
function run() {
  const base: Record<string, unknown> = {};
  dnaUi.handler({
    addBase: (s) => Object.assign(base, s),
  });
  return { base };
}

describe("Tailwind plugin", () => {
  it("is the sole/default export with the { handler, config } shape", () => {
    expect(typeof dnaUi.handler).toBe("function");
    expect(dnaUi.config?.theme?.extend).toBeDefined();
  });

  it("maps the --ui-* tokens into Tailwind's theme as var() references", () => {
    const { colors, borderRadius, zIndex } = dnaUi.config.theme.extend;
    expect(colors.ui.primary).toBe("var(--ui-color-primary)");
    expect(borderRadius["ui-lg"]).toBe("var(--ui-radius-lg)");
    expect(zIndex["ui-modal"]).toBe("var(--ui-z-modal)");
  });

  it("injects token values, keyframes, and the skin into the base layer", () => {
    const { base } = run();
    // Tokens (so the var() references resolve without importing styles.css).
    expect((base[":root"] as Record<string, string>)["--ui-color-primary"]).toBe(
      "#2dd4bf",
    );
    expect(Object.keys(base).filter((k) => k.startsWith("@keyframes")).length)
      .toBeGreaterThan(0);
    // The skin, incl. variant hooks — base layer so Tailwind never purges it.
    expect(base["[data-ui-button]"]).toBeDefined();
    expect(base['[data-ui-button][data-variant="primary"]']).toBeDefined();
  });

  it("keeps token values out of the skin rules (only var() references)", () => {
    const { skinComponents } = dnaUi;
    const css = JSON.stringify(skinComponents);
    expect(css).not.toContain("#2dd4bf");
    expect(css).toContain("var(--ui-color-primary)");
  });
});
