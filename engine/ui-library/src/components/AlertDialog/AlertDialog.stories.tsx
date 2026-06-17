import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog } from "./AlertDialog";

const meta = {
  title: "Overlays/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Trigger>Delete account</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete your account?</AlertDialog.Title>
        <AlertDialog.Description>
          This action cannot be undone. All of your data will be permanently
          removed.
        </AlertDialog.Description>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action>Yes, delete it</AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
