import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

describe("Header", () => {
  it("renders a banner landmark with the parts' styling hooks", () => {
    render(
      <Header.Root>
        <Header.Brand>DNA.codes</Header.Brand>
        <Header.Nav>
          <a href="/repos">Repositories</a>
        </Header.Nav>
        <Header.Search>
          <input type="search" aria-label="Search" />
        </Header.Search>
        <Header.Actions>
          <button>Account</button>
        </Header.Actions>
      </Header.Root>,
    );

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-ui-header");
    expect(banner).toContainElement(screen.getByText("DNA.codes"));
    expect(screen.getByText("DNA.codes")).toHaveAttribute(
      "data-ui-header-brand",
    );
  });

  it("names the primary nav landmark and exposes a search landmark", () => {
    render(
      <Header.Root>
        <Header.Nav>
          <a href="/x">X</a>
        </Header.Nav>
        <Header.Search>
          <input type="search" aria-label="Search" />
        </Header.Search>
      </Header.Root>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute(
      "data-ui-header-nav",
    );
    expect(screen.getByRole("search")).toHaveAttribute("data-ui-header-search");
  });

  it("lets consumers override the default nav label", () => {
    render(
      <Header.Root>
        <Header.Nav aria-label="Global">
          <a href="/x">X</a>
        </Header.Nav>
      </Header.Root>,
    );
    expect(screen.getByRole("navigation", { name: "Global" })).toBeInTheDocument();
  });

  it("ships no class of its own and forwards className + native props", () => {
    render(
      <Header.Root className="shell-bar" id="top">
        Brand
      </Header.Root>,
    );
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("shell-bar");
    expect(banner).toHaveAttribute("id", "top");
  });

  it("composes the root onto a child with asChild", () => {
    render(
      <Header.Root asChild>
        <div role="banner">Brand</div>
      </Header.Root>,
    );
    expect(screen.getByRole("banner")).toHaveAttribute("data-ui-header");
  });

  it("forwards a ref to the underlying element", () => {
    let node: HTMLElement | null = null;
    render(
      <Header.Root
        ref={(el) => {
          node = el;
        }}
      >
        Brand
      </Header.Root>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
  });
});
