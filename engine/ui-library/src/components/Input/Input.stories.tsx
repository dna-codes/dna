import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
  title: "Forms/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { placeholder: "Type here…" },
  argTypes: {
    onChange: { action: "changed" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true, value: "Locked" } };

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};

/**
 * Headless does not mean style-less for consumers — the forwarded `style`
 * illustrates the hook. Use `[data-ui-input]` or `[data-invalid]` in your CSS.
 */
export const StyledByConsumer: Story = {
  args: {
    style: {
      padding: "0.5rem 0.75rem",
      borderRadius: 6,
      border: "1px solid #cbd5e1",
      font: "inherit",
    },
  },
};
