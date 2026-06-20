import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavRail } from "./NavRail";
import { Sidebar } from "../Sidebar/Sidebar";

const meta = {
  title: "Structure/NavRail",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The left section-nav rail, grouped into labelled sections. The active item is
 * marked with `aria-current="page"`, which the skin renders as the selection
 * highlight. Place it inside a `Sidebar` for the full complementary region.
 */
export const Default: Story = {
  render: () => (
    <Sidebar asChild style={{ width: "16rem" }}>
      <NavRail.Root>
        <NavRail.Section>
          <NavRail.Label>Workspace</NavRail.Label>
          <NavRail.Item href="#overview" aria-current="page">
            Overview
          </NavRail.Item>
          <NavRail.Item href="#resources">Resources</NavRail.Item>
          <NavRail.Item href="#operations">Operations</NavRail.Item>
          <NavRail.Item href="#processes">Processes</NavRail.Item>
        </NavRail.Section>
        <NavRail.Section>
          <NavRail.Label>Admin</NavRail.Label>
          <NavRail.Item href="#roles">Roles</NavRail.Item>
          <NavRail.Item href="#permissions">Permissions</NavRail.Item>
          <NavRail.Item href="#settings">Settings</NavRail.Item>
        </NavRail.Section>
      </NavRail.Root>
    </Sidebar>
  ),
};

/** Flat, ungrouped variant — just items, no section labels. */
export const Flat: Story = {
  render: () => (
    <Sidebar asChild style={{ width: "16rem" }}>
      <NavRail.Root aria-label="Repository">
        <NavRail.Item href="#code" aria-current="page">
          Code
        </NavRail.Item>
        <NavRail.Item href="#issues">Issues</NavRail.Item>
        <NavRail.Item href="#pulls">Pull requests</NavRail.Item>
        <NavRail.Item href="#actions">Actions</NavRail.Item>
      </NavRail.Root>
    </Sidebar>
  ),
};
