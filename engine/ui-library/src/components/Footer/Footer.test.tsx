import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders a contentinfo landmark at the top level", () => {
    render(<Footer>© 2026</Footer>);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2026");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Footer>© 2026</Footer>);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveAttribute("data-ui-footer");
    expect(footer.className).toBe("");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Footer asChild>
        <nav aria-label="Legal">© 2026</nav>
      </Footer>,
    );
    // asChild swaps the element: the role now comes from the child (<nav>),
    // not from <footer>.
    const nav = screen.getByRole("navigation", { name: "Legal" });
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("data-ui-footer");
  });
});
