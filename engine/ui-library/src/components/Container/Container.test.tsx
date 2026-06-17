import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "./Container";

describe("Container", () => {
  it("renders a generic, non-landmark div", () => {
    render(<Container>box</Container>);
    const node = screen.getByText("box");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("role");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Container>box</Container>);
    const node = screen.getByText("box");
    expect(node).toHaveAttribute("data-ui-container");
    expect(node.className).toBe("");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Container asChild>
        <span>box</span>
      </Container>,
    );
    const node = screen.getByText("box");
    expect(node.tagName).toBe("SPAN");
    expect(node).toHaveAttribute("data-ui-container");
  });
});
