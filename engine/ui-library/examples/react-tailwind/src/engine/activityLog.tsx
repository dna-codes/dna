import { createContext, useContext, useMemo, useRef } from "react";
import type { ReactNode } from "react";

/**
 * A central, ordered log of what happens in the app, of two kinds:
 *
 * - **operations** — every event a `machine-root` actor processes and where it
 *   landed, fed by XState's inspection API (see `makeActivityInspect`), so it
 *   captures the events *sent*, not merely the state changes a subscription
 *   surfaces; and
 * - **interactions** — every raw UI interaction (click/change) on a rendered
 *   resource, captured by the engine via the `data-dna-id` stamp.
 *
 * Each entry is attributed to the active **actor** (the access machine's current
 * state), set via `setActor`. This is the live half of an audit trail: the
 * inspector reads it for an "Activity" feed, and `Engine`'s `onActivity` sink can
 * forward each entry to a backend. (A tamper-evident audit log must be enforced
 * server-side; this client stream is best-effort telemetry + live view.)
 *
 * Like the actor registry, it's a tiny external store: `record` is stable, and
 * reads go through `subscribe` + `getEntries` (for `useSyncExternalStore`).
 */

type BaseEntry = {
  /** Monotonic sequence number (assignment order). */
  seq: number;
  /** Wall-clock time the entry was recorded. */
  ts: number;
  /** The active actor at record time (access machine state), if any. */
  actor?: string | null;
};

/** A machine operation: an event an actor processed and the resulting state. */
export type OperationEntry = BaseEntry & {
  kind: "operation";
  /** The DNA machine id whose actor processed the event. */
  machineId: string;
  /** The event type that was sent (the operation). */
  event: string;
  /** The machine's state value after processing the event. */
  state: string;
};

/** A raw UI interaction on a rendered resource (by its `data-dna-id`). */
export type InteractionEntry = BaseEntry & {
  kind: "interaction";
  /** The `data-dna-id` of the nearest rendered resource. */
  resourceId: string;
  /** That resource's DNA `type`, for readability. */
  resourceType?: string;
  /** The DOM event type (`click` / `change`). */
  event: string;
};

export type ActivityEntry = OperationEntry | InteractionEntry;

/** What callers pass to `record` — the store stamps `seq`/`ts`/`actor`. */
export type ActivityInput =
  | Omit<OperationEntry, "seq" | "ts" | "actor">
  | Omit<InteractionEntry, "seq" | "ts" | "actor">;

export type ActivityLog = {
  /** Append an entry (the store stamps `seq`/`ts`/`actor`). */
  record: (entry: ActivityInput) => void;
  /** Set the active actor that subsequent entries are attributed to. */
  setActor: (actor: string | null) => void;
  /** Subscribe to changes (entries appended or cleared). */
  subscribe: (listener: () => void) => () => void;
  /** Current entries, oldest first — a stable reference between changes. */
  getEntries: () => ActivityEntry[];
  /** Drop all entries. */
  clear: () => void;
};

const ActivityLogContext = createContext<ActivityLog | null>(null);

/** Read the engine's activity log. `null` outside `<Engine>`. */
export function useActivityLog(): ActivityLog | null {
  return useContext(ActivityLogContext);
}

/** Render the machine's state value as a stable display string. */
function stringifyValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

type SnapshotInspection = {
  type: string;
  event?: { type?: string };
  snapshot?: { value?: unknown };
};

function isSnapshotInspection(e: unknown): e is SnapshotInspection {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { type?: unknown }).type === "@xstate.snapshot"
  );
}

/**
 * Build an XState `inspect` callback that records each event a machine
 * processes into `log`. We log on `@xstate.snapshot` (fired after an event
 * resolves) because it carries both the event and the resulting snapshot;
 * XState-internal lifecycle events (`xstate.init`, …) are skipped.
 *
 * Typed with an `unknown` parameter so it's assignable to XState's `inspect`
 * option without importing its event union; it narrows internally.
 */
export function makeActivityInspect(log: ActivityLog | null, machineId: string) {
  return (inspectionEvent: unknown) => {
    if (!log || !isSnapshotInspection(inspectionEvent)) return;
    const event = inspectionEvent.event?.type ?? "";
    if (!event || event.startsWith("xstate.")) return;
    log.record({
      kind: "operation",
      machineId,
      event,
      state: stringifyValue(inspectionEvent.snapshot?.value),
    });
  };
}

/** Build the store once (identity stable across renders). */
function useActivityStore(
  onActivity: ((entry: ActivityEntry) => void) | undefined,
  capacity: number,
): ActivityLog {
  const entries = useRef<ActivityEntry[]>([]);
  const listeners = useRef(new Set<() => void>());
  const seq = useRef(0);
  const actor = useRef<string | null>(null);
  // Keep the sink in a ref so a changing callback identity doesn't rebuild the
  // store (which would reset the log).
  const sink = useRef(onActivity);
  sink.current = onActivity;

  return useMemo(() => {
    const emit = () => listeners.current.forEach((l) => l());
    return {
      record(partial) {
        const entry = {
          ...partial,
          seq: ++seq.current,
          ts: Date.now(),
          actor: actor.current,
        } as ActivityEntry;
        const next = [...entries.current, entry];
        entries.current =
          next.length > capacity ? next.slice(next.length - capacity) : next;
        sink.current?.(entry);
        emit();
      },
      setActor(next) {
        actor.current = next;
      },
      subscribe(listener) {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
      getEntries: () => entries.current,
      clear() {
        if (entries.current.length === 0) return;
        entries.current = [];
        emit();
      },
    };
  }, [capacity]);
}

/** Provides a fresh activity log to the subtree (one per `<Engine>`). */
export function ActivityLogProvider({
  children,
  onActivity,
  capacity = 200,
}: {
  children: ReactNode;
  onActivity?: (entry: ActivityEntry) => void;
  capacity?: number;
}) {
  const store = useActivityStore(onActivity, capacity);
  return (
    <ActivityLogContext.Provider value={store}>
      {children}
    </ActivityLogContext.Provider>
  );
}
