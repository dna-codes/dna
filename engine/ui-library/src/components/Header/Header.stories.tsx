import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./Header";

const meta = {
  title: "Structure/Header",
  component: Header,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A `banner` landmark. Headless — styled inline here by the consumer. */
export const Default: Story = {
  args: {
    children: "Application banner",
    style: { padding: "1rem", borderBottom: "1px solid #ddd" },
  },
};
