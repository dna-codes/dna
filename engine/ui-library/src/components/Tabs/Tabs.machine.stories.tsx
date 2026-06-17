import type { Meta, StoryObj } from "@storybook/react-vite";
import { setup, assign } from "xstate";
import { expect, userEvent, within } from "storybook/test";
import { Machine } from "../Machine/Machine";
import { useValueBinding } from "../../machine/adapters";
import { Tabs } from "./Tabs";

/**
 * Retrofit: the Radix `Tabs` keeps its roving focus, arrow-key nav, and ARIA
 * wiring. `useValueBinding` maps the machine's selected value onto the Tabs'
 * existing `value`/`onValueChange`, so the same machine can drive the tabs and
 * any other view in the app.
 */
const meta = {
  title: "Navigation/Tabs (machine-bound)",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const tabsMachine = setup({
  types: {
    context: {} as { value: string },
    events: {} as { type: "SELECT"; value: string },
  },
}).createMachine({
  id: "tabs",
  context: { value: "overview" },
  on: { SELECT: { actions: assign(({ event }) => ({ value: event.value })) } },
});

function BoundTabs() {
  const binding = useValueBinding({ read: (s) => s.context.value });
  return (
    <Tabs {...binding}>
      <Tabs.List style={{ display: "flex", gap: 8 }}>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Overview content</Tabs.Content>
      <Tabs.Content value="activity">Activity content</Tabs.Content>
      <Tabs.Content value="settings">Settings content</Tabs.Content>
    </Tabs>
  );
}

export const Bound: Story = {
  render: () => (
    <Machine.Root machine={tabsMachine}>
      <BoundTabs />
      <div style={{ marginTop: 16 }}>
        {/* The machine can be driven from elsewhere, too. */}
        <Machine.Send event={{ type: "SELECT", value: "settings" }}>
          Jump to Settings via machine
        </Machine.Send>
      </div>
    </Machine.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Selecting a tab the normal (Radix) way updates the machine's value.
    await expect(canvas.getByText("Overview content")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("tab", { name: "Activity" }));
    await expect(canvas.getByText("Activity content")).toBeInTheDocument();

    // Driving the machine from outside selects the tab — they share one value.
    await userEvent.click(
      canvas.getByRole("button", { name: "Jump to Settings via machine" }),
    );
    await expect(canvas.getByText("Settings content")).toBeInTheDocument();
    await expect(
      canvas.getByRole("tab", { name: "Settings" }),
    ).toHaveAttribute("aria-selected", "true");
  },
};
