import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a text input by default", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("type", "text");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Input aria-label="Hook" />);
    const input = screen.getByLabelText("Hook");
    expect(input).toHaveAttribute("data-ui-input");
    expect(input.className).toBe("");
  });

  it("forwards a consumer className", () => {
    render(<Input aria-label="Styled" className="app-input" />);
    expect(screen.getByLabelText("Styled")).toHaveClass("app-input");
  });

  it("accepts typed input", async () => {
    render(<Input aria-label="Type" />);
    await userEvent.type(screen.getByLabelText("Type"), "hello");
    expect(screen.getByLabelText("Type")).toHaveValue("hello");
  });

  it("reflects aria-invalid as a data-invalid hook", () => {
    render(<Input aria-label="Bad" aria-invalid />);
    expect(screen.getByLabelText("Bad")).toHaveAttribute("data-invalid");
  });

  it("has no data-invalid when valid", () => {
    render(<Input aria-label="Good" />);
    expect(screen.getByLabelText("Good")).not.toHaveAttribute("data-invalid");
  });

  it("calls onChange", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Change" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Change"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("composes onto a child with asChild", () => {
    render(
      <Input asChild>
        <textarea aria-label="Composed" />
      </Input>,
    );
    const el = screen.getByLabelText("Composed");
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toHaveAttribute("data-ui-input");
  });

  it("forwards a ref", () => {
    let node: HTMLInputElement | null = null;
    render(
      <Input
        aria-label="Ref"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).toBeInstanceOf(HTMLInputElement);
  });
});
