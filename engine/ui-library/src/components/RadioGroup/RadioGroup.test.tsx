import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioGroup } from "./RadioGroup";

function Example(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Plan" {...props}>
      <RadioGroup.Item value="free" aria-label="Free" />
      <RadioGroup.Item value="pro" aria-label="Pro" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders a radiogroup with items", () => {
    render(<Example />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("exposes stable styling hooks but ships no classes of its own", () => {
    render(<Example />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "data-ui-radio-group",
    );
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("data-ui-radio-group-item");
    expect(radios[0].className).toBe("");
  });

  it("selects an item on click", async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(screen.getByLabelText("Pro"));
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });

  it("reflects state via data-state for styling", () => {
    render(<Example defaultValue="free" />);
    expect(screen.getByLabelText("Free")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("forwards a consumer className on the root", () => {
    render(<Example className="app-rg" />);
    expect(screen.getByRole("radiogroup")).toHaveClass("app-rg");
  });
});
