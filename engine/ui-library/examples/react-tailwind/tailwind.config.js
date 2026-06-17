/** @type {import('tailwindcss').Config} */
// The @dna/ui-library Tailwind plugin is turnkey: it injects the --ui-* tokens
// AND the default skin (into the base layer), and maps the tokens into the
// theme so you get utilities like `bg-ui-primary` / `rounded-ui-lg`. No CSS
// imports from the library are needed.
import dnaUi from "@dna/ui-library/tailwind";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [dnaUi],
};
