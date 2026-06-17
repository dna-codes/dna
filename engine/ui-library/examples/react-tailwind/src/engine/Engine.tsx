import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { DNA } from "./types";
import { createResolver } from "./resolver";
import type { Resolver } from "./resolver";
import { defaultRegistry } from "./registry";
import type { Registry, RenderCtx } from "./registry";
import { ActorRegistryProvider } from "./actorRegistry";
import { ActivityLogProvider, useActivityLog } from "./activityLog";
import type { ActivityEntry } from "./activityLog";
import { AccessProvider, useAccess } from "./access";

type EngineValue = { resolver: Resolver; registry: Registry };

const EngineContext = createContext<EngineValue | null>(null);

function useEngine(): EngineValue {
  const value = useContext(EngineContext);
  if (!value) throw new Error("Engine components must render inside <Engine>");
  return value;
}

/** Renders nothing for an unknown resource type, but warns in dev. */
function Fallback({ type, id }: { type: string; id: string }) {
  if (import.meta.env.DEV) {
    console.warn(`Engine: no registry entry for type "${type}" (resource "${id}")`);
  }
  return null;
}

/**
 * Renders a single resource by id: resolve it, look up its registry entry,
 * build the per-node `RenderCtx`, then render the mapped component (or the
 * `map`-supplied markup) with its contained children.
 */
function Node({ id }: { id: string }): ReactNode {
  const { resolver, registry } = useEngine();
  const access = useAccess();
  const resource = resolver.get(id);
  if (!resource) return <Fallback type="(missing)" id={id} />;

  const entry = registry[resource.type];
  if (!entry) return <Fallback type={resource.type} id={id} />;

  // Access gate: a resource that declares a required action renders only when
  // the active actor is permitted it (Actor › Action › Resource — see access.tsx).
  // UX only, not a security boundary.
  if (resource.meta?.requires && !access.can(resource.meta.requires, resource.id, resource.type)) {
    return null;
  }

  const ctx: RenderCtx = {
    resource,
    resolve: resolver.get,
    machine: resolver.machine,
    slot: (name) => {
      const ids = resolver.childrenOf(resource.id, name);
      if (ids.length === 0) return null;
      return ids.map((childId) => <Node key={childId} id={childId} />);
    },
  };

  const mapped = entry.map?.(ctx) ?? {};
  const children = mapped.children ?? ctx.slot();

  // Every node is stamped with its resource id, so tooling (the inspector, tests,
  // analytics) can locate the rendered DOM element for a graph node. It is
  // identity metadata, not a visual decision.
  // Pure-composition types (no `component`) return their own markup via `map`;
  // stamp the id onto that single root element.
  if (!entry.component) {
    return isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "data-dna-id": resource.id,
        })
      : <>{children}</>;
  }

  const { className, style } = resource.props ?? {};
  const Comp = entry.component;
  return (
    <Comp
      data-dna-id={resource.id}
      data-ui-planned={resource.meta?.planned ? "" : undefined}
      className={className as string | undefined}
      style={style as CSSProperties | undefined}
      {...mapped.props}
    >
      {children}
    </Comp>
  );
}

/**
 * Logs every raw UI interaction (click/change) into the activity log, keyed by
 * the nearest rendered resource's `data-dna-id` — so the audit stream captures
 * *all* interactions, not only the ones that reach a machine. A single delegated
 * capture-phase listener on `document` covers the whole app without wrapping it
 * in extra DOM. Elements under a `[data-dna-ignore]` ancestor (e.g. the
 * inspector tool itself) are skipped. Renders nothing.
 */
function InteractionCapture(): null {
  const { resolver } = useEngine();
  const log = useActivityLog();

  useEffect(() => {
    if (!log) return;
    const onInteract = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      // Skip anything inside an opted-out subtree (e.g. the inspector tool).
      // Checked on the original target, not the resolved resource node, so it
      // holds even when the nearest `data-dna-id` is an ancestor of the ignore.
      if (target.closest("[data-dna-ignore]")) return;
      const node = target.closest<HTMLElement>("[data-dna-id]");
      if (!node) return;
      const resourceId = node.getAttribute("data-dna-id");
      if (!resourceId) return;
      log.record({
        kind: "interaction",
        resourceId,
        resourceType: resolver.get(resourceId)?.type,
        event: e.type,
      });
    };
    // Capture phase so we observe before React's handlers (and before a click
    // that unmounts its own target).
    document.addEventListener("click", onInteract, true);
    document.addEventListener("change", onInteract, true);
    return () => {
      document.removeEventListener("click", onInteract, true);
      document.removeEventListener("change", onInteract, true);
    };
  }, [log, resolver]);

  return null;
}

export type EngineProps = {
  /** The configuration graph to render. */
  dna: DNA;
  /** Override / extend the type→component map (defaults to `defaultRegistry`). */
  registry?: Registry;
  /**
   * Sink for the activity/audit stream — called with each operation as the
   * app's machines process it. Defaults to no sink (the in-memory log the
   * inspector reads is always kept). Point it at a backend to persist an audit
   * trail (but enforce the real audit server-side — this stream is client-side).
   */
  onActivity?: (entry: ActivityEntry) => void;
};

/**
 * The rendering engine entry point. Indexes the DNA graph once, then renders
 * each root (a resource nothing contains) through the recursive `Node`.
 */
export function Engine({
  dna,
  registry = defaultRegistry,
  onActivity,
}: EngineProps): ReactNode {
  const { resolver, roots } = useMemo(() => {
    const r = createResolver(dna);
    return { resolver: r, roots: r.roots };
  }, [dna]);

  return (
    <ActivityLogProvider onActivity={onActivity}>
      <ActorRegistryProvider>
        <AccessProvider dna={dna}>
          <EngineContext.Provider value={{ resolver, registry }}>
            <InteractionCapture />
            {roots.map((id) => (
              <Node key={id} id={id} />
            ))}
          </EngineContext.Provider>
        </AccessProvider>
      </ActorRegistryProvider>
    </ActivityLogProvider>
  );
}
