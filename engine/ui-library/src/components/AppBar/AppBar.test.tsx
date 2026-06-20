import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppBar } from "./AppBar";

describe("AppBar", () => {
  it("renders a banner landmark with the parts' styling hooks", () => {
    render(
      <AppBar.Root>
        <AppBar.Brand>DNA.codes</AppBar.Brand>
        <AppBar.Nav>
          <a href="/repos">Repositories</a>
        </AppBar.Nav>
        <AppBar.Search>
          <input type="search" aria-label="Search" />
        </AppBar.Search>
        <AppBar.Actions>
          <button>Account</button>
        </AppBar.Actions>
      </AppBar.Root>,
    );

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-ui-appbar");
    expect(banner).toContainElement(screen.getByText("DNA.codes"));
    expect(screen.getByText("DNA.codes")).toHaveAttribute(
      "data-ui-appbar-brand",
    );
  });

  it("names the primary nav landmark and exposes a search landmark", () => {
    render(
      <AppBar.Root>
        <AppBar.Nav>
          <a href="/x">X</a>
        </AppBar.Nav>
        <AppBar.Search>
          <input type="search" aria-label="Search" />
        </AppBar.Search>
      </AppBar.Root>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute(
      "data-ui-appbar-nav",
    );
    expect(screen.getByRole("search")).toHaveAttribute("data-ui-appbar-search");
  });

  it("lets consumers override the default nav label", () => {
    render(
      <AppBar.Root>
        <AppBar.Nav aria-label="Global">
          <a href="/x">X</a>
        </AppBar.Nav>
      </AppBar.Root>,
    );
    expect(screen.getByRole("navigation", { name: "Global" })).toBeInTheDocument();
  });

  it("ships no class of its own and forwards className + native props", () => {
    render(
      <AppBar.Root className="shell-bar" id="top">
        Brand
      </AppBar.Root>,
    );
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("shell-bar");
    expect(banner).toHaveAttribute("id", "top");
  });

  it("composes the root onto a child with asChild", () => {
    render(
      <AppBar.Root asChild>
        <div role="banner">Brand</div>
      </AppBar.Root>,
    );
    expect(screen.getByRole("banner")).toHaveAttribute("data-ui-appbar");
  });

  it("forwards a ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <AppBar.Root
        ref={(el) => {
          node = el;
        }}
      >
        Brand
      </AppBar.Root>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
  });
});
