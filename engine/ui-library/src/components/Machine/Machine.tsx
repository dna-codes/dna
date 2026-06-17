import { createContext, forwardRef, useContext, useMemo } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import { Slot } from "radix-ui";
import { useActorRef, useSelector } from "@xstate/react";
import type {
  AnyActorRef,
  AnyEventObject,
  AnyStateMachine,
  StateValue,
} from "xstate";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface MachineContextValue {
  actorRef: AnyActorRef;
}

const MachineContext = createContext<MachineContextValue | null>(null);

/**
 * Read the running actor provided by the nearest `Machine.Root`. Throws when
 * used outside one.
 */
export function useMachineActor(): AnyActorRef {
  const ctx = useContext(MachineContext);
  if (ctx === null) {
    throw new Error("`useMachineActor` must be used inside `Machine.Root`.");
  }
  return ctx.actorRef;
}

/**
 * Subscribe to the current snapshot (or a selected slice of it) of the actor
 * provided by `Machine.Root`. Wraps `@xstate/react`'s `useSelector`.
 */
export function useMachineState<T>(
  selector: (snapshot: ReturnType<AnyActorRef["getSnapshot"]>) => T,
  compare?: (a: T, b: T) => boolean,
): T {
  const actorRef = useMachineActor();
  return useSelector(actorRef, selector, compare);
}

/** Render the machine's `StateValue` as a stable string for the `data-state` hook. */
function stringifyStateValue(value: StateValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Resolve a string or object event into a plain event object. */
function toEventObject(event: string | AnyEventObject): AnyEventObject {
  return typeof event === "string" ? { type: event } : event;
}

/* -------------------------------------------------------------------------------------------------
 * Machine.Root
 * -----------------------------------------------------------------------------------------------*/

interface MachineRootBaseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  asChild?: boolean;
  children?: ReactNode;
}

export interface MachineRootProps extends MachineRootBaseProps {
  /** A machine to instantiate and run (uncontrolled). Mutually exclusive with `actorRef`. */
  machine?: AnyStateMachine;
  /** Initial `input` passed to the instantiated `machine`. */
  input?: unknown;
  /** An already-running actor to provide (controlled). Mutually exclusive with `machine`. */
  actorRef?: AnyActorRef;
}

/**
 * Headless root for a state-machine-driven region. Provide either a `machine`
 * (instantiated and run for you) or an existing `actorRef` (you own its
 * lifecycle). Descendant `Machine.State` / `Machine.Send` parts and the
 * `useMachineActor` / `useMachineState` hooks read the actor from context.
 *
 * Makes no visual decision: renders a `<div>` (or `asChild`) carrying
 * `data-ui-machine` and `data-state` (the current state value).
 */
const Root = forwardRef<HTMLDivElement, MachineRootProps>(function MachineRoot(
  { machine, input, actorRef, ...rest },
  ref,
) {
  if (actorRef) {
    return <ProvideActor ref={ref} actorRef={actorRef} {...rest} />;
  }
  if (machine) {
    return <ProvideMachine ref={ref} machine={machine} input={input} {...rest} />;
  }
  throw new Error(
    "`Machine.Root` requires either a `machine` or an `actorRef` prop.",
  );
});

const ProvideMachine = forwardRef<
  HTMLDivElement,
  MachineRootBaseProps & { machine: AnyStateMachine; input?: unknown }
>(function ProvideMachine({ machine, input, ...rest }, ref) {
  const actorRef = useActorRef(machine, { input });
  return <Surface ref={ref} actorRef={actorRef} {...rest} />;
});

const ProvideActor = forwardRef<
  HTMLDivElement,
  MachineRootBaseProps & { actorRef: AnyActorRef }
>(function ProvideActor({ actorRef, ...rest }, ref) {
  return <Surface ref={ref} actorRef={actorRef} {...rest} />;
});

const Surface = forwardRef<
  HTMLDivElement,
  MachineRootBaseProps & { actorRef: AnyActorRef }
>(function Surface({ actorRef, asChild = false, ...rest }, ref) {
  const stateValue = useSelector(actorRef, (snapshot) => snapshot.value);
  const ctx = useMemo<MachineContextValue>(() => ({ actorRef }), [actorRef]);
  const Comp = asChild ? Slot.Root : "div";

  return (
    <MachineContext.Provider value={ctx}>
      <Comp
        ref={ref}
        data-ui-machine=""
        data-state={stringifyStateValue(stateValue)}
        {...rest}
      />
    </MachineContext.Provider>
  );
});

/* -------------------------------------------------------------------------------------------------
 * Machine.State
 * -----------------------------------------------------------------------------------------------*/

export interface MachineStateProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Which state(s) this region belongs to. A state value string, an array of
   * them (matches if in any), or a predicate over the current state value.
   */
  match: string | string[] | ((value: StateValue) => boolean);
  /**
   * Keep the region mounted (hidden via the `hidden` attribute) when inactive
   * instead of unmounting it.
   */
  forceMount?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * Renders its children only while the machine is in the matching state
 * (analogous to `Workflow.Panel`). Unmounts when inactive unless `forceMount`
 * is set. Emits `data-ui-machine-state` plus `data-state="active|inactive"`.
 */
const State = forwardRef<HTMLDivElement, MachineStateProps>(function MachineState(
  { match, forceMount = false, asChild = false, ...rest },
  ref,
) {
  const actorRef = useMachineActor();
  const isActive = useSelector(actorRef, (snapshot) => {
    if (typeof match === "function") return match(snapshot.value);
    if (Array.isArray(match)) return match.some((m) => snapshot.matches(m));
    return snapshot.matches(match);
  });

  if (!isActive && !forceMount) return null;

  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      ref={ref}
      data-ui-machine-state=""
      data-state={isActive ? "active" : "inactive"}
      hidden={!isActive || undefined}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------------------------------
 * Machine.Send
 * -----------------------------------------------------------------------------------------------*/

export interface MachineSendProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The event to dispatch on click — an event type string or full event object. */
  event: string | AnyEventObject;
  asChild?: boolean;
  children?: ReactNode;
}

/**
 * A trigger that dispatches `event` to the machine on click (analogous to
 * `Workflow.Next`). Auto-disables — with a `data-disabled` hook — when the
 * machine cannot currently accept the event (`snapshot.can`).
 */
const Send = forwardRef<HTMLButtonElement, MachineSendProps>(function MachineSend(
  { event, asChild = false, type, disabled, onClick, ...rest },
  ref,
) {
  const actorRef = useMachineActor();
  const eventObject = useMemo(() => toEventObject(event), [event]);
  const canSend = useSelector(actorRef, (snapshot) => snapshot.can(eventObject));
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      ref={ref}
      type={asChild ? type : (type ?? "button")}
      disabled={disabled || !canSend}
      data-disabled={!canSend ? "" : undefined}
      data-ui-machine-send=""
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) actorRef.send(eventObject);
      }}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/

Root.displayName = "Machine.Root";
State.displayName = "Machine.State";
Send.displayName = "Machine.Send";

/**
 * Compound, headless state-machine region. Compose with the namespaced parts:
 *
 * ```tsx
 * <Machine.Root machine={toggleMachine}>
 *   <Machine.State match="active">Lights on</Machine.State>
 *   <Machine.State match="inactive">Lights off</Machine.State>
 *   <Machine.Send event="TOGGLE">Toggle</Machine.Send>
 * </Machine.Root>
 * ```
 */
export const Machine = {
  Root,
  State,
  Send,
};
