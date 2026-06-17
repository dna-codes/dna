import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger>Open settings</Popover.Trigger>
      <Popover.Content sideOffset={6} arrow>
        <div style={{ display: "grid", gap: 8, minWidth: 200 }}>
          <strong>Dimensions</strong>
          <label>
            Width <input defaultValue="100%" />
          </label>
          <Popover.Close>Done</Popover.Close>
        </div>
      </Popover.Content>
    </Popover>
  ),
};
