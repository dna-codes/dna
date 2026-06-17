import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HoverCard } from "./HoverCard";

function Example() {
  return (
    <HoverCard open>
      <HoverCard.Trigger href="#">@radix</HoverCard.Trigger>
      <HoverCard.Content>Radix UI — primitives</HoverCard.Content>
    </HoverCard>
  );
}

describe("HoverCard", () => {
  it("renders content when open", () => {
    render(<Example />);
    expect(screen.getByText("Radix UI — primitives")).toBeInTheDocument();
  });

  it("exposes styling hooks on trigger and content", () => {
    render(<Example />);
    expect(screen.getByText("@radix")).toHaveAttribute(
      "data-ui-hover-card-trigger",
    );
    expect(
      screen.getByText("Radix UI — primitives"),
    ).toHaveAttribute("data-ui-hover-card-content");
  });

  it("trigger ships no class of its own", () => {
    render(<Example />);
    expect(screen.getByText("@radix").className).toBe("");
  });
});
