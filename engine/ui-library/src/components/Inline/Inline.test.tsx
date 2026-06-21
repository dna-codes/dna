import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inline } from "./Inline";

describe("Inline", () => {
  it("renders a generic, non-landmark div", () => {
    render(<Inline>row</Inline>);
    const node = screen.getByText("row");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("role");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Inline>row</Inline>);
    const node = screen.getByText("row");
    expect(node).toHaveAttribute("data-ui-inline");
    expect(node.className).toBe("");
  });

  it("forwards className, style, and arbitrary props", () => {
    render(
      <Inline className="my-row" style={{ gap: 8 }} data-testid="row">
        row
      </Inline>,
    );
    const node = screen.getByTestId("row");
    expect(node).toHaveClass("my-row");
    expect(node).toHaveStyle({ gap: "8px" });
  });

  it("composes onto a child with asChild", () => {
    render(
      <Inline asChild>
        <span>row</span>
      </Inline>,
    );
    const node = screen.getByText("row");
    expect(node.tagName).toBe("SPAN");
    expect(node).toHaveAttribute("data-ui-inline");
  });
});
