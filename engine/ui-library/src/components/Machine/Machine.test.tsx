import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createActor, createMachine } from "xstate";
import { Machine } from "./Machine";

// A minimal two-state machine: each transition is only valid in one state, so
// `snapshot.can` flips and `Machine.Send` can be auto-disabled.
const toggle = createMachine({
  id: "toggle",
  initial: "off",
  states: {
    off: { on: { TURN_ON: "on" } },
    on: { on: { TURN_OFF: "off" } },
  },
});

describe("Machine", () => {
  it("instantiates a `machine`, reflects state, and transitions on Send", async () => {
    render(
      <Machine.Root machine={toggle}>
        <Machine.State match="off">It is off</Machine.State>
        <Machine.State match="on">It is on</Machine.State>
        <Machine.Send event="TURN_ON">Turn on</Machine.Send>
      </Machine.Root>,
    );

    expect(screen.getByText("It is off")).toBeInTheDocument();
    expect(screen.queryByText("It is on")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Turn on" }));
    expect(screen.getByText("It is on")).toBeInTheDocument();
    expect(screen.queryByText("It is off")).not.toBeInTheDocument();
  });

  it("exposes the current state via data-state on the root", () => {
    const { container } = render(
      <Machine.Root machine={toggle}>
        <span>child</span>
      </Machine.Root>,
    );
    const root = container.querySelector("[data-ui-machine]");
    expect(root).toHaveAttribute("data-state", "off");
    expect(root?.className).toBe("");
  });

  it("auto-disables a Send when the event cannot be taken", () => {
    render(
      <Machine.Root machine={toggle}>
        <Machine.Send event="TURN_OFF">Turn off</Machine.Send>
      </Machine.Root>,
    );
    const button = screen.getByRole("button", { name: "Turn off" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-disabled");
  });

  it("keeps an inactive State mounted (hidden) with forceMount", () => {
    render(
      <Machine.Root machine={toggle}>
        <Machine.State match="on" forceMount>
          On panel
        </Machine.State>
      </Machine.Root>,
    );
    const panel = screen.getByText("On panel");
    expect(panel).toBeInTheDocument();
    expect(panel).not.toBeVisible();
  });

  it("accepts an externally-owned actor via actorRef", async () => {
    const actorRef = createActor(toggle);
    actorRef.start();

    render(
      <Machine.Root actorRef={actorRef}>
        <Machine.State match="on">External on</Machine.State>
        <Machine.Send event="TURN_ON">On</Machine.Send>
      </Machine.Root>,
    );

    expect(screen.queryByText("External on")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "On" }));
    expect(screen.getByText("External on")).toBeInTheDocument();
    expect(actorRef.getSnapshot().value).toBe("on");
  });

  it("matches against an array of states", () => {
    render(
      <Machine.Root machine={toggle}>
        <Machine.State match={["off", "on"]}>Always</Machine.State>
      </Machine.Root>,
    );
    expect(screen.getByText("Always")).toBeInTheDocument();
  });

  it("composes the root onto a child with asChild", () => {
    render(
      <Machine.Root machine={toggle} asChild>
        <section aria-label="Region">content</section>
      </Machine.Root>,
    );
    const section = screen.getByRole("region", { name: "Region" });
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveAttribute("data-ui-machine");
    expect(section).toHaveAttribute("data-state", "off");
  });

  it("throws when Root is given neither a machine nor an actorRef", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Machine.Root>nope</Machine.Root>)).toThrow(
      /requires either a `machine` or an `actorRef`/,
    );
    spy.mockRestore();
  });

  it("throws when a part is used outside Machine.Root", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(<Machine.Send event="X">x</Machine.Send>),
    ).toThrow(/Machine\.Root/);
    spy.mockRestore();
  });
});
