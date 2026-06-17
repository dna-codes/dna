import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";

const meta = {
  title: "Structure/Sidebar",
  component: Sidebar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A `complementary` landmark (`<aside>`). Give it an accessible name. */
export const Default: Story = {
  args: {
    "aria-label": "Filters",
    children: "Sidebar content",
    style: { padding: "1rem", borderRight: "1px solid #ddd", width: 200 },
  },
};

/**
 * When the sidebar is primarily navigation, swap the element with `asChild` so
 * it becomes a `navigation` landmark instead of `complementary`.
 */
export const AsNavigation: Story = {
  args: {
    asChild: true,
    "aria-label": "Primary",
    children: <nav>Navigation links</nav>,
    style: { padding: "1rem", borderRight: "1px solid #ddd", width: 200 },
  },
};
