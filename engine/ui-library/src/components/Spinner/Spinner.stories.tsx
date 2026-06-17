import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta = {
  title: "Feedback/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Headless: the spinning visual is the consumer's. Here an inline border ring
 * is animated via the forwarded `style` (a real app would key off
 * `[data-ui-spinner]` in CSS).
 */
export const Default: Story = {
  render: () => (
    <>
      <style>{`@keyframes ui-spin { to { transform: rotate(360deg) } }`}</style>
      <Spinner
        style={{
          display: "inline-block",
          width: 24,
          height: 24,
          border: "3px solid #e2e8f0",
          borderTopColor: "#4f46e5",
          borderRadius: "50%",
          animation: "ui-spin 0.7s linear infinite",
        }}
      />
    </>
  ),
};
