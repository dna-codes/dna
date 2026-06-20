import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Command } from "./Command";

function Palette({
  onA = () => {},
  onB = () => {},
  onC = () => {},
}: {
  onA?: () => void;
  onB?: () => void;
  onC?: () => void;
}) {
  return (
    <Command.Root>
      <Command.Input aria-label="Search" placeholder="Type…" />
      <Command.List aria-label="Results">
        <Command.Item onSelect={onA}>Alpha</Command.Item>
        <Command.Item disabled onSelect={onB}>
          Beta (disabled)
        </Command.Item>
        <Command.Item onSelect={onC}>Gamma</Command.Item>
      </Command.List>
    </Command.Root>
  );
}

describe("Command", () => {
  it("wires the combobox to the listbox and activates the first option", () => {
    render(<Palette />);
    const input = screen.getByRole("combobox");
    const listbox = screen.getByRole("listbox");

    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-expanded", "true");

    // The reset effect makes the first enabled option active on mount.
    const alpha = screen.getByRole("option", { name: "Alpha" });
    expect(input).toHaveAttribute("aria-activedescendant", alpha.id);
    expect(alpha).toHaveAttribute("aria-selected", "true");
  });

  it("moves active option with ArrowDown/ArrowUp, skipping disabled, with wrap", () => {
    render(<Palette />);
    const input = screen.getByRole("combobox");
    const alpha = screen.getByRole("option", { name: "Alpha" });
    const gamma = screen.getByRole("option", { name: "Gamma" });

    // Down skips the disabled "Beta" → Gamma.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", gamma.id);
    expect(gamma).toHaveAttribute("aria-selected", "true");
    expect(alpha).toHaveAttribute("aria-selected", "false");

    // Down again wraps back to Alpha.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant", alpha.id);

    // Up wraps to the last enabled option (Gamma).
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant", gamma.id);
  });

  it("selects the active option on Enter and on click", () => {
    const onA = vi.fn();
    const onC = vi.fn();
    render(<Palette onA={onA} onC={onC} />);
    const input = screen.getByRole("combobox");

    // Enter selects the active (first) option.
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onA).toHaveBeenCalledTimes(1);

    // Clicking an option selects it directly.
    fireEvent.click(screen.getByRole("option", { name: "Gamma" }));
    expect(onC).toHaveBeenCalledTimes(1);
  });

  it("does not select a disabled option on click", () => {
    const onB = vi.fn();
    render(<Palette onB={onB} />);
    fireEvent.click(screen.getByRole("option", { name: /Beta/ }));
    expect(onB).not.toHaveBeenCalled();
  });

  it("reports query changes from the input", () => {
    const onValueChange = vi.fn();
    render(
      <Command.Root>
        <Command.Input aria-label="Search" onValueChange={onValueChange} />
        <Command.List />
      </Command.Root>,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "lo" },
    });
    expect(onValueChange).toHaveBeenCalledWith("lo");
  });

  it("renders an empty slot and clears active when there are no options", () => {
    render(
      <Command.Root>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Command.Empty>No results.</Command.Empty>
        </Command.List>
      </Command.Root>,
    );
    expect(screen.getByText("No results.")).toHaveAttribute(
      "data-ui-command-empty",
    );
    expect(screen.getByRole("combobox")).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });
});
