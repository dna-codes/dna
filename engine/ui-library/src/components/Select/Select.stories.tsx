import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

const meta = {
  title: "Forms/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Select a fruit…" />
        <Select.Icon aria-hidden>▼</Select.Icon>
      </Select.Trigger>
      <Select.Content>
        <Select.Group>
          <Select.Label>Citrus</Select.Label>
          <Select.Item value="orange" indicator="✓">
            Orange
          </Select.Item>
          <Select.Item value="lemon" indicator="✓">
            Lemon
          </Select.Item>
        </Select.Group>
        <Select.Separator />
        <Select.Group>
          <Select.Label>Berries</Select.Label>
          <Select.Item value="strawberry" indicator="✓">
            Strawberry
          </Select.Item>
          <Select.Item value="blueberry" indicator="✓" disabled>
            Blueberry (sold out)
          </Select.Item>
        </Select.Group>
      </Select.Content>
    </Select>
  ),
};
