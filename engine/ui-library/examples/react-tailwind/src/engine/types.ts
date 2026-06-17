/**
 * DNA — the serializable configuration the rendering engine consumes.
 *
 * DNA is a *graph*: a flat list of `resources` (nodes) plus `relationships`
 * (edges). React renders a *tree*, so the engine projects this graph onto a
 * render tree by treating `contains` edges as the authoritative structural
 * spine (see `resolver.ts`). The other edge kinds are reserved for later
 * slices and are not interpreted yet.
 */

/** A single node in the graph — one component instance to render. */
export type Resource = {
  /** Unique id, referenced by relationships. */
  id: string;
  /** Registry key deciding which component renders this resource. */
  type: string;
  /** Props passed through to the component (and read by the registry `map`). */
  props?: Record<string, unknown>;
  /** Engine-level metadata that maps to styling hooks rather than props. */
  meta?: {
    /** Marks not-yet-built work — emitted as the `data-ui-planned` hook. */
    planned?: boolean;
    /**
     * The **action** the current actor must be permitted on this resource for it
     * to render at all (evaluated against `DNA.access` rules — Actor › Action ›
     * Resource). Omitted ⇒ ungated (always renders). Components can also read
     * finer permissions via the engine's `useAccess` hook (e.g. to disable
     * rather than hide). Gating is **UX only**, never a security boundary — it
     * stops affordances from showing, not data from being read; enforce real
     * authorization server-side.
     */
    requires?: string;
  };
};

/** A single edge in the graph, directed from `from` to `to`. */
export type Relationship = {
  /** The parent / source resource id. */
  from: string;
  /** The child / target resource id. */
  to: string;
  /**
   * Edge semantics. Only `contains` builds nesting in this slice;
   * `references` (data/prop wiring) and `triggers` (behavior → XState) are
   * reserved for later slices.
   */
  kind: "contains" | "references" | "triggers";
  /** For `contains`: which named slot of the parent the child lands in. */
  slot?: string;
  /** For `contains`: sibling ordering within a slot (ascending). */
  order?: number;
};

/**
 * An XState machine config in **JSON form** — serializable, no functions.
 *
 * This is the subset of XState's `createMachine` config that survives JSON: the
 * shape the engine feeds straight to `createMachine`. Behavior that needs code
 * (`actions`/`guards`/`actors`) is referenced by *name* (a string), to be
 * resolved by an implementations map later — it is never inlined here. Today's
 * machines are pure transitions, so the JSON stands alone.
 */
export type TransitionJSON =
  | string
  | {
      /** Target state name (omit for an internal/self transition). */
      target?: string;
      /** Named action(s) to run, resolved by an implementations map. */
      actions?: string | string[];
      /** Named guard gating the transition. */
      guard?: string;
    };

/** One state node in a {@link MachineJSON}. */
export type StateNodeJSON = {
  initial?: string;
  type?: "atomic" | "compound" | "parallel" | "final" | "history";
  entry?: string | string[];
  exit?: string | string[];
  /** Event name → transition(s) valid from this state. */
  on?: Record<string, TransitionJSON | TransitionJSON[]>;
  /** Nested states (for compound/parallel nodes). */
  states?: Record<string, StateNodeJSON>;
};

/** A complete machine config, JSON-serializable. Bound via a `machine-root`. */
export type MachineJSON = {
  id?: string;
  initial?: string;
  context?: Record<string, unknown>;
  states: Record<string, StateNodeJSON>;
};

/** A user (principal) the app can act as, holding one or more roles. */
export type AccessUser = {
  /** Stable user id — also the access machine's state value for this user. */
  id: string;
  /** Display name (defaults to `id`). */
  name?: string;
  /** Roles this user holds; their grants (see `AccessRule`) are unioned. */
  roles: string[];
};

/**
 * One authorization rule — a **Role › Action › Resource** grant. The action is a
 * verb a resource declares (via `meta.requires`, or a transition's `requires`);
 * the resource is matched by id, by `type:<type>`, or `*`. A `*` in any field is
 * a wildcard. The policy is an allow-list: a user may perform an action iff some
 * rule matches one of the user's roles, the action, and the resource.
 */
export type AccessRule = {
  /** A role, or `*` for any. */
  role: string;
  /** An action verb, or `*` for any. */
  action: string;
  /** A resource id, `type:<type>`, or `*` for any. */
  resource: string;
};

/**
 * Access policy for the app, expressed in DNA: **Users hold Roles, Roles may
 * perform Actions on Resources.** The *current user* is read live from an XState
 * machine (`machine`'s current state value = the active user's id), so access is
 * a projection of that actor reference. See `meta.requires` (hide) and a
 * `machine-send`'s `requires` (disable) for how resources opt into gating.
 */
export type AccessConfig = {
  /** Machine id (in `machines`) whose current state names the active user. */
  machine: string;
  /** The users the app can act as. */
  users: AccessUser[];
  /** Allow-list of Role › Action › Resource grants. */
  rules: AccessRule[];
};

/** A complete configuration: the nodes, the edges between them, the machines the
 *  graph binds, and the access policy over it. */
export type DNA = {
  resources: Resource[];
  relationships: Relationship[];
  /** XState machine configs in JSON form, keyed by id. A `machine-root`
   *  resource names one (via its `machine` prop) and the engine runs it. */
  machines?: Record<string, MachineJSON>;
  /** Actor › Action › Resource authorization policy (see `AccessConfig`). */
  access?: AccessConfig;
};
