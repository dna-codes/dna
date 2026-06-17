import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox role", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox", { name: "Accept" })).toBeInTheDocument();
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Checkbox aria-label="Hook" />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toHaveAttribute("data-ui-checkbox");
    expect(cb.className).toBe("");
  });

  it("toggles checked state on click", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("renders indicator content only when checked", () => {
    const { rerender } = render(
      <Checkbox aria-label="Ind" checked={false}>
        <span data-testid="glyph">✓</span>
      </Checkbox>,
    );
    expect(screen.queryByTestId("glyph")).not.toBeInTheDocument();
    rerender(
      <Checkbox aria-label="Ind" checked>
        <span data-testid="glyph">✓</span>
      </Checkbox>,
    );
    expect(screen.getByTestId("glyph")).toBeInTheDocument();
  });

  it("reflects state via data-state for styling", () => {
    render(<Checkbox aria-label="State" checked />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("forwards a consumer className", () => {
    render(<Checkbox aria-label="Styled" className="app-cb" />);
    expect(screen.getByRole("checkbox")).toHaveClass("app-cb");
  });
});
