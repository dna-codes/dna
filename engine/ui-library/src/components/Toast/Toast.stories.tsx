import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Toast } from "./Toast";

const meta = {
  title: "Feedback/Toast",
  component: Toast,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Default() {
    const [open, setOpen] = useState(false);
    return (
      <Toast.Provider swipeDirection="right">
        <button onClick={() => setOpen(true)}>Show toast</button>
        <Toast open={open} onOpenChange={setOpen}>
          <Toast.Title>Scheduled</Toast.Title>
          <Toast.Description>Your post will publish at 9am.</Toast.Description>
          <Toast.Action altText="Undo scheduling">Undo</Toast.Action>
          <Toast.Close aria-label="Close">×</Toast.Close>
        </Toast>
        <Toast.Viewport
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            display: "grid",
            gap: 8,
            width: 320,
            maxWidth: "100vw",
            margin: 0,
            padding: 0,
            listStyle: "none",
            zIndex: 50,
          }}
        />
      </Toast.Provider>
    );
  },
};
