import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders a switch role", () => {
    render(<Switch aria-label="Wifi" />);
    expect(screen.getByRole("switch", { name: "Wifi" })).toBeInTheDocument();
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Switch aria-label="Hook" />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("data-ui-switch");
    expect(sw.className).toBe("");
  });

  it("toggles on click", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("reflects state via data-state for styling", () => {
    render(<Switch aria-label="State" defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-state", "checked");
  });

  it("forwards a consumer className", () => {
    render(<Switch aria-label="Styled" className="app-sw" />);
    expect(screen.getByRole("switch")).toHaveClass("app-sw");
  });
});
