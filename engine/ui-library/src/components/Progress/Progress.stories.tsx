import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./Progress";

const meta = {
  title: "Feedback/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { value: 60, "aria-label": "Loading" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The fill width is driven by the consumer from Radix's `data-value`/`data-max`
 * via a CSS variable — here illustrated inline through `indicatorProps.style`.
 */
export const Default: Story = {
  render: (args) => (
    <div
      style={{
        width: 280,
        height: 10,
        background: "#e2e8f0",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <Progress
        {...args}
        style={{ display: "block", height: "100%" }}
        indicatorProps={{
          style: {
            display: "block",
            height: "100%",
            background: "#4f46e5",
            width: `${args.value ?? 0}%`,
            transition: "width 200ms ease",
          },
        }}
      />
    </div>
  ),
};
