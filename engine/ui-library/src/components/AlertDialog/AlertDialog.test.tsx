import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertDialog } from "./AlertDialog";

function Example({ onConfirm }: { onConfirm?: () => void }) {
  return (
    <AlertDialog>
      <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Are you sure?</AlertDialog.Title>
        <AlertDialog.Description>This is permanent.</AlertDialog.Description>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action onClick={onConfirm}>Confirm</AlertDialog.Action>
      </AlertDialog.Content>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("opens with role alertdialog and accessible name", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Delete"));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("data-ui-alert-dialog-content");
    expect(dialog).toHaveAccessibleName("Are you sure?");
  });

  it("runs the action and closes on confirm", async () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("Delete"));
    await userEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes without acting on cancel", async () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText("Delete"));
    await userEvent.click(screen.getByText("Cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
