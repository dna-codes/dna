import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its children in a span by default", () => {
    render(<Badge>New</Badge>);
    const badge = screen.getByText("New");
    expect(badge.tagName).toBe("SPAN");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Badge>Hook</Badge>);
    const badge = screen.getByText("Hook");
    expect(badge).toHaveAttribute("data-ui-badge");
    expect(badge.className).toBe("");
  });

  it("forwards a consumer className", () => {
    render(<Badge className="app-badge">Styled</Badge>);
    expect(screen.getByText("Styled")).toHaveClass("app-badge");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Badge asChild>
        <a href="/tags/new">New</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "New" });
    expect(link).toHaveAttribute("href", "/tags/new");
    expect(link).toHaveAttribute("data-ui-badge");
  });

  it("forwards a ref", () => {
    let node: HTMLSpanElement | null = null;
    render(
      <Badge
        ref={(el) => {
          node = el;
        }}
      >
        Ref
      </Badge>,
    );
    expect(node).toBeInstanceOf(HTMLSpanElement);
  });
});
