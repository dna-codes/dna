import { createContext, useContext, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { AnyActorRef } from "@dna/ui-library";

/**
 * Tracks the live XState actors the engine's `machine-root`s are running, so an
 * app-level tool (the inspector) can observe **every** machine in the app at
 * once — not just the one it happens to be nested under. Each `machine-root`
 * registers its actor here on mount under its DNA machine id; the inspector
 * reads the set and subscribes to each.
 *
 * It's a tiny external store: `register` is *stable* (safe to use as an effect
 * dependency), and reads go through `subscribe` + `getActors` (designed for
 * `useSyncExternalStore`) so consumers re-render when actors come and go.
 */

/** One running actor the engine is tracking, keyed by its DNA machine id. */
export type RegisteredActor = { id: string; actor: AnyActorRef };

export type ActorRegistry = {
  /** Register an actor under `id`; returns an unregister cleanup. */
  register: (id: string, actor: AnyActorRef) => () => void;
  /** Subscribe to registry changes (actors added/removed). */
  subscribe: (listener: () => void) => () => void;
  /** Current actors — a stable reference between changes. */
  getActors: () => RegisteredActor[];
};

const ActorRegistryContext = createContext<ActorRegistry | null>(null);

/** Read the engine's actor registry. `null` outside `<Engine>`. */
export function useActorRegistry(): ActorRegistry | null {
  return useContext(ActorRegistryContext);
}

/** Build the store once (identity stable across renders). */
function useActorRegistryStore(): ActorRegistry {
  const actors = useRef<RegisteredActor[]>([]);
  const listeners = useRef(new Set<() => void>());

  return useMemo(() => {
    const emit = () => listeners.current.forEach((l) => l());
    return {
      register(id, actor) {
        actors.current = [
          ...actors.current.filter((a) => a.id !== id),
          { id, actor },
        ];
        emit();
        return () => {
          actors.current = actors.current.filter((a) => a.actor !== actor);
          emit();
        };
      },
      subscribe(listener) {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
      getActors: () => actors.current,
    };
  }, []);
}

/** Provides a fresh actor registry to the subtree (one per `<Engine>`). */
export function ActorRegistryProvider({ children }: { children: ReactNode }) {
  const store = useActorRegistryStore();
  return (
    <ActorRegistryContext.Provider value={store}>
      {children}
    </ActorRegistryContext.Provider>
  );
}
