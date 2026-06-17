import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { "aria-label": "Airplane mode" },
  argTypes: { onCheckedChange: { action: "checkedChange" } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = { args: { defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true } };
