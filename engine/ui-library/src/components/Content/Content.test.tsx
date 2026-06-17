import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Content } from "./Content";

describe("Content", () => {
  it("renders a plain div that is intentionally not a landmark", () => {
    render(<Content>body</Content>);
    const node = screen.getByText("body");
    expect(node.tagName).toBe("DIV");
    // Not a landmark: the Page is the route's single <main>, not Content.
    expect(node).not.toHaveAttribute("role");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Content>body</Content>);
    const node = screen.getByText("body");
    expect(node).toHaveAttribute("data-ui-content");
    expect(node.className).toBe("");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Content asChild>
        <section>body</section>
      </Content>,
    );
    const node = screen.getByText("body");
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveAttribute("data-ui-content");
  });
});
