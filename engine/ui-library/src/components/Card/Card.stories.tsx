import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

const meta = {
  title: "Display/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card
      style={{
        width: 320,
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        font: "inherit",
      }}
    >
      <Card.Header style={{ padding: 16 }}>
        <Card.Title style={{ margin: 0 }}>Pro plan</Card.Title>
        <Card.Description style={{ margin: "4px 0 0", color: "#64748b" }}>
          Everything you need to scale.
        </Card.Description>
      </Card.Header>
      <Card.Body style={{ padding: "0 16px 16px" }}>
        <strong style={{ fontSize: 28 }}>$29</strong> / month
      </Card.Body>
      <Card.Footer
        style={{ padding: 16, borderTop: "1px solid #e2e8f0" }}
      >
        <button>Upgrade</button>
      </Card.Footer>
    </Card>
  ),
};
