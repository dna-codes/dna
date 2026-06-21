import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApplicationShell } from "./ApplicationShell";
import { Header } from "../Header/Header";
import { NavRail } from "../NavRail/NavRail";

describe("ApplicationShell", () => {
  it("composes the shell with its layout hooks and the parts' landmarks", () => {
    render(
      <ApplicationShell.Root>
        <ApplicationShell.Header>
          <Header.Brand>DNA.codes</Header.Brand>
        </ApplicationShell.Header>
        <ApplicationShell.Body>
          <ApplicationShell.Sidebar asChild>
            <NavRail.Root aria-label="Primary">
              <NavRail.Item href="#overview">Overview</NavRail.Item>
            </NavRail.Root>
          </ApplicationShell.Sidebar>
          <ApplicationShell.Main title="Resources">
            <p>Body</p>
          </ApplicationShell.Main>
        </ApplicationShell.Body>
      </ApplicationShell.Root>,
    );

    // Root wraps Application (non-landmark) and carries the shell hook.
    const brand = screen.getByText("DNA.codes");
    const shell = brand.closest("[data-ui-app-shell]");
    expect(shell).not.toBeNull();
    expect(shell).toHaveAttribute("data-ui-application");

    // Body lays out sidebar + main and carries its own hook.
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-ui-header");
    expect(banner).toContainElement(brand);

    const body = banner.parentElement?.querySelector(
      "[data-ui-app-shell-body]",
    );
    expect(body).not.toBeNull();

    // Landmarks come from the composed primitives.
    expect(screen.getByRole("main", { name: "Resources" })).toHaveAttribute(
      "data-ui-page",
    );
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("forwards a ref and native props through Root", () => {
    let node: HTMLElement | null = null;
    render(
      <ApplicationShell.Root
        id="shell"
        ref={(el) => {
          node = el;
        }}
      >
        <ApplicationShell.Body>content</ApplicationShell.Body>
      </ApplicationShell.Root>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node).toHaveAttribute("id", "shell");
  });

  it("composes Body onto a child with asChild", () => {
    render(
      <ApplicationShell.Body asChild>
        <section>region</section>
      </ApplicationShell.Body>,
    );
    const section = screen.getByText("region");
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("data-ui-app-shell-body");
  });
});
