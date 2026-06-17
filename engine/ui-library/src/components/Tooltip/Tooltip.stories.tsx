import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger>Hover or focus me</Tooltip.Trigger>
        <Tooltip.Content sideOffset={4} arrow>
          A helpful hint
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  ),
};
