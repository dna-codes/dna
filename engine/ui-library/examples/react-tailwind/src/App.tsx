import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Sidebar, Badge, Tabs } from "@dna/ui-library";
import type { AnyActorRef } from "@dna/ui-library";
import {
  Engine,
  createResolver,
  defaultRegistry,
  useActorRegistry,
  useActivityLog,
} from "./engine";
import type {
  AccessUser,
  ActivityEntry,
  DNA,
  MachineJSON,
  RegisteredActor,
  Registry,
  Resolver,
} from "./engine";
import { appDna } from "./dna/app";

/**
 * The whole example is JSON-driven *and* state-machine driven, both from a
 * single DNA graph (`dna/app.ts`): it describes the entire application — the
 * Header / Sidebar / Footer chrome, the scrolling Page, all four modules — *and*
 * the XState machine that runs the shell (in `dna.machines`, JSON form). The
 * rendering engine (`src/engine/`) projects that graph into the `@dna/ui-library`
 * component tree, and builds the machine from its JSON when it renders the
 * `machine-root` resource. `App` is just the engine plus an `appRegistry` that
 * adds the one resource type the generic registry can't own: the live inspector.
 *
 * Module 2 drives its UI off the shell actor (the DNA's `flow-steps` /
 * `machine-state` / `machine-send` resources). The right-hand inspector is
 * app-level: it reads the engine's actor registry and tracks *every* machine the
 * app runs (each `machine-root`'s actor), not just one. Styling comes 100% from
 * the Tailwind plugin's dark skin.
 */
export default function App() {
  return <Engine dna={appDna} registry={appRegistry} />;
}

/* ------------------------------------------------------------------ *
 * Registry — the generic engine registry plus the one app-specific type. The
 * shell machine itself now lives in the DNA (`dna.machines.content`) and is
 * bound by the generic `machine-root` registry entry; nothing about it is
 * hand-coded here anymore.
 * ------------------------------------------------------------------ */

const appRegistry: Registry = {
  ...defaultRegistry,
  inspector: { map: () => ({ children: <Inspector /> }) },
};

/* ------------------------------------------------------------------ *
 * Inspector — a right-hand sidebar that tracks the machine + the DNA graph
 * ------------------------------------------------------------------ */

/** Render an XState `StateValue` as a stable string for display. */
function stringifyState(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * Collect every event name a JSON machine references, in first-seen order. Lets
 * the inspector's availability readout derive from the DNA's machine definition
 * instead of a hand-maintained list.
 */
function eventsOf(machine: MachineJSON | undefined): string[] {
  if (!machine) return [];
  const seen = new Set<string>();
  for (const state of Object.values(machine.states)) {
    for (const event of Object.keys(state.on ?? {})) seen.add(event);
  }
  return [...seen];
}

function Inspector() {
  return (
    <Sidebar
      aria-label="Machine inspector"
      // `sticky` + `self-start` pins the inspector to the top of the viewport
      // as the page scrolls (the shell scrolls at the document level), so it
      // stays in view while you drive the machine further down the page.
      className="sticky top-0 self-start max-h-screen w-80 shrink-0 overflow-auto border-r-0 border-l border-ui-border"
      // The inspector is a tool, not part of the prototyped app — exclude its
      // own clicks from the interaction capture.
      data-dna-ignore=""
    >
      <div className="flex items-center gap-2">
        <h2 className="text-ui-sm font-ui-semibold uppercase tracking-wide">
          Inspector
        </h2>
        <Badge variant="success" className="ml-auto">
          live
        </Badge>
      </div>

      <SessionSwitcher />

      {/* Views over the prototype: every live XState actor the app runs, the
          stream of operations they process, and the static DNA graph the engine
          renders the whole app from. */}
      <Tabs defaultValue="machines" className="mt-4">
        <Tabs.List>
          <Tabs.Trigger value="machines">Machines</Tabs.Trigger>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          <Tabs.Trigger value="tree">Tree</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="machines">
          <AppMachines />
        </Tabs.Content>

        <Tabs.Content value="activity">
          <ActivityFeed />
        </Tabs.Content>

        <Tabs.Content value="tree">
          <div className="mt-5 space-y-2">
            <InspectorSection title="App — DNA graph">
              <p className="text-ui-xs text-ui-text-muted">
                The component tree the engine projects from{" "}
                <code className="font-ui-mono">appDna</code> by following its{" "}
                <code className="font-ui-mono">contains</code> edges. Click a
                node to highlight the element it rendered.
              </p>
            </InspectorSection>
            <DnaTree dna={appDna} />
          </div>
        </Tabs.Content>
      </Tabs>
    </Sidebar>
  );
}

/* ------------------------------------------------------------------ *
 * DNA tree — the inspector's view of the graph the engine renders
 * ------------------------------------------------------------------ */

/**
 * Renders a DNA graph as the same indented tree the engine projects: it builds
 * the engine's `Resolver`, then walks each root through its `contains` edges
 * (grouped by slot). Proves the UI is generated from the graph — change the DNA
 * and both the page and this tree update together.
 *
 * Each node is clickable: selecting one finds the rendered element by the
 * `data-dna-id` the engine stamped, scrolls it into view, and rings it with the
 * skin's teal selection highlight. Clicking it again clears the highlight.
 */
function DnaTree({ dna }: { dna: DNA }) {
  const resolver = useMemo(() => createResolver(dna), [dna]);
  const [selected, setSelected] = useState<string | null>(null);
  const highlighted = useRef<Element | null>(null);

  useEffect(() => {
    highlighted.current?.classList.remove("dna-highlight");
    highlighted.current = null;
    if (!selected) return;
    const el = document.querySelector(`[data-dna-id="${CSS.escape(selected)}"]`);
    if (!el) return;
    el.classList.add("dna-highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    highlighted.current = el;
  }, [selected]);

  // Clear the outline if the tree unmounts (e.g. switching back to the Machine tab).
  useEffect(
    () => () => highlighted.current?.classList.remove("dna-highlight"),
    [],
  );

  return (
    <ul className="space-y-1 text-ui-sm">
      {resolver.roots.map((id) => (
        <DnaTreeNode
          key={id}
          id={id}
          resolver={resolver}
          selected={selected}
          onSelect={setSelected}
        />
      ))}
    </ul>
  );
}

function DnaTreeNode({
  id,
  resolver,
  selected,
  onSelect,
}: {
  id: string;
  resolver: Resolver;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const resource = resolver.get(id);
  if (!resource) return null;
  const isSelected = selected === id;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(isSelected ? null : id)}
        className={
          "flex w-full items-baseline gap-2 rounded-ui-md px-1 text-left hover:bg-ui-surface-raised " +
          (isSelected ? "bg-ui-surface-raised" : "")
        }
      >
        <span className="font-ui-mono">{resource.type}</span>
        <span className="text-ui-xs text-ui-text-muted">#{resource.id}</span>
        {resource.meta?.planned && (
          <Badge variant="warning" className="text-ui-xs">
            planned
          </Badge>
        )}
      </button>

      {resolver.slotsOf(id).map((slot) => {
        const children = resolver.childrenOf(id, slot);
        if (children.length === 0) return null;
        return (
          <div
            key={slot || "default"}
            className="ml-2 mt-1 border-l border-ui-border pl-3"
          >
            {slot && (
              <div className="text-ui-xs uppercase tracking-wide text-ui-text-muted">
                {slot}
              </div>
            )}
            <ul className="space-y-1">
              {children.map((childId) => (
                <DnaTreeNode
                  key={childId}
                  id={childId}
                  resolver={resolver}
                  selected={selected}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </li>
  );
}

/** Stable fallbacks for `useSyncExternalStore` when no store is present. */
const NO_ACTORS: RegisteredActor[] = [];
const NO_ENTRIES: ActivityEntry[] = [];
const noopSubscribe = () => () => {};

/**
 * "Acting as" control: finds the access (session) actor in the registry and lets
 * you switch which **user** you're acting as. Access is a projection of that
 * user's roles, so switching shows/hides/enables gated resources live. Rendered
 * only when the DNA declares an access policy.
 */
function SessionSwitcher() {
  const access = appDna.access;
  const registry = useActorRegistry();
  const actors = useSyncExternalStore(
    registry?.subscribe ?? noopSubscribe,
    registry?.getActors ?? (() => NO_ACTORS),
  );
  if (!access) return null;
  const entry = actors.find((a) => a.id === access.machine);
  if (!entry) return null;
  return <SessionControls actor={entry.actor} users={access.users} />;
}

function SessionControls({
  actor,
  users,
}: {
  actor: AnyActorRef;
  users: AccessUser[];
}) {
  const [snapshot, setSnapshot] = useState(() => actor.getSnapshot());
  useEffect(() => {
    const sub = actor.subscribe(setSnapshot);
    return () => sub.unsubscribe();
  }, [actor]);
  const currentId = stringifyState(snapshot.value);
  const current = users.find((u) => u.id === currentId);

  return (
    <div className="mt-4 space-y-2 rounded-ui-md border border-ui-border p-3">
      <div className="flex items-center gap-2">
        <span className="text-ui-xs uppercase tracking-wide text-ui-text-muted">
          Acting as
        </span>
        <span className="font-ui-medium">{current?.name ?? currentId}</span>
        <span className="ml-auto flex gap-1">
          {(current?.roles ?? []).map((role) => (
            <Badge key={role} variant="primary" className="font-ui-mono">
              {role}
            </Badge>
          ))}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {users
          .filter((u) => u.id !== currentId)
          .map((u) => {
            const event = `AS_${u.id.toUpperCase()}`;
            const can = snapshot.can({ type: event });
            return (
              <button
                key={u.id}
                type="button"
                disabled={!can}
                onClick={() => actor.send({ type: event })}
                className="rounded-ui-md px-2 py-0.5 text-ui-xs hover:bg-ui-surface-raised disabled:opacity-40"
              >
                {u.name ?? u.id}
              </button>
            );
          })}
      </div>
    </div>
  );
}

/**
 * The app-level machine view: reads the engine's actor registry and renders one
 * `ActorInspector` per running machine. With more `machine-root`s in the DNA,
 * more panels appear here automatically — the inspector tracks the whole app's
 * machine state, not a single module's.
 */
function AppMachines() {
  const registry = useActorRegistry();
  const actors = useSyncExternalStore(
    registry?.subscribe ?? noopSubscribe,
    registry?.getActors ?? (() => NO_ACTORS),
  );

  if (actors.length === 0) {
    return (
      <p className="mt-5 text-ui-xs text-ui-text-muted">
        No machines running. A <code className="font-ui-mono">machine-root</code>{" "}
        resource registers its actor here.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-6">
      {actors.map(({ id, actor }) => (
        <ActorInspector
          key={id}
          id={id}
          actor={actor}
          events={eventsOf(appDna.machines?.[id])}
        />
      ))}
    </div>
  );
}

/**
 * Subscribes to one running actor and reports its current state, which of its
 * events it can currently accept (`events` derived from the DNA machine JSON),
 * and a running history of the states it has entered.
 */
function ActorInspector({
  id,
  actor,
  events,
}: {
  id: string;
  actor: AnyActorRef;
  events: string[];
}) {
  const [snapshot, setSnapshot] = useState(() => actor.getSnapshot());
  const [history, setHistory] = useState<string[]>(() => [
    stringifyState(actor.getSnapshot().value),
  ]);

  useEffect(() => {
    const sub = actor.subscribe((snap) => {
      setSnapshot(snap);
      const value = stringifyState(snap.value);
      // Only log when the state value actually changes (skip context-only
      // emissions and the synchronous replay some actors do on subscribe).
      setHistory((prev) =>
        prev[prev.length - 1] === value ? prev : [...prev, value],
      );
    });
    return () => sub.unsubscribe();
  }, [actor]);

  const stateValue = stringifyState(snapshot.value);

  return (
    <div className="space-y-5">
      <InspectorSection title="Machine">
        <div className="flex items-center gap-2">
          <span className="font-ui-mono text-ui-sm">{id}</span>
          <Badge variant="primary" className="ml-auto font-ui-mono">
            {stateValue}
          </Badge>
        </div>
      </InspectorSection>

      <InspectorSection title="Events">
        <ul className="space-y-1">
          {events.map((type) => {
            const can = snapshot.can({ type });
            return (
              <li key={type} className="flex items-center gap-2 text-ui-sm">
                <span
                  aria-hidden
                  className={can ? "text-ui-success" : "text-ui-text-muted"}
                >
                  {can ? "●" : "○"}
                </span>
                <span className={can ? "font-ui-mono" : "font-ui-mono text-ui-text-muted"}>
                  {type}
                </span>
              </li>
            );
          })}
        </ul>
      </InspectorSection>

      <InspectorSection title={`History (${history.length})`}>
        <ol className="space-y-1">
          {history.map((value, i) => {
            const current = i === history.length - 1;
            return (
              <li
                key={i}
                className="flex items-center gap-2 text-ui-xs font-ui-mono"
              >
                <span className="text-ui-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={current ? "" : "text-ui-text-muted"}>{value}</span>
                {current && (
                  <span aria-hidden className="text-ui-success">
                    ←
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </InspectorSection>
    </div>
  );
}

/**
 * The activity feed: the engine's running log of every operation the app's
 * machines have processed (fed by XState inspection — see `engine/activityLog`),
 * newest first. This is the live view of the audit trail; `Engine`'s `onActivity`
 * sink can forward the same entries to a backend.
 */
type ActivityFilter = "all" | "operation" | "interaction";
const FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "all" },
  { value: "operation", label: "ops" },
  { value: "interaction", label: "ui" },
];

function ActivityFeed() {
  const log = useActivityLog();
  const entries = useSyncExternalStore(
    log?.subscribe ?? noopSubscribe,
    log?.getEntries ?? (() => NO_ENTRIES),
  );
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const shown = filter === "all" ? entries : entries.filter((e) => e.kind === filter);

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={
                "rounded-ui-md px-2 py-0.5 text-ui-xs font-ui-mono hover:bg-ui-surface-raised " +
                (filter === f.value ? "bg-ui-surface-raised" : "text-ui-text-muted")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => log?.clear()}
          className="ml-auto rounded-ui-md px-2 py-0.5 text-ui-xs text-ui-text-muted hover:bg-ui-surface-raised"
        >
          Clear
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-ui-xs text-ui-text-muted">
          No activity yet — interact with the app (click, switch tabs, drive a
          machine) and it's logged here, attributed to the current actor.
        </p>
      ) : (
        <ol className="space-y-1">
          {shown
            .slice()
            .reverse()
            .map((entry) => (
              <ActivityRow key={entry.seq} entry={entry} />
            ))}
        </ol>
      )}
    </div>
  );
}

/** One activity row — renders an operation or a raw interaction. */
function ActivityRow({ entry }: { entry: ActivityEntry }) {
  return (
    <li className="flex items-baseline gap-2 text-ui-xs font-ui-mono">
      <time
        className="text-ui-text-muted"
        dateTime={new Date(entry.ts).toISOString()}
      >
        {new Date(entry.ts).toLocaleTimeString()}
      </time>
      {entry.actor && <span className="text-ui-text-muted">{entry.actor}</span>}
      {entry.kind === "operation" ? (
        <>
          <Badge variant="primary">{entry.event}</Badge>
          <span className="text-ui-text-muted">→ {entry.state}</span>
          <span className="ml-auto text-ui-text-muted">{entry.machineId}</span>
        </>
      ) : (
        <>
          <Badge variant="neutral">{entry.event}</Badge>
          <span className="text-ui-text-muted">#{entry.resourceId}</span>
          {entry.resourceType && (
            <span className="ml-auto text-ui-text-muted">{entry.resourceType}</span>
          )}
        </>
      )}
    </li>
  );
}

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <div className="text-ui-xs uppercase tracking-wide text-ui-text-muted">
        {title}
      </div>
      {children}
    </section>
  );
}
