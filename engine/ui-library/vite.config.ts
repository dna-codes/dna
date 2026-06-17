/// <reference types="vitest/config" />
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/**/*.test.tsx",
        "src/**/*.test.ts",
        "src/test",
      ],
      bundleTypes: true,
      // Suppress cross-package ReactNode type conflicts in the monorepo.
      skipDiagnostics: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        // The Tailwind plugin ships as a separate, dependency-free entry so
        // consumers `require("@dna/ui-library/tailwind")` from their config.
        tailwind: resolve(__dirname, "src/tailwind/index.ts"),
      },
      name: "UiLibrary",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      // Keep React, Radix, and XState out of the bundle. React is a peer
      // dependency; Radix and XState are externalized so consumers dedupe a
      // single instance of each.
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "radix-ui",
        /^@radix-ui\//,
        "xstate",
        "@xstate/react",
        /^xstate\//,
        /^@xstate\//,
      ],
      output: {
        assetFileNames: "ui-library.[ext]",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    sourcemap: true,
  },
  test: {
    projects: [
      // Unit tests: the component *.test.tsx suite, in jsdom. This is what
      // `npm test` runs (see package.json: `vitest --project unit run`).
      {
        extends: true,
        test: {
          name: "unit",
          globals: true,
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          css: true,
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      // Storybook tests: every story runs (and its play function executes) in a
      // real browser via Playwright, so getComputedStyle resolves the --ui-*
      // skin tokens. Run with `npx vitest --project storybook run`.
      {
        extends: true,
        plugins: [storybookTest({ configDir: resolve(dir, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
