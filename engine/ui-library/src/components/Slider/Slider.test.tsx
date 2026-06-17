import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders a single thumb by default", () => {
    render(<Slider aria-label="Volume" defaultValue={[50]} />);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
  });

  it("renders one thumb per value for a range slider", () => {
    render(<Slider defaultValue={[20, 80]} />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    const { container } = render(<Slider aria-label="Hook" defaultValue={[10]} />);
    const root = container.querySelector("[data-ui-slider]");
    expect(root).not.toBeNull();
    expect((root as HTMLElement).className).toBe("");
  });

  it("reflects value via aria-valuenow", () => {
    render(<Slider aria-label="Val" defaultValue={[42]} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "42");
  });

  it("forwards a consumer className on the root", () => {
    const { container } = render(
      <Slider className="app-sl" defaultValue={[10]} />,
    );
    expect(container.querySelector("[data-ui-slider]")).toHaveClass("app-sl");
  });
});
