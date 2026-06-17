import type { Meta, StoryObj } from "@storybook/react-vite";
import { setup, assign } from "xstate";
import { expect, userEvent, within } from "storybook/test";
import { Machine } from "../Machine/Machine";
import { useValueBinding } from "../../machine/adapters";
import { Accordion } from "./Accordion";

/**
 * Retrofit: the Radix `Accordion` (single) keeps its heading structure and
 * keyboard nav. `useValueBinding` maps the machine's selected panel onto its
 * existing `value`/`onValueChange`. The empty string represents "all collapsed".
 */
const meta = {
  title: "Navigation/Accordion (machine-bound)",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const accordionMachine = setup({
  types: {
    context: {} as { value: string },
    events: {} as { type: "SELECT"; value: string },
  },
}).createMachine({
  id: "accordion",
  context: { value: "" },
  on: { SELECT: { actions: assign(({ event }) => ({ value: event.value })) } },
});

function BoundAccordion() {
  const binding = useValueBinding({ read: (s) => s.context.value });
  return (
    <Accordion type="single" collapsible {...binding}>
      <Accordion.Item value="shipping">
        <Accordion.Trigger>Shipping</Accordion.Trigger>
        <Accordion.Content>Ships in 2–3 business days.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>Returns</Accordion.Trigger>
        <Accordion.Content>Free returns within 30 days.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

export const Bound: Story = {
  render: () => (
    <Machine.Root machine={accordionMachine}>
      <BoundAccordion />
      <div style={{ marginTop: 16 }}>
        <Machine.Send event={{ type: "SELECT", value: "returns" }}>
          Open Returns via machine
        </Machine.Send>
      </div>
    </Machine.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Starts collapsed (machine value is the empty string).
    await expect(canvas.queryByText(/Ships in/)).not.toBeInTheDocument();

    // Open Shipping the normal (Radix) way.
    await userEvent.click(canvas.getByRole("button", { name: "Shipping" }));
    await expect(await canvas.findByText(/Ships in/)).toBeVisible();

    // Driving the machine opens Returns; single-type closes Shipping.
    await userEvent.click(
      canvas.getByRole("button", { name: "Open Returns via machine" }),
    );
    await expect(await canvas.findByText(/Free returns/)).toBeVisible();
    await expect(canvas.queryByText(/Ships in/)).not.toBeInTheDocument();
  },
};
