import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("renders a banner landmark at the top level", () => {
    render(<Header>Brand</Header>);
    expect(screen.getByRole("banner")).toHaveTextContent("Brand");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Header>Brand</Header>);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-ui-header");
    expect(header.className).toBe("");
  });

  it("forwards className and native props", () => {
    render(
      <Header className="shell-header" id="top">
        Brand
      </Header>,
    );
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("shell-header");
    expect(header).toHaveAttribute("id", "top");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Header asChild>
        <nav>Brand</nav>
      </Header>,
    );
    // asChild swaps the element: the role now comes from the child (<nav>),
    // not from <header>. Swapping to a non-semantic element would drop the
    // landmark — that is the consumer's responsibility.
    const nav = screen.getByRole("navigation");
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("data-ui-header");
  });

  it("forwards a ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Header
        ref={(el) => {
          node = el;
        }}
      >
        Brand
      </Header>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
  });
});
