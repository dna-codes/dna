import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";

const meta = {
  title: "Display/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <Avatar.Image
        src="https://i.pravatar.cc/80?img=12"
        alt="Pedro Duarte"
      />
      <Avatar.Fallback delayMs={600}>PD</Avatar.Fallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <Avatar.Image src="" alt="Jane Doe" />
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar>
  ),
};
