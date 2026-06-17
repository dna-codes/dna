import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./AspectRatio";

const meta = {
  title: "Display/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Widescreen: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <AspectRatio ratio={16 / 9}>
        <img
          src="https://images.unsplash.com/photo-1535025183041-0991a977e25b?w=400"
          alt="Landscape"
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
            borderRadius: 8,
          }}
        />
      </AspectRatio>
    </div>
  ),
};
