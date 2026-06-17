import { setup, assign } from "xstate";

/**
 * Context for the linear sequence machine: the ordered step values and the
 * currently active one. `value` is the source of truth (not an index) so the
 * sequence survives steps being reordered or removed underneath it.
 */
export interface SequenceContext {
  /** The step values in sequence order. */
  steps: string[];
  /** The active step value, or `undefined` before any step is known. */
  value: string | undefined;
}

/** Initial input: optional starting steps and active value. */
export interface SequenceInput {
  steps?: string[];
  value?: string;
}

export type SequenceEvent =
  /** Replace the ordered step set (e.g. when steps mount/unmount/reorder). */
  | { type: "SET_STEPS"; steps: string[] }
  /** Advance to the next step, if any. */
  | { type: "NEXT" }
  /** Return to the previous step, if any. */
  | { type: "PREVIOUS" }
  /** Jump to a specific step by value. */
  | { type: "GO_TO"; value: string };

function indexOf(context: SequenceContext): number {
  return context.value === undefined
    ? -1
    : context.steps.indexOf(context.value);
}

/**
 * Factory for the reusable, linear sequence state machine that powers
 * `Workflow` and any future stepper/wizard. A single atomic machine whose
 * context holds the ordered step values plus the active value; events mutate it
 * with bounds guards.
 *
 * The active value is kept in context (rather than the machine's finite state)
 * because the steps are supplied dynamically at runtime — a static state per
 * step is not knowable when the machine is created.
 */
export function createSequenceMachine() {
  return setup({
    types: {
      context: {} as SequenceContext,
      events: {} as SequenceEvent,
      input: {} as SequenceInput,
    },
  }).createMachine({
    id: "sequence",
    context: ({ input }) => ({
      steps: input.steps ?? [],
      value: input.value,
    }),
    on: {
      SET_STEPS: {
        actions: assign(({ context, event }) => {
          const steps = event.steps;
          // Auto-activate the first step only when nothing is active yet, so a
          // panel shows once steps register. An already-set value is kept as-is
          // — including while steps are still registering one-by-one (the value
          // may not be in the partial list yet) — mirroring the original
          // Workflow, which never reset a chosen step due to step changes.
          const value = context.value ?? steps[0];
          return { steps, value };
        }),
      },
      GO_TO: {
        guard: ({ context, event }) => context.steps.includes(event.value),
        actions: assign(({ event }) => ({ value: event.value })),
      },
      NEXT: {
        guard: ({ context }) => {
          const i = indexOf(context);
          return i > -1 && i < context.steps.length - 1;
        },
        actions: assign(({ context }) => ({
          value: context.steps[indexOf(context) + 1],
        })),
      },
      PREVIOUS: {
        guard: ({ context }) => indexOf(context) > 0,
        actions: assign(({ context }) => ({
          value: context.steps[indexOf(context) - 1],
        })),
      },
    },
  });
}

/** The machine type produced by {@link createSequenceMachine}. */
export type SequenceMachine = ReturnType<typeof createSequenceMachine>;
