import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page, usePage } from "./Page";

function PageProbe() {
  const page = usePage();
  return <span>page: {page ? `${page.path}/${page.title}` : "none"}</span>;
}

describe("Page", () => {
  it("renders the single main landmark, focusable, with a hook and no class", () => {
    render(<Page>body</Page>);
    const main = screen.getByRole("main");
    expect(main.tagName).toBe("MAIN");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveAttribute("data-ui-page");
    expect(main.className).toBe("");
  });

  it("names the main landmark with its title", () => {
    render(<Page title="Dashboard">body</Page>);
    expect(screen.getByRole("main", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("syncs document.title when title is set", () => {
    render(<Page title="Reports">body</Page>);
    expect(document.title).toBe("Reports");
  });

  it("provides path/title to descendants via usePage", () => {
    render(
      <Page path="/reports" title="Reports">
        <PageProbe />
      </Page>,
    );
    expect(screen.getByText("page: /reports/Reports")).toBeInTheDocument();
  });

  it("returns null from usePage outside a page", () => {
    render(<PageProbe />);
    expect(screen.getByText("page: none")).toBeInTheDocument();
  });

  it("lets consumers override the focus target via tabIndex", () => {
    render(<Page tabIndex={0}>body</Page>);
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "0");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Page asChild title="Setup">
        <section>body</section>
      </Page>,
    );
    const node = screen.getByText("body");
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveAttribute("data-ui-page");
    expect(node).toHaveAttribute("aria-label", "Setup");
  });
});
