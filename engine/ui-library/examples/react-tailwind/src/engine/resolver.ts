import type { DNA, MachineJSON, Resource } from "./types";

/** Slot key used when a `contains` edge omits an explicit `slot`. */
export const DEFAULT_SLOT = "";

/**
 * The read model the renderer walks. Built once per DNA, holds no React state —
 * it is pure graph bookkeeping over the `contains` projection of the graph.
 */
export type Resolver = {
  /** Look up a resource by id (used to follow any edge). */
  get: (id: string) => Resource | undefined;
  /** Ordered child resource ids contained by `parentId` in `slot`. */
  childrenOf: (parentId: string, slot?: string) => string[];
  /** The slot keys a parent contains children in, in insertion order. */
  slotsOf: (parentId: string) => string[];
  /** Look up a machine config (JSON) by id — what a `machine-root` binds. */
  machine: (id: string) => MachineJSON | undefined;
  /** Resources with no incoming `contains` edge — where rendering starts. */
  roots: string[];
};

/**
 * Index a DNA graph for rendering.
 *
 * - resources are indexed by id,
 * - `contains` edges are bucketed by `from` → `slot` and sorted by `order`,
 * - roots are the resources nothing contains,
 * - a cycle in the containment projection throws (a tree can't have one).
 */
export function createResolver(dna: DNA): Resolver {
  const byId = new Map<string, Resource>();
  for (const resource of dna.resources) {
    if (byId.has(resource.id)) {
      throw new Error(`DNA: duplicate resource id "${resource.id}"`);
    }
    byId.set(resource.id, resource);
  }

  // parentId → slot → [{ to, order }] (sorted lazily below)
  const children = new Map<string, Map<string, { to: string; order: number }[]>>();
  const contained = new Set<string>();

  for (const edge of dna.relationships) {
    if (edge.kind !== "contains") continue;
    if (!byId.has(edge.from)) {
      throw new Error(`DNA: contains edge from unknown resource "${edge.from}"`);
    }
    if (!byId.has(edge.to)) {
      throw new Error(`DNA: contains edge to unknown resource "${edge.to}"`);
    }
    const slot = edge.slot ?? DEFAULT_SLOT;
    let slots = children.get(edge.from);
    if (!slots) children.set(edge.from, (slots = new Map()));
    const list = slots.get(slot) ?? [];
    list.push({ to: edge.to, order: edge.order ?? 0 });
    slots.set(slot, list);
    contained.add(edge.to);
  }

  for (const slots of children.values()) {
    for (const list of slots.values()) {
      list.sort((a, b) => a.order - b.order);
    }
  }

  const roots = dna.resources
    .map((r) => r.id)
    .filter((id) => !contained.has(id));

  assertAcyclic(roots, (id) => allChildren(children, id));

  const machines = dna.machines ?? {};

  return {
    get: (id) => byId.get(id),
    childrenOf: (parentId, slot = DEFAULT_SLOT) =>
      (children.get(parentId)?.get(slot) ?? []).map((c) => c.to),
    slotsOf: (parentId) => [...(children.get(parentId)?.keys() ?? [])],
    machine: (id) => machines[id],
    roots,
  };
}

/** Every contained child id of `parentId`, across all slots. */
function allChildren(
  children: Map<string, Map<string, { to: string; order: number }[]>>,
  parentId: string,
): string[] {
  const slots = children.get(parentId);
  if (!slots) return [];
  return [...slots.values()].flat().map((c) => c.to);
}

/** Depth-first walk from each root; a re-entered node on the path is a cycle. */
function assertAcyclic(roots: string[], childrenOf: (id: string) => string[]) {
  const onPath = new Set<string>();
  const done = new Set<string>();

  const visit = (id: string) => {
    if (done.has(id)) return;
    if (onPath.has(id)) {
      throw new Error(`DNA: containment cycle through resource "${id}"`);
    }
    onPath.add(id);
    for (const child of childrenOf(id)) visit(child);
    onPath.delete(id);
    done.add(id);
  };

  for (const root of roots) visit(root);
}
