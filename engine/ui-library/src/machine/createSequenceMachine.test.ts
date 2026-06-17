import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { createSequenceMachine } from "./createSequenceMachine";

function start(input?: { steps?: string[]; value?: string }) {
  const actor = createActor(createSequenceMachine(), { input: input ?? {} });
  actor.start();
  return actor;
}

const value = (actor: ReturnType<typeof start>) =>
  actor.getSnapshot().context.value;

describe("createSequenceMachine", () => {
  it("takes its initial value and steps from input", () => {
    const actor = start({ steps: ["a", "b"], value: "b" });
    expect(actor.getSnapshot().context).toEqual({ steps: ["a", "b"], value: "b" });
  });

  it("auto-activates the first step when none is set", () => {
    const actor = start();
    actor.send({ type: "SET_STEPS", steps: ["a", "b", "c"] });
    expect(value(actor)).toBe("a");
  });

  it("keeps an already-set value while steps register one-by-one", () => {
    const actor = start({ value: "b" });
    actor.send({ type: "SET_STEPS", steps: ["a"] });
    actor.send({ type: "SET_STEPS", steps: ["a", "b"] });
    expect(value(actor)).toBe("b");
  });

  it("advances and retreats within bounds", () => {
    const actor = start({ value: "a" });
    actor.send({ type: "SET_STEPS", steps: ["a", "b", "c"] });
    actor.send({ type: "NEXT" });
    expect(value(actor)).toBe("b");
    actor.send({ type: "NEXT" });
    expect(value(actor)).toBe("c");
    actor.send({ type: "NEXT" }); // guarded at the last step
    expect(value(actor)).toBe("c");
    actor.send({ type: "PREVIOUS" });
    expect(value(actor)).toBe("b");
  });

  it("does not retreat past the first step", () => {
    const actor = start({ value: "a" });
    actor.send({ type: "SET_STEPS", steps: ["a", "b"] });
    actor.send({ type: "PREVIOUS" });
    expect(value(actor)).toBe("a");
  });

  it("jumps to a known step and ignores unknown ones via GO_TO", () => {
    const actor = start({ value: "a" });
    actor.send({ type: "SET_STEPS", steps: ["a", "b", "c"] });
    actor.send({ type: "GO_TO", value: "c" });
    expect(value(actor)).toBe("c");
    actor.send({ type: "GO_TO", value: "nope" });
    expect(value(actor)).toBe("c");
  });

  it("reports whether an event can be taken at the bounds", () => {
    const actor = start({ value: "a" });
    actor.send({ type: "SET_STEPS", steps: ["a", "b"] });
    expect(actor.getSnapshot().can({ type: "PREVIOUS" })).toBe(false);
    expect(actor.getSnapshot().can({ type: "NEXT" })).toBe(true);
    actor.send({ type: "NEXT" });
    expect(actor.getSnapshot().can({ type: "NEXT" })).toBe(false);
    expect(actor.getSnapshot().can({ type: "PREVIOUS" })).toBe(true);
  });
});
