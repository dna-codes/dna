import type { Preview } from "@storybook/react-vite";

// Render every story with the default skin: tokens first (the --ui-* values),
// then the skin (styles the [data-ui-*] hooks from those tokens). This is the
// "visually sound out of the box" look; override tokens to reskin.
import "../src/styles/tokens.css";
import "../src/styles/skin.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#0a0f1c" },
        { name: "surface", value: "#111a2e" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
