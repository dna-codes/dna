import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Workflow } from "./Workflow";

function Wizard(props: React.ComponentProps<typeof Workflow.Root>) {
  return (
    <Workflow.Root {...props}>
      <Workflow.Steps>
        <Workflow.Step value="one">Step one</Workflow.Step>
        <Workflow.Step value="two">Step two</Workflow.Step>
        <Workflow.Step value="three">Step three</Workflow.Step>
      </Workflow.Steps>
      <Workflow.Panel value="one">Panel one</Workflow.Panel>
      <Workflow.Panel value="two">Panel two</Workflow.Panel>
      <Workflow.Panel value="three">Panel three</Workflow.Panel>
      <Workflow.Previous>Back</Workflow.Previous>
      <Workflow.Next>Next</Workflow.Next>
    </Workflow.Root>
  );
}

describe("Workflow", () => {
  it("shows the defaultValue panel and marks its step current", () => {
    render(<Wizard defaultValue="two" />);
    expect(screen.getByText("Panel two")).toBeVisible();
    expect(screen.queryByText("Panel one")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Step two" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("activates the first step when uncontrolled with no defaultValue", async () => {
    render(<Wizard />);
    expect(await screen.findByText("Panel one")).toBeInTheDocument();
  });

  it("advances and retreats with Next/Previous in document order", async () => {
    render(<Wizard defaultValue="one" />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Panel two")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Panel one")).toBeInTheDocument();
  });

  it("disables Previous on the first step and Next on the last", async () => {
    render(<Wizard defaultValue="one" />);
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back" })).not.toBeDisabled();
  });

  it("jumps to a step when its indicator is clicked", async () => {
    render(<Wizard defaultValue="one" />);
    await userEvent.click(screen.getByRole("button", { name: "Step three" }));
    expect(screen.getByText("Panel three")).toBeInTheDocument();
  });

  it("marks earlier steps complete", async () => {
    render(<Wizard defaultValue="two" />);
    expect(screen.getByRole("button", { name: "Step one" })).toHaveAttribute(
      "data-complete",
    );
    expect(screen.getByRole("button", { name: "Step three" })).not.toHaveAttribute(
      "data-complete",
    );
  });

  it("supports controlled mode via value/onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<Wizard value="one" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
    // Controlled: stays on "one" until the parent updates the prop.
    expect(screen.getByText("Panel one")).toBeInTheDocument();
  });

  it("keeps inactive panels mounted (hidden) with forceMount", () => {
    render(
      <Workflow.Root defaultValue="one">
        <Workflow.Steps>
          <Workflow.Step value="one">One</Workflow.Step>
          <Workflow.Step value="two">Two</Workflow.Step>
        </Workflow.Steps>
        <Workflow.Panel value="one">Panel one</Workflow.Panel>
        <Workflow.Panel value="two" forceMount>
          Panel two
        </Workflow.Panel>
      </Workflow.Root>,
    );
    const hidden = screen.getByText("Panel two");
    expect(hidden).toBeInTheDocument();
    expect(hidden).not.toBeVisible();
  });

  it("exposes a group role and stable data hook, ships no class", () => {
    const { container } = render(<Wizard defaultValue="one" />);
    const root = container.querySelector("[data-ui-workflow]");
    expect(root).toHaveAttribute("role", "group");
    expect(root?.className).toBe("");
  });

  it("composes Root onto a child with asChild", () => {
    render(
      <Workflow.Root defaultValue="one" asChild>
        <section aria-label="Setup">
          <Workflow.Step value="one">One</Workflow.Step>
          <Workflow.Panel value="one">Panel one</Workflow.Panel>
        </section>
      </Workflow.Root>,
    );
    const section = screen.getByRole("group", { name: "Setup" });
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("data-ui-workflow");
  });

  it("throws when a part is used outside Workflow.Root", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Workflow.Next>Next</Workflow.Next>)).toThrow(
      /Workflow\.Next/,
    );
    spy.mockRestore();
  });
});
