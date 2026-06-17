import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders a complementary landmark", () => {
    render(<Sidebar aria-label="Filters">links</Sidebar>);
    expect(screen.getByRole("complementary", { name: "Filters" })).toBeInTheDocument();
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Sidebar aria-label="Filters">links</Sidebar>);
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveAttribute("data-ui-sidebar");
    expect(aside.className).toBe("");
  });

  it("can become a navigation landmark via asChild", () => {
    render(
      <Sidebar asChild aria-label="Main">
        <nav>links</nav>
      </Sidebar>,
    );
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("data-ui-sidebar");
  });
});
