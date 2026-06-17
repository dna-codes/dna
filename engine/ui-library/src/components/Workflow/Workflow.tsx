import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { Slot } from "radix-ui";
import { useMachine } from "@xstate/react";
import { createSequenceMachine } from "../../machine/createSequenceMachine";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface WorkflowContextValue {
  /** The value of the currently active step, or `undefined` before the first step registers. */
  value: string | undefined;
  /** Activate a specific step by value. */
  goTo: (value: string) => void;
  /** Advance to the next registered step, if any. */
  next: () => void;
  /** Return to the previous registered step, if any. */
  previous: () => void;
  /** Register a step element so its document order defines the sequence. Returns an unregister fn. */
  registerStep: (value: string, el: HTMLElement | null) => () => void;
  /** The registered step values in document order. */
  orderedValues: string[];
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function useWorkflowContext(component: string): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (ctx === null) {
    throw new Error(`\`${component}\` must be rendered inside \`Workflow.Root\`.`);
  }
  return ctx;
}

/* -------------------------------------------------------------------------------------------------
 * Workflow.Root
 * -----------------------------------------------------------------------------------------------*/

export interface WorkflowRootProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The controlled active step value. */
  value?: string;
  /** The initial active step value in uncontrolled mode. */
  defaultValue?: string;
  /** Called with the new step value whenever the active step changes. */
  onValueChange?: (value: string) => void;
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Headless, sequential multi-step flow built on the Radix compound-component +
 * controllable-state contract (the `Tabs` shape: `Root`/`Step`/`Panel`, with
 * `value`/`defaultValue`/`onValueChange`). Radix has no wizard primitive, so
 * this ships only behaviour, sequencing, and ARIA hooks — no styling.
 *
 * State is driven by the shared XState sequence machine
 * (`createSequenceMachine`): the machine holds the ordered step values and the
 * active value as its context, and the auto-activation + bounds logic live in
 * its transitions. In controlled mode (`value` provided) the displayed value
 * follows the prop and changes are reported via `onValueChange` without
 * mutating the machine, preserving the standard controlled contract.
 *
 * The sequence is defined by the document order of the rendered `Workflow.Step`
 * elements (just as `Tabs` derives order from its always-mounted triggers), so
 * `Next`/`Previous` work even when panels are conditionally rendered.
 */
const Root = forwardRef<HTMLDivElement, WorkflowRootProps>(function WorkflowRoot(
  { value: valueProp, defaultValue, onValueChange, asChild = false, ...rest },
  ref,
) {
  const machine = useMemo(() => createSequenceMachine(), []);
  const [snapshot, send] = useMachine(machine, {
    input: { value: defaultValue },
  });

  const isControlled = valueProp !== undefined;
  const orderedValues = snapshot.context.steps;
  // Displayed value: the prop in controlled mode, the machine's in uncontrolled.
  const value = isControlled ? valueProp : snapshot.context.value;

  // Latest values held in refs so `commit` can stay identity-stable.
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Apply a step change: advance the machine in uncontrolled mode, and report
  // the change via `onValueChange` in both modes (only when it actually moves).
  const commit = useCallback(
    (next: string) => {
      if (!isControlled) send({ type: "GO_TO", value: next });
      if (next !== valueRef.current) onValueChangeRef.current?.(next);
    },
    [isControlled, send],
  );

  // Map of step value -> element, kept in a ref. Steps register in an effect
  // (after first render); on each (un)registration we recompute the document
  // order and push it to the machine via SET_STEPS. Document position (not
  // insertion order) makes the sequence robust to source reordering and
  // StrictMode double-mounts.
  const stepsRef = useRef(new Map<string, HTMLElement>());

  const recomputeOrder = useCallback(() => {
    const nextSteps = Array.from(stepsRef.current.entries())
      .sort(([, a], [, b]) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      )
      .map(([stepValue]) => stepValue);
    send({ type: "SET_STEPS", steps: nextSteps });
  }, [send]);

  const registerStep = useCallback(
    (stepValue: string, el: HTMLElement | null) => {
      if (el) stepsRef.current.set(stepValue, el);
      recomputeOrder();
      return () => {
        stepsRef.current.delete(stepValue);
        recomputeOrder();
      };
    },
    [recomputeOrder],
  );

  const goTo = useCallback((stepValue: string) => commit(stepValue), [commit]);

  const step = useCallback(
    (delta: number) => {
      const current = value ?? orderedValues[0];
      const index = orderedValues.indexOf(current);
      if (index === -1) return;
      const nextStep = orderedValues[index + delta];
      if (nextStep !== undefined) commit(nextStep);
    },
    [orderedValues, value, commit],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  const ctx = useMemo<WorkflowContextValue>(
    () => ({ value, goTo, next, previous, registerStep, orderedValues }),
    [value, goTo, next, previous, registerStep, orderedValues],
  );

  const Comp = asChild ? Slot.Root : "div";

  return (
    <WorkflowContext.Provider value={ctx}>
      <Comp ref={ref} role="group" data-ui-workflow="" {...rest} />
    </WorkflowContext.Provider>
  );
});

/* -------------------------------------------------------------------------------------------------
 * Workflow.Steps
 * -----------------------------------------------------------------------------------------------*/

export interface WorkflowStepsProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Container for the step indicators (analogous to `Tabs.List`). Renders a plain
 * `<div>`; swap with `asChild` to use an `<ol>` for a numbered stepper.
 */
const Steps = forwardRef<HTMLDivElement, WorkflowStepsProps>(function WorkflowSteps(
  { asChild = false, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "div";
  return <Comp ref={ref} data-ui-workflow-steps="" {...rest} />;
});

/* -------------------------------------------------------------------------------------------------
 * Workflow.Step
 * -----------------------------------------------------------------------------------------------*/

export interface WorkflowStepProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Identifies this step; matched against `Workflow.Panel`'s `value`. */
  value: string;
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * A single step indicator/trigger (analogous to `Tabs.Trigger`). Its document
 * order — together with the other steps — defines the workflow sequence.
 * Activating it jumps to that step. Exposes `aria-current="step"` plus
 * `data-state="active|inactive"` and `data-complete` styling hooks.
 */
const Step = forwardRef<HTMLButtonElement, WorkflowStepProps>(function WorkflowStep(
  { value, asChild = false, type, onClick, ...rest },
  ref,
) {
  const ctx = useWorkflowContext("Workflow.Step");
  const { registerStep } = ctx;
  const innerRef = useRef<HTMLButtonElement | null>(null);

  // `registerStep` is stable, so this runs once per `value` — registering on
  // mount and unregistering on unmount, without churning as the active step
  // changes.
  useEffect(
    () => registerStep(value, innerRef.current),
    [registerStep, value],
  );

  const order = ctx.orderedValues;
  const isActive = ctx.value === value;
  const isComplete =
    ctx.value !== undefined &&
    order.indexOf(value) > -1 &&
    order.indexOf(value) < order.indexOf(ctx.value);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={setRef}
      type={asChild ? type : (type ?? "button")}
      aria-current={isActive ? "step" : undefined}
      data-state={isActive ? "active" : "inactive"}
      data-complete={isComplete ? "" : undefined}
      data-ui-workflow-step=""
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.goTo(value);
      }}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------------------------------
 * Workflow.Panel
 * -----------------------------------------------------------------------------------------------*/

export interface WorkflowPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Matched against the active step's value to decide visibility. */
  value: string;
  /**
   * Keep the panel mounted (hidden via the `hidden` attribute) when inactive,
   * instead of unmounting it. Useful for animated transitions and preserving
   * form state across steps.
   */
  forceMount?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * The content for a single step (analogous to `Tabs.Content`). Unmounts when
 * inactive unless `forceMount` is set, in which case it stays mounted with the
 * `hidden` attribute. Renders a `<div role="group">`.
 */
const Panel = forwardRef<HTMLDivElement, WorkflowPanelProps>(function WorkflowPanel(
  { value, forceMount = false, asChild = false, ...rest },
  ref,
) {
  const ctx = useWorkflowContext("Workflow.Panel");
  const isActive = ctx.value === value;

  if (!isActive && !forceMount) return null;

  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      ref={ref}
      role="group"
      data-state={isActive ? "active" : "inactive"}
      data-ui-workflow-panel=""
      hidden={!isActive || undefined}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------------------------------
 * Workflow.Next / Workflow.Previous
 * -----------------------------------------------------------------------------------------------*/

export interface WorkflowNavProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: ReactNode;
}

function createNav(
  displayName: string,
  dataAttr: `data-ui-${string}`,
  move: (ctx: WorkflowContextValue) => void,
  atBound: (ctx: WorkflowContextValue) => boolean,
) {
  const Nav = forwardRef<HTMLButtonElement, WorkflowNavProps>(function Nav(
    { asChild = false, type, disabled, onClick, ...rest },
    ref,
  ) {
    const ctx = useWorkflowContext(displayName);
    const isAtBound = atBound(ctx);
    const Comp = asChild ? Slot.Root : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? type : (type ?? "button")}
        disabled={disabled || isAtBound}
        data-disabled={isAtBound ? "" : undefined}
        {...{ [dataAttr]: "" }}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) move(ctx);
        }}
        {...rest}
      />
    );
  });
  Nav.displayName = displayName;
  return Nav;
}

function indexOfCurrent(ctx: WorkflowContextValue): number {
  const current = ctx.value ?? ctx.orderedValues[0];
  return ctx.orderedValues.indexOf(current);
}

const Next = createNav(
  "Workflow.Next",
  "data-ui-workflow-next",
  (ctx) => ctx.next(),
  (ctx) => {
    const index = indexOfCurrent(ctx);
    return index === -1 || index >= ctx.orderedValues.length - 1;
  },
);

const Previous = createNav(
  "Workflow.Previous",
  "data-ui-workflow-previous",
  (ctx) => ctx.previous(),
  (ctx) => indexOfCurrent(ctx) <= 0,
);

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/

Root.displayName = "Workflow.Root";
Steps.displayName = "Workflow.Steps";
Step.displayName = "Workflow.Step";
Panel.displayName = "Workflow.Panel";

/**
 * Compound, headless multi-step workflow. Compose with the namespaced parts:
 *
 * ```tsx
 * <Workflow.Root defaultValue="details">
 *   <Workflow.Steps>
 *     <Workflow.Step value="details">Details</Workflow.Step>
 *     <Workflow.Step value="review">Review</Workflow.Step>
 *   </Workflow.Steps>
 *   <Workflow.Panel value="details">…<Workflow.Next>Next</Workflow.Next></Workflow.Panel>
 *   <Workflow.Panel value="review"><Workflow.Previous>Back</Workflow.Previous>…</Workflow.Panel>
 * </Workflow.Root>
 * ```
 */
export const Workflow = {
  Root,
  Steps,
  Step,
  Panel,
  Next,
  Previous,
};
