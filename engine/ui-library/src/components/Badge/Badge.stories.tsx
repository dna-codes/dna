import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
  title: "Display/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "Badge" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: [undefined, "neutral", "primary", "success", "warning", "danger"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `variant` emits a `data-variant` hook the default skin maps to status colors. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Badge {...args}>Neutral</Badge>
      <Badge {...args} variant="primary">
        Primary
      </Badge>
      <Badge {...args} variant="success">
        Success
      </Badge>
      <Badge {...args} variant="warning">
        Warning
      </Badge>
      <Badge {...args} variant="danger">
        Danger
      </Badge>
    </div>
  ),
};

export const StyledByConsumer: Story = {
  args: {
    children: "Active",
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      borderRadius: 999,
      background: "#dcfce7",
      color: "#166534",
      fontSize: 12,
      fontWeight: 600,
    },
  },
};

export const AsLink: Story = {
  args: {
    asChild: true,
    children: <a href="#new">New</a>,
  },
};
