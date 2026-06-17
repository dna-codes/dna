import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./Accordion";

function Example() {
  return (
    <Accordion type="single" collapsible>
      <Accordion.Item value="a">
        <Accordion.Trigger>Question A</Accordion.Trigger>
        <Accordion.Content>Answer A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Question B</Accordion.Trigger>
        <Accordion.Content>Answer B</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("renders triggers inside heading elements", () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Question A" });
    expect(trigger).toHaveAttribute("data-ui-accordion-trigger");
    expect(trigger.closest("[data-ui-accordion-header]")).not.toBeNull();
  });

  it("is collapsed by default", () => {
    render(<Example />);
    expect(screen.getByRole("button", { name: "Question A" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands a panel on trigger click", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Question A" }));
    expect(screen.getByRole("button", { name: "Question A" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Answer A")).toBeVisible();
  });

  it("triggers ship no class of their own", () => {
    render(<Example />);
    expect(
      screen.getByRole("button", { name: "Question A" }).className,
    ).toBe("");
  });
});
