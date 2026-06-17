import { useCallback } from "react";
import { useSelector } from "@xstate/react";
import type { AnyActorRef } from "xstate";
import { useMachineActor } from "../components/Machine/Machine";

/** The snapshot shape exposed to binding selectors (state value, context, matchers). */
type BindingSnapshot = ReturnType<AnyActorRef["getSnapshot"]>;

/**
 * Opt-in bindings that map the machine provided by `Machine.Root` onto the
 * *existing controlled props* of the Radix-based widgets. They do NOT replace
 * the widgets' internal behaviour or accessibility — Radix still owns roles,
 * keyboard handling, and ARIA. The machine simply becomes the owner of the
 * value the widget already accepts.
 */

export interface DisclosureBindingOptions {
  /** State value(s) considered "open". */
  open: string | string[];
  /** Event type to send when the widget requests opening. Default `"OPEN"`. */
  openEvent?: string;
  /** Event type to send when the widget requests closing. Default `"CLOSE"`. */
  closeEvent?: string;
}

/**
 * Drive a disclosure widget's `open` / `onOpenChange` props from the machine
 * (e.g. `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `HoverCard`,
 * `Collapsible`). Spread the result onto the widget's `Root`.
 *
 * ```tsx
 * <Dialog {...useDisclosureBinding({ open: "open" })}>…</Dialog>
 * ```
 */
export function useDisclosureBinding({
  open,
  openEvent = "OPEN",
  closeEvent = "CLOSE",
}: DisclosureBindingOptions): {
  open: boolean;
  onOpenChange: (next: boolean) => void;
} {
  const actorRef = useMachineActor();
  const matchers = Array.isArray(open) ? open : [open];
  const isOpen = useSelectorBoolean(actorRef, (snapshot) =>
    matchers.some((m) => snapshot.matches(m)),
  );
  const onOpenChange = useCallback(
    (next: boolean) => actorRef.send({ type: next ? openEvent : closeEvent }),
    [actorRef, openEvent, closeEvent],
  );
  return { open: isOpen, onOpenChange };
}

export interface ValueBindingOptions {
  /** Event type to send when the widget selects a value. Default `"SELECT"`. */
  selectEvent?: string;
  /**
   * How to read the selected value from the snapshot. Defaults to the machine's
   * current state value (stringified), which suits widgets whose finite states
   * are the selectable values. Pass e.g. `(s) => s.context.value` when the
   * selection lives in context.
   */
  read?: (snapshot: BindingSnapshot) => string;
}

/**
 * Drive a value-selection widget's `value` / `onValueChange` props from the
 * machine (e.g. `Tabs`, `Accordion`, `RadioGroup`, `Select`). The selected
 * value is sent as `{ type: selectEvent, value }`.
 *
 * ```tsx
 * <Tabs.Root {...useValueBinding()}>…</Tabs.Root>
 * ```
 */
export function useValueBinding({
  selectEvent = "SELECT",
  read = (snapshot) =>
    typeof snapshot.value === "string"
      ? snapshot.value
      : JSON.stringify(snapshot.value),
}: ValueBindingOptions = {}): {
  value: string;
  onValueChange: (value: string) => void;
} {
  const actorRef = useMachineActor();
  const value = useSelectorString(actorRef, (snapshot) => read(snapshot));
  const onValueChange = useCallback(
    (next: string) => actorRef.send({ type: selectEvent, value: next }),
    [actorRef, selectEvent],
  );
  return { value, onValueChange };
}

/* Thin typed wrappers around useSelector to keep the adapters readable. */

function useSelectorBoolean(
  actorRef: AnyActorRef,
  selector: (snapshot: BindingSnapshot) => boolean,
): boolean {
  return useSelector(actorRef, selector);
}

function useSelectorString(
  actorRef: AnyActorRef,
  selector: (snapshot: BindingSnapshot) => string,
): string {
  return useSelector(actorRef, selector);
}
