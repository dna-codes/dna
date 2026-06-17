import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "./Toast";

function Example() {
  return (
    <Toast.Provider>
      <Toast open>
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes are live.</Toast.Description>
        <Toast.Action altText="Undo the change">Undo</Toast.Action>
        <Toast.Close>×</Toast.Close>
      </Toast>
      <Toast.Viewport />
    </Toast.Provider>
  );
}

describe("Toast", () => {
  it("renders an open toast with title and description", () => {
    render(<Example />);
    expect(screen.getByText("Saved")).toHaveAttribute("data-ui-toast-title");
    expect(screen.getByText("Your changes are live.")).toHaveAttribute(
      "data-ui-toast-description",
    );
  });

  it("renders action and close controls with their hooks", () => {
    render(<Example />);
    expect(screen.getByText("Undo")).toHaveAttribute("data-ui-toast-action");
    expect(screen.getByText("×")).toHaveAttribute("data-ui-toast-close");
  });

  it("exposes the toast root styling hook", () => {
    const { container } = render(<Example />);
    expect(container.ownerDocument.querySelector("[data-ui-toast]")).not.toBeNull();
  });
});
