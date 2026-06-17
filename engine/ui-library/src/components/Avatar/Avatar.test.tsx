import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders the fallback when no image has loaded", () => {
    render(
      <Avatar>
        <Avatar.Image src="" alt="Jane Doe" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("exposes stable styling hooks", () => {
    const { container } = render(
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );
    expect(container.querySelector("[data-ui-avatar]")).not.toBeNull();
    expect(screen.getByText("JD")).toHaveAttribute("data-ui-avatar-fallback");
  });

  it("forwards a consumer className on the root", () => {
    const { container } = render(
      <Avatar className="app-avatar">
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );
    expect(container.querySelector("[data-ui-avatar]")).toHaveClass(
      "app-avatar",
    );
  });

  it("root ships no class of its own by default", () => {
    const { container } = render(
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );
    expect(
      (container.querySelector("[data-ui-avatar]") as HTMLElement).className,
    ).toBe("");
  });
});
