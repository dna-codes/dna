import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { Dialog } from "./Dialog";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger>Edit profile</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Edit profile</Dialog.Title>
        <Dialog.Description>
          Make changes to your profile here. Click save when you&apos;re done.
        </Dialog.Description>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Dialog.Close>Cancel</Dialog.Close>
          <Dialog.Close>Save</Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog>
  ),
  // Opening the dialog proves two things the static render can't: the click
  // interaction wires up, and Radix portals the content out of the canvas into
  // document.body (queried via canvasElement.ownerDocument) with role="dialog".
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /edit profile/i }));
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog");
    // waitFor lets the skin's zoom-in entrance animation (opacity 0 -> 1) settle
    // before asserting visibility on the portaled content.
    await waitFor(() => expect(dialog).toBeVisible());
  },
};
