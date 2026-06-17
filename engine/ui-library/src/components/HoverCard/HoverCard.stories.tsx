import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";

const meta = {
  title: "Overlays/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCard.Trigger href="https://radix-ui.com">
        @radix-ui
      </HoverCard.Trigger>
      <HoverCard.Content sideOffset={6} arrow style={{ maxWidth: 260 }}>
        <strong>Radix UI</strong>
        <p>Unstyled, accessible primitives for building design systems.</p>
      </HoverCard.Content>
    </HoverCard>
  ),
};
