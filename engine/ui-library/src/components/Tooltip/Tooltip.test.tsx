import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "./Tooltip";

function Example() {
  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip>
        <Tooltip.Trigger>Help</Tooltip.Trigger>
        <Tooltip.Content>Saves your work</Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
}

describe("Tooltip", () => {
  it("hides content until the trigger is focused", () => {
    render(<Example />);
    expect(screen.queryByText("Saves your work")).not.toBeInTheDocument();
  });

  it("shows content on focus and exposes the styling hook", async () => {
    const { container } = render(<Example />);
    await userEvent.tab();
    expect(screen.getByText("Help")).toHaveFocus();
    // Radix renders the visible content plus an a11y mirror; assert at least one.
    expect(screen.getAllByText("Saves your work").length).toBeGreaterThan(0);
    expect(
      container.ownerDocument.querySelector("[data-ui-tooltip-content]"),
    ).not.toBeNull();
  });

  it("trigger ships its styling hook and no class of its own", () => {
    render(<Example />);
    const trigger = screen.getByText("Help");
    expect(trigger).toHaveAttribute("data-ui-tooltip-trigger");
    expect(trigger.className).toBe("");
  });
});
