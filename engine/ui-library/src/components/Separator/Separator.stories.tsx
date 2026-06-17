import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./Separator";

const meta = {
  title: "Display/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <p>Above</p>
      <Separator style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
      <p>Below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: "flex", height: 24, alignItems: "center", gap: 12 }}>
      <span>Blog</span>
      <Separator
        orientation="vertical"
        style={{ width: 1, alignSelf: "stretch", background: "#e2e8f0" }}
      />
      <span>Docs</span>
    </div>
  ),
};
