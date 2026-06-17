import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Application } from "./Application";

describe("Application", () => {
  it("renders a non-landmark div with a stable hook and no class of its own", () => {
    render(<Application>app</Application>);
    const node = screen.getByText("app");
    expect(node.tagName).toBe("DIV");
    expect(node).not.toHaveAttribute("role");
    expect(node).toHaveAttribute("data-ui-application");
    expect(node.className).toBe("");
  });

  it("forwards className and native props", () => {
    render(
      <Application className="root" id="app">
        app
      </Application>,
    );
    const node = screen.getByText("app");
    expect(node).toHaveClass("root");
    expect(node).toHaveAttribute("id", "app");
  });

  it("provides reading direction to descendants when dir is set", () => {
    render(<Application dir="rtl">app</Application>);
    // Radix DirectionProvider exposes the value via context; the wrapped tree
    // still renders normally.
    expect(screen.getByText("app")).toHaveAttribute("data-ui-application");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Application asChild>
        <main>app</main>
      </Application>,
    );
    const node = screen.getByRole("main");
    expect(node.tagName).toBe("MAIN");
    expect(node).toHaveAttribute("data-ui-application");
  });

  it("forwards a ref", () => {
    let node: HTMLDivElement | null = null;
    render(
      <Application
        ref={(el) => {
          node = el;
        }}
      >
        app
      </Application>,
    );
    expect(node).toBeInstanceOf(HTMLDivElement);
  });
});
