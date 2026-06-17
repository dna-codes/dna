import type { Meta, StoryObj } from "@storybook/react-vite";
import { createMachine } from "xstate";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Machine } from "../Machine/Machine";
import { useDisclosureBinding } from "../../machine/adapters";
import { Dialog } from "./Dialog";

/**
 * Retrofit: the Radix `Dialog` keeps all of its behaviour and accessibility —
 * the only change is *who owns* its `open` value. `useDisclosureBinding` maps a
 * machine's state to the Dialog's existing `open`/`onOpenChange` props, so the
 * dialog can be opened by a `Machine.Send` outside it or by its own `Trigger`.
 */
const meta = {
  title: "Overlays/Dialog (machine-bound)",
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const dialogMachine = createMachine({
  id: "dialog",
  initial: "closed",
  states: {
    closed: { on: { OPEN: "open" } },
    open: { on: { CLOSE: "closed" } },
  },
});

function BoundDialog() {
  // `open` lives in the machine; Radix still traps focus, locks scroll, etc.
  const binding = useDisclosureBinding({ open: "open" });
  return (
    <Dialog {...binding}>
      <Dialog.Trigger>Open via Trigger</Dialog.Trigger>
      <Dialog.Content withoutOverlay style={{ padding: 16 }}>
        <Dialog.Title>Machine-owned dialog</Dialog.Title>
        <Dialog.Description>
          Its open state is a state machine value.
        </Dialog.Description>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

export const Bound: Story = {
  render: () => (
    <Machine.Root machine={dialogMachine}>
      <div style={{ display: "flex", gap: 8 }}>
        <Machine.Send event="OPEN">Open via Machine.Send</Machine.Send>
        <BoundDialog />
      </div>
    </Machine.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The machine owns `open`: opening it from outside the Dialog still opens
    // the Radix dialog (which is portalled to the body, so query via `screen`).
    await userEvent.click(
      canvas.getByRole("button", { name: "Open via Machine.Send" }),
    );
    await expect(
      await screen.findByText("Machine-owned dialog"),
    ).toBeInTheDocument();

    // Radix still owns dismissal — closing flows back to the machine.
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByText("Machine-owned dialog")).not.toBeInTheDocument(),
    );
  },
};
