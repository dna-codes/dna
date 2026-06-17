import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector("[data-ui-skeleton]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector("[data-ui-skeleton]") as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.className).toBe("");
  });

  it("forwards a consumer className", () => {
    const { container } = render(<Skeleton className="app-sk" />);
    expect(container.querySelector("[data-ui-skeleton]")).toHaveClass("app-sk");
  });

  it("composes onto a child with asChild", () => {
    render(
      <Skeleton asChild>
        <span data-testid="ph" />
      </Skeleton>,
    );
    const el = screen.getByTestId("ph");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveAttribute("data-ui-skeleton");
  });
});
