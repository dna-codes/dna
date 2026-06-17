import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "./Label";

describe("Label", () => {
  it("renders its children", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Label>Hook</Label>);
    const label = screen.getByText("Hook");
    expect(label).toHaveAttribute("data-ui-label");
    expect(label.className).toBe("");
  });

  it("associates with a control via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );
    expect(screen.getByText("Email")).toHaveAttribute("for", "email");
  });

  it("forwards a consumer className", () => {
    render(<Label className="app-label">Styled</Label>);
    expect(screen.getByText("Styled")).toHaveClass("app-label");
  });
});
