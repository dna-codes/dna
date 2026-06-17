import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("renders a progressbar with ARIA value attributes", () => {
    render(<Progress value={40} aria-label="Upload" />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("exposes stable styling hooks", () => {
    const { container } = render(<Progress value={40} aria-label="P" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-ui-progress");
    expect(
      container.querySelector("[data-ui-progress-indicator]"),
    ).not.toBeNull();
  });

  it("reflects completion via data-state", () => {
    render(<Progress value={100} aria-label="Done" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "data-state",
      "complete",
    );
  });

  it("supports an indeterminate state", () => {
    render(<Progress value={null} aria-label="Loading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
  });

  it("ships no class of its own by default", () => {
    render(<Progress value={10} aria-label="P" />);
    expect(screen.getByRole("progressbar").className).toBe("");
  });
});
