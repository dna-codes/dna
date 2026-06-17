import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // `@dna/ui-library` is a local `file:` dependency (symlinked), so without
  // deduping, React could resolve to two copies and break hooks. Force one.
  resolve: {
    dedupe: ["react", "react-dom", "radix-ui"],
  },
  optimizeDeps: {
    // Name the HTML entry explicitly (avoids "Could not auto-determine entry
    // point … Skipping dependency pre-bundling") and pre-bundle the linked deps
    // so the symlinked library + React resolve to a single, prebundled copy.
    entries: ["index.html"],
    include: ["react", "react-dom", "react-dom/client", "radix-ui"],
  },
});
