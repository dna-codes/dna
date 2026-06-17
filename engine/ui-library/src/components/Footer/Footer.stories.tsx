import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer } from "./Footer";

const meta = {
  title: "Structure/Footer",
  component: Footer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A `contentinfo` landmark. Headless — styled inline here by the consumer. */
export const Default: Story = {
  args: {
    children: "© 2026 Acme",
    style: { padding: "1rem", borderTop: "1px solid #ddd" },
  },
};
