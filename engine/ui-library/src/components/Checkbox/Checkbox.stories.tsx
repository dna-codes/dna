import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "✓", "aria-label": "Accept terms" },
  argTypes: { onCheckedChange: { action: "checkedChange" } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // Clicking toggles the Radix-managed aria-checked state from false to true.
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole("checkbox", { name: /accept terms/i });
    await expect(checkbox).toHaveAttribute("aria-checked", "false");
    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute("aria-checked", "true");
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

export const Indeterminate: Story = {
  args: { checked: "indeterminate", children: "–" },
};

export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: (args) => (
    <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <Checkbox {...args} aria-label={undefined} />
      Subscribe to the newsletter
    </label>
  ),
};
