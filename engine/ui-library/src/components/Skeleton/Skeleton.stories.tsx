import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Feedback/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  background: "#e2e8f0",
  borderRadius: 6,
};

export const CardPlaceholder: Story = {
  render: () => (
    <div style={{ width: 280, display: "grid", gap: 12 }}>
      <Skeleton style={{ ...base, height: 120 }} />
      <Skeleton style={{ ...base, height: 16, width: "70%" }} />
      <Skeleton style={{ ...base, height: 16, width: "40%" }} />
    </div>
  ),
};
