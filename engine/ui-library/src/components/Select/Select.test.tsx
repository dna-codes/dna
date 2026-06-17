import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

function Example() {
  return (
    <Select>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick one" />
        <Select.Icon>▼</Select.Icon>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="apple" indicator="✓">
          Apple
        </Select.Item>
        <Select.Item value="banana" indicator="✓">
          Banana
        </Select.Item>
      </Select.Content>
    </Select>
  );
}

describe("Select", () => {
  it("renders a closed trigger with placeholder", () => {
    render(<Example />);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("data-ui-select-trigger");
    expect(trigger).toHaveTextContent("Pick one");
  });

  it("trigger ships no class of its own", () => {
    render(<Example />);
    expect(screen.getByRole("combobox").className).toBe("");
  });

  it("opens the listbox and selects an option", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("option", { name: /Banana/ }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
  });

  it("forwards a consumer className on the trigger", () => {
    render(
      <Select>
        <Select.Trigger aria-label="X" className="app-trigger" />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveClass("app-trigger");
  });
});
