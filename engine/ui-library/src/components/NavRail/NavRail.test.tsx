import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavRail } from "./NavRail";

describe("NavRail", () => {
  it("renders a named navigation landmark with grouped items", () => {
    render(
      <NavRail.Root>
        <NavRail.Section>
          <NavRail.Label>Workspace</NavRail.Label>
          <NavRail.Item href="/overview" aria-current="page">
            Overview
          </NavRail.Item>
          <NavRail.Item href="/resources">Resources</NavRail.Item>
        </NavRail.Section>
      </NavRail.Root>,
    );

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav).toHaveAttribute("data-ui-navrail");
    expect(screen.getByText("Workspace")).toHaveAttribute(
      "data-ui-navrail-label",
    );
  });

  it("renders items as links and marks the active one with aria-current", () => {
    render(
      <NavRail.Root>
        <NavRail.Item href="/overview" aria-current="page">
          Overview
        </NavRail.Item>
        <NavRail.Item href="/resources">Resources</NavRail.Item>
      </NavRail.Root>,
    );

    const active = screen.getByRole("link", { name: "Overview" });
    expect(active.tagName).toBe("A");
    expect(active).toHaveAttribute("href", "/overview");
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("data-ui-navrail-item");
    expect(
      screen.getByRole("link", { name: "Resources" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("lets consumers override the default rail label", () => {
    render(
      <NavRail.Root aria-label="Repository">
        <NavRail.Item href="/x">X</NavRail.Item>
      </NavRail.Root>,
    );
    expect(
      screen.getByRole("navigation", { name: "Repository" }),
    ).toBeInTheDocument();
  });

  it("composes an item onto a router-style link with asChild", () => {
    render(
      <NavRail.Root>
        <NavRail.Item asChild aria-current="page">
          <a href="/custom" data-router-link="">
            Custom
          </a>
        </NavRail.Item>
      </NavRail.Root>,
    );
    const link = screen.getByRole("link", { name: "Custom" });
    expect(link).toHaveAttribute("data-router-link");
    expect(link).toHaveAttribute("data-ui-navrail-item");
  });

  it("ships no class of its own and forwards a ref", () => {
    let node: HTMLElement | null = null;
    render(
      <NavRail.Root
        ref={(el) => {
          node = el;
        }}
      >
        <NavRail.Item href="/x">X</NavRail.Item>
      </NavRail.Root>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
    expect(screen.getByRole("navigation").className).toBe("");
  });
});
