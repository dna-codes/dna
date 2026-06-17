import type { Meta, StoryObj } from "@storybook/react-vite";
import { Content } from "./Content";

const meta = {
  title: "Structure/Content",
  component: Content,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Content>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A presentational region for layout inside a `Page`. Not a landmark — the
 * `Page` is the route's single `<main>`.
 */
export const Default: Story = {
  args: {
    children: "Page content area",
    style: { padding: "1rem", maxWidth: 640, margin: "0 auto" },
  },
};
