import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "./Popover";

function Example() {
  return (
    <Popover>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content>
        <p>Popover body</p>
        <Popover.Close>Dismiss</Popover.Close>
      </Popover.Content>
    </Popover>
  );
}

describe("Popover", () => {
  it("is closed by default", () => {
    render(<Example />);
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("opens on trigger click", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Popover body")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-ui-popover-content",
    );
  });

  it("closes via the Close part", async () => {
    render(<Example />);
    await userEvent.click(screen.getByText("Open"));
    await userEvent.click(screen.getByText("Dismiss"));
    expect(screen.queryByText("Popover body")).not.toBeInTheDocument();
  });

  it("trigger ships its styling hook and no class of its own", () => {
    render(<Example />);
    const trigger = screen.getByText("Open");
    expect(trigger).toHaveAttribute("data-ui-popover-trigger");
    expect(trigger.className).toBe("");
  });
});
