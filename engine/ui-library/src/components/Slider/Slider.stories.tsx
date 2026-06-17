import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./Slider";

const meta = {
  title: "Forms/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { "aria-label": "Volume", defaultValue: [50], style: { width: 240 } },
  argTypes: { onValueChange: { action: "valueChange" } },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: { defaultValue: [25, 75], "aria-label": undefined },
};

export const Stepped: Story = { args: { step: 10, defaultValue: [40] } };

export const Disabled: Story = { args: { disabled: true } };
