import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea", () => {
    render(<Textarea aria-label="Bio" />);
    expect(screen.getByLabelText("Bio").tagName).toBe("TEXTAREA");
  });

  it("exposes a stable styling hook but ships no class of its own", () => {
    render(<Textarea aria-label="Hook" />);
    const el = screen.getByLabelText("Hook");
    expect(el).toHaveAttribute("data-ui-textarea");
    expect(el.className).toBe("");
  });

  it("forwards a consumer className", () => {
    render(<Textarea aria-label="Styled" className="app-ta" />);
    expect(screen.getByLabelText("Styled")).toHaveClass("app-ta");
  });

  it("accepts typed input", async () => {
    render(<Textarea aria-label="Type" />);
    await userEvent.type(screen.getByLabelText("Type"), "multi\nline");
    expect(screen.getByLabelText("Type")).toHaveValue("multi\nline");
  });

  it("reflects aria-invalid as a data-invalid hook", () => {
    render(<Textarea aria-label="Bad" aria-invalid />);
    expect(screen.getByLabelText("Bad")).toHaveAttribute("data-invalid");
  });

  it("forwards a ref", () => {
    let node: HTMLTextAreaElement | null = null;
    render(
      <Textarea
        aria-label="Ref"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(node).toBeInstanceOf(HTMLTextAreaElement);
  });
});
