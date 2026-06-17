import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DropdownMenu } from "./DropdownMenu";

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenu.Trigger>Open menu</DropdownMenu.Trigger>
      <DropdownMenu.Content sideOffset={4}>
        <DropdownMenu.Label>My account</DropdownMenu.Label>
        <DropdownMenu.Item>Profile</DropdownMenu.Item>
        <DropdownMenu.Item>Billing</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Invite team →</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item>Email</DropdownMenu.Item>
            <DropdownMenu.Item>Copy link</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Sign out</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  ),
};

export const WithSelections: Story = {
  render: function WithSelections() {
    const [showStatus, setShowStatus] = useState(true);
    const [position, setPosition] = useState("bottom");
    return (
      <DropdownMenu>
        <DropdownMenu.Trigger>View options</DropdownMenu.Trigger>
        <DropdownMenu.Content sideOffset={4}>
          <DropdownMenu.CheckboxItem
            checked={showStatus}
            onCheckedChange={setShowStatus}
            indicator="✓"
          >
            Status bar
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.Separator />
          <DropdownMenu.Label>Panel position</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={position} onValueChange={setPosition}>
            <DropdownMenu.RadioItem value="top" indicator="•">
              Top
            </DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="bottom" indicator="•">
              Bottom
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu>
    );
  },
};
