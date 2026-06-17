import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

function Example() {
  return (
    <Dialog>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Delete project</Dialog.Title>
        <Dialog.Description>This cannot be undone.</Dialog.Description>
        <Dialog.Close>Cancel</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("is closed by default", () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click with accessible name + description", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Open"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-ui-dialog-content");
    expect(dialog).toHaveAccessibleName("Delete project");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("closes via the Close part", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Open"));
    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Open"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("trigger ships its styling hook and no class of its own", () => {
    render(<Example />);
    const trigger = screen.getByText("Open");
    expect(trigger).toHaveAttribute("data-ui-dialog-trigger");
    expect(trigger.className).toBe("");
  });
});
