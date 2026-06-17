import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./Label";

const meta = {
  title: "Forms/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "Email address" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AssociatedWithInput: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 4 }}>
      <Label htmlFor="email">Email address</Label>
      <input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};
