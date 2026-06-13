"use strict";
/**
 * Generic lens evaluator: turns a declarative {@link LensDefinition} into a
 * matched subgraph (data lens) or type-graph slice (schema lens) against any
 * `DnaDataStore`. Replaces per-lens hand-coded traversal.
 *
 * Algorithm (data lens):
 *   1. Seed   — resolve pinned slots (`ref`) to instances; with no pins, seed is
 *               every instance of the free slot types.
 *   2. Expand — for each `scope`, traverse `via` links in `direction` to `depth`
 *               from the seed, with a visited set for cycle termination.
 *   3. Edges  — include links of the declared free-edge relationship types
 *               between collected nodes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateLens = evaluateLens;
function matchesSelect(rec, select) {
    if (select.name !== undefined && rec.name !== select.name)
        return false;
    if (select.pathPrefix !== undefined) {
        const p = rec.path;
        if (typeof p !== 'string' || !p.startsWith(select.pathPrefix))
            return false;
    }
    if (select.attribute !== undefined && rec[select.attribute.name] !== select.attribute.value)
        return false;
    return true;
}
/** Resolve a pinned slot to its seed instances. */
async function resolvePinned(slot, ref, store) {
    if ('id' in ref) {
        const rec = await store.instance.get(slot.type, ref.id);
        return rec ? [{ rec, typeName: slot.type }] : [];
    }
    const all = await store.instance.list(slot.type);
    return all.filter(rec => matchesSelect(rec, ref.select)).map(rec => ({ rec, typeName: slot.type }));
}
async function evaluateDataLens(def, store) {
    const collected = new Map(); // id → node
    const linksById = new Map();
    const slotsByName = new Map();
    for (const s of def.nodes)
        if (s.slot)
            slotsByName.set(s.slot, s);
    const pinnedSlots = def.nodes.filter(s => s.ref);
    const seeds = [];
    if (pinnedSlots.length > 0) {
        for (const slot of pinnedSlots) {
            const found = await resolvePinned(slot, slot.ref, store);
            for (const c of found) {
                collected.set(c.rec.id, c);
                seeds.push(c);
            }
        }
    }
    else {
        // Fully-free lens: seed is every instance of the free slot types.
        for (const slot of def.nodes) {
            const recs = await store.instance.list(slot.type);
            for (const rec of recs) {
                const c = { rec, typeName: slot.type };
                collected.set(rec.id, c);
                seeds.push(c);
            }
        }
    }
    // ── Expand each scope from its pinned anchor ──────────────────────────────
    for (const scope of def.scope ?? []) {
        const anchorSlot = slotsByName.get(scope.from);
        if (!anchorSlot)
            continue;
        const anchors = seeds.filter(s => s.typeName === anchorSlot.type);
        await expand(scope, anchors, store, collected, linksById);
    }
    // ── Free-edge matching: links of declared relationship types between nodes ─
    const presentVia = new Set((def.edges ?? []).map(e => e.via));
    if (presentVia.size > 0) {
        for (const node of [...collected.values()]) {
            const out = await store.link.list({ from: { typeName: node.typeName, id: node.rec.id } });
            for (const link of out) {
                if (link.role && presentVia.has(link.role) && collected.has(link.to.id)) {
                    linksById.set(link.id, link);
                }
            }
        }
    }
    // Stamp each node with its resolved type (`_typeName`), mirroring the
    // convention used by query tools — consumers need the node's type and the
    // raw record doesn't carry it.
    return {
        nodes: [...collected.values()].map(c => ({ ...c.rec, _typeName: c.typeName })),
        links: [...linksById.values()],
    };
}
/** BFS expansion from anchor nodes along the scope's relationship types. */
async function expand(scope, anchors, store, collected, linksById) {
    const viaSet = new Set(scope.via);
    const nodeTypeFilter = scope.nodeTypes ? new Set(scope.nodeTypes) : null;
    const maxDepth = scope.depth === 'transitive' ? Infinity : scope.depth;
    const visited = new Set(anchors.map(a => a.rec.id));
    let frontier = anchors;
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
        const next = [];
        for (const node of frontier) {
            const ref = { typeName: node.typeName, id: node.rec.id };
            const neighbors = [];
            if (scope.direction === 'out' || scope.direction === 'both') {
                for (const link of await store.link.list({ from: ref })) {
                    if (link.role && viaSet.has(link.role))
                        neighbors.push({ link, other: link.to });
                }
            }
            if (scope.direction === 'in' || scope.direction === 'both') {
                for (const link of await store.link.list({ to: ref })) {
                    if (link.role && viaSet.has(link.role))
                        neighbors.push({ link, other: link.from });
                }
            }
            for (const { link, other } of neighbors) {
                linksById.set(link.id, link);
                if (visited.has(other.id))
                    continue;
                visited.add(other.id);
                const rec = await store.instance.get(other.typeName, other.id);
                if (!rec)
                    continue;
                const c = { rec, typeName: other.typeName };
                // nodeTypes filters membership in the returned set, but we still traverse through.
                if (!nodeTypeFilter || nodeTypeFilter.has(other.typeName))
                    collected.set(other.id, c);
                next.push(c);
            }
        }
        frontier = next;
    }
}
async function evaluateSchemaLens(def, store) {
    const [allRT, allRel] = await Promise.all([store.resourceType.list(), store.relationshipType.list()]);
    const slotTypes = new Set(def.nodes.map(n => n.type));
    const edgeVias = new Set((def.edges ?? []).map(e => e.via));
    return {
        resourceTypes: slotTypes.size > 0 ? allRT.filter(rt => slotTypes.has(rt.name)) : allRT,
        relationshipTypes: edgeVias.size > 0 ? allRel.filter(r => edgeVias.has(r.name)) : allRel,
    };
}
/**
 * Evaluate a lens definition against a data store. Returns a subgraph
 * (`{ nodes, links }`) for a data lens, or a type-graph slice
 * (`{ resourceTypes, relationshipTypes }`) for a schema lens. Presentation is
 * a separate concern — this returns data only.
 */
async function evaluateLens(def, store) {
    const target = def.target ?? 'data';
    return target === 'schema' ? evaluateSchemaLens(def, store) : evaluateDataLens(def, store);
}
//# sourceMappingURL=evaluate.js.map