import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Collapsible } from "./Collapsible";

function Example() {
  return (
    <Collapsible>
      <Collapsible.Trigger>Toggle</Collapsible.Trigger>
      <Collapsible.Content>Hidden details</Collapsible.Content>
    </Collapsible>
  );
}

describe("Collapsible", () => {
  it("is collapsed by default", () => {
    render(<Example />);
    expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands on trigger click", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Hidden details")).toBeVisible();
  });

  it("exposes stable styling hooks", () => {
    const { container } = render(<Example />);
    expect(container.querySelector("[data-ui-collapsible]")).not.toBeNull();
    expect(screen.getByRole("button")).toHaveAttribute(
      "data-ui-collapsible-trigger",
    );
  });

  it("trigger ships no class of its own", () => {
    render(<Example />);
    expect(screen.getByRole("button").className).toBe("");
  });
});
