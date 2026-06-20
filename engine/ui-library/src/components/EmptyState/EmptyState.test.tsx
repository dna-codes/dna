import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders the parts with their styling hooks", () => {
    render(
      <EmptyState.Root>
        <EmptyState.Icon>📂</EmptyState.Icon>
        <EmptyState.Title>No resources yet</EmptyState.Title>
        <EmptyState.Description>Create the first one.</EmptyState.Description>
        <EmptyState.Actions>
          <button>New</button>
        </EmptyState.Actions>
      </EmptyState.Root>,
    );

    expect(screen.getByText("No resources yet")).toHaveAttribute(
      "data-ui-empty-state-title",
    );
    expect(screen.getByText("Create the first one.")).toHaveAttribute(
      "data-ui-empty-state-description",
    );
    expect(screen.getByText("📂")).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByText("New").closest("[data-ui-empty-state-actions]"),
    ).not.toBeNull();
  });

  it("ships no class of its own and forwards className, native props, and ref", () => {
    let node: HTMLElement | null = null;
    render(
      <EmptyState.Root
        className="empty"
        id="es"
        ref={(el) => {
          node = el;
        }}
      >
        <EmptyState.Title>Empty</EmptyState.Title>
      </EmptyState.Root>,
    );
    const root = document.querySelector("[data-ui-empty-state]");
    expect(root).toHaveClass("empty");
    expect(root).toHaveAttribute("id", "es");
    expect(node).toBeInstanceOf(HTMLElement);
  });

  it("composes the root onto a child with asChild", () => {
    render(
      <EmptyState.Root asChild>
        <section>Empty</section>
      </EmptyState.Root>,
    );
    const section = document.querySelector("section");
    expect(section).toHaveAttribute("data-ui-empty-state");
  });
});
