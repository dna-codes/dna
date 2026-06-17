import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("exposes a status live region announcing a default label", () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("uses a custom label", () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving changes");
  });

  it("marks visual children as aria-hidden", () => {
    render(
      <Spinner>
        <svg data-testid="glyph" />
      </Spinner>,
    );
    const glyph = screen.getByTestId("glyph");
    expect(glyph.parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Spinner />);
    const el = screen.getByRole("status");
    expect(el).toHaveAttribute("data-ui-spinner");
    expect(el.className).toBe("");
  });

  it("forwards a ref", () => {
    let node: HTMLSpanElement | null = null;
    render(
      <Spinner
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).toBeInstanceOf(HTMLSpanElement);
  });
});
