import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Tabs } from "./Tabs";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ width: 360 }}>
      <Tabs.List aria-label="Project tabs" style={{ display: "flex", gap: 8 }}>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Project overview goes here.</Tabs.Content>
      <Tabs.Content value="analytics">Charts and metrics.</Tabs.Content>
      <Tabs.Content value="settings">Danger zone.</Tabs.Content>
    </Tabs>
  ),
  // Selecting a tab reveals its panel and flips aria-selected — Radix-managed
  // state the static "Overview" render doesn't exercise.
  play: async ({ canvas, userEvent }) => {
    const analytics = canvas.getByRole("tab", { name: /analytics/i });
    await userEvent.click(analytics);
    await expect(analytics).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByText(/charts and metrics/i)).toBeVisible();
  },
};
