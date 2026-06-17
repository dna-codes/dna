import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { onValueChange: { action: "valueChange" } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup
      {...args}
      aria-label="Billing period"
      defaultValue="monthly"
      style={{ display: "grid", gap: 8 }}
    >
      {["monthly", "annual"].map((value) => (
        <label
          key={value}
          style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
        >
          <RadioGroup.Item value={value}>
            <span aria-hidden>•</span>
          </RadioGroup.Item>
          {value}
        </label>
      ))}
    </RadioGroup>
  ),
};
