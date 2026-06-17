import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("defaults to type=button", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Button>Hook</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-ui-button");
    expect(button.className).toBe("");
  });

  it("forwards a consumer className", () => {
    render(<Button className="app-btn">Styled</Button>);
    expect(screen.getByRole("button")).toHaveClass("app-btn");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("composes onto a child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("href", "/home");
    expect(link).toHaveAttribute("data-ui-button");
    // type is not forced onto a non-button element
    expect(link).not.toHaveAttribute("type");
  });

  it("forwards a ref to the underlying button", () => {
    let node: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(el) => {
          node = el;
        }}
      >
        Ref
      </Button>,
    );
    expect(node).toBeInstanceOf(HTMLButtonElement);
  });
});
