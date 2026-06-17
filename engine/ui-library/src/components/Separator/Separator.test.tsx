import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Separator } from "./Separator";

describe("Separator", () => {
  it("is a semantic separator by default", () => {
    render(<Separator />);
    expect(screen.getByRole("separator")).toHaveAttribute("data-ui-separator");
  });

  it("is hidden from the a11y tree when decorative", () => {
    const { container } = render(<Separator decorative />);
    const el = container.querySelector("[data-ui-separator]");
    expect(el).not.toBeNull();
    expect(el).not.toHaveAttribute("role", "separator");
  });

  it("reflects orientation via data-orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.querySelector("[data-ui-separator]")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("ships no class of its own by default", () => {
    const { container } = render(<Separator />);
    expect(
      (container.querySelector("[data-ui-separator]") as HTMLElement).className,
    ).toBe("");
  });
});
