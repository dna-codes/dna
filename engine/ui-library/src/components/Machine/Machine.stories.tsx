import type { Meta, StoryObj } from "@storybook/react-vite";
import { setup, assign } from "xstate";
import { expect, userEvent, within } from "storybook/test";
import { Machine } from "./Machine";

const meta = {
  title: "Structure/Machine",
  component: Machine.Root,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Machine.Root>;

export default meta;

/**
 * `Machine` is the headless engine of the state-machine tier. Provide an XState
 * `machine` to `Machine.Root`; `Machine.State` renders for the matching
 * state(s) and `Machine.Send` dispatches events (auto-disabling when the
 * machine cannot accept them). The library ships behaviour + `data-ui-machine*`
 * hooks only.
 */
function makeToggleMachine(initial: "inactive" | "active") {
  return setup({
    types: { events: {} as { type: "TOGGLE" } },
  }).createMachine({
    id: "toggle",
    initial,
    states: {
      inactive: { on: { TOGGLE: "active" } },
      active: { on: { TOGGLE: "inactive" } },
    },
  });
}

/**
 * Args-driven: the `initial` control actually re-seeds the machine (the
 * `key` remounts it). The internal `Machine.Root` props are hidden from the
 * Controls panel so only the meaningful knob shows.
 */
export const Toggle: StoryObj<{ initial: "inactive" | "active" }> = {
  args: { initial: "inactive" },
  argTypes: {
    initial: {
      control: "inline-radio",
      options: ["inactive", "active"],
      description: "Initial state the machine starts in.",
    },
  },
  parameters: { controls: { include: ["initial"] } },
  render: ({ initial }) => (
    <Machine.Root key={initial} machine={makeToggleMachine(initial)}>
      <Machine.State match="inactive">The light is off.</Machine.State>
      <Machine.State match="active">The light is on.</Machine.State>
      <div style={{ marginTop: 16 }}>
        <Machine.Send event="TOGGLE">Toggle</Machine.Send>
      </div>
    </Machine.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wasOn = canvas.queryByText("The light is on.") !== null;

    await userEvent.click(canvas.getByRole("button", { name: "Toggle" }));

    if (wasOn) {
      await expect(canvas.getByText("The light is off.")).toBeInTheDocument();
      await expect(canvas.queryByText("The light is on.")).not.toBeInTheDocument();
    } else {
      await expect(canvas.getByText("The light is on.")).toBeInTheDocument();
      await expect(canvas.queryByText("The light is off.")).not.toBeInTheDocument();
    }
  },
};

/**
 * A multi-state flow with guarded transitions. `Machine.Send` reads
 * `snapshot.can(event)` to disable the buttons at the boundaries — the play
 * function walks the flow and asserts those guards.
 */
const checkoutMachine = setup({
  types: {
    context: {} as { attempts: number },
    events: {} as { type: "NEXT" } | { type: "BACK" } | { type: "SUBMIT" },
  },
}).createMachine({
  id: "checkout",
  initial: "cart",
  context: { attempts: 0 },
  states: {
    cart: { on: { NEXT: "shipping" } },
    shipping: { on: { NEXT: "payment", BACK: "cart" } },
    payment: {
      on: {
        BACK: "shipping",
        SUBMIT: {
          target: "done",
          actions: assign(({ context }) => ({ attempts: context.attempts + 1 })),
        },
      },
    },
    done: { type: "final" },
  },
});

export const GuardedFlow: StoryObj<typeof meta> = {
  render: () => (
    <Machine.Root machine={checkoutMachine}>
      <Machine.State match="cart">🛒 Your cart</Machine.State>
      <Machine.State match="shipping">📦 Shipping details</Machine.State>
      <Machine.State match="payment">💳 Payment</Machine.State>
      <Machine.State match="done">✅ Order placed</Machine.State>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Machine.Send event="BACK">Back</Machine.Send>
        <Machine.Send event="NEXT">Next</Machine.Send>
        <Machine.Send event="SUBMIT">Submit</Machine.Send>
      </div>
    </Machine.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole("button", { name: "Next" });
    const back = canvas.getByRole("button", { name: "Back" });
    const submit = canvas.getByRole("button", { name: "Submit" });

    // cart: only Next is available.
    await expect(canvas.getByText("🛒 Your cart")).toBeInTheDocument();
    await expect(back).toBeDisabled();
    await expect(submit).toBeDisabled();

    await userEvent.click(next); // -> shipping
    await expect(canvas.getByText("📦 Shipping details")).toBeInTheDocument();
    await expect(back).toBeEnabled();

    await userEvent.click(next); // -> payment
    await expect(canvas.getByText("💳 Payment")).toBeInTheDocument();
    await expect(submit).toBeEnabled();

    await userEvent.click(submit); // -> done (final)
    await expect(canvas.getByText("✅ Order placed")).toBeInTheDocument();
    // No transitions out of the final state, so every Send is disabled.
    await expect(next).toBeDisabled();
    await expect(submit).toBeDisabled();
  },
};
