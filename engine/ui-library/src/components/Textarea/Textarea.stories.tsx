import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea";

const meta = {
  title: "Forms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { placeholder: "Write something…", rows: 4 },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true, value: "Locked" } };

export const Invalid: Story = { args: { "aria-invalid": true } };

export const StyledByConsumer: Story = {
  args: {
    style: {
      padding: "0.5rem 0.75rem",
      borderRadius: 6,
      border: "1px solid #cbd5e1",
      font: "inherit",
      width: 320,
    },
  },
};
