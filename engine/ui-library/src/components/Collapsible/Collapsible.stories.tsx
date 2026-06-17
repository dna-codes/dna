import type { Meta, StoryObj } from "@storybook/react-vite";
import { Collapsible } from "./Collapsible";

const meta = {
  title: "Navigation/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible style={{ width: 320 }}>
      <Collapsible.Trigger>@peduarte starred 3 repositories</Collapsible.Trigger>
      <Collapsible.Content>
        <div>radix-ui/primitives</div>
        <div>radix-ui/colors</div>
        <div>radix-ui/icons</div>
      </Collapsible.Content>
    </Collapsible>
  ),
};
