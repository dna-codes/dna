"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merge = merge;
/**
 * Top-level Operational DNA collections that hold sub-primitives identifiable
 * by a stable key. Order matters: provenance paths are emitted in this order.
 */
const TOP_LEVEL_COLLECTIONS = [
    'resources',
    'persons',
    'positions',
    'groups',
    'memberships',
    'operations',
    'triggers',
    'rules',
    'relationships',
    'tasks',
    'processes',
];
const NOUN_COLLECTIONS = ['resources', 'persons', 'positions', 'groups'];
/**
 * Every collection merged at the document top level, by name identity. Nouns,
 * activities, and the flat `domains[]` (descendant Domain nodes) all live here
 * after the home-edge migration. `domains` is last so its provenance paths sort
 * after the primitives'.
 */
const MERGED_COLLECTIONS = [...TOP_LEVEL_COLLECTIONS, 'domains'];
/**
 * Merge multiple Operational DNA chunks into a single document.
 *
 * Pure: no I/O, no LLM calls, no global state. Deterministic for a given
 * input ordering. Identity-by-name is global — two `Loan` Resources from
 * different chunks (and different nested domains) become a single merged
 * Resource at the top of the resulting DNA's domain.
 *
 * Note: v1 flattens the input domain hierarchy. All noun primitives across
 * input chunks land directly on the merged top-level domain. Sub-domain
 * structure is not preserved — see `docs/operational.md` for rationale.
 */
function merge(input) {
    const chunks = normalizeChunks(input);
    if (chunks.length === 0) {
        return {
            dna: { domain: { name: '' } },
            conflicts: [],
            provenance: {},
        };
    }
    const conflicts = [];
    const provenance = {};
    // ── 1. Merge the domain root scalars (name, path, description). ──────────
    // Sub-primitives are merged separately at the flat top level.
    const domainScalarOccs = {};
    for (const chunk of chunks) {
        const dom = chunk.dna.domain ?? { name: '' };
        for (const [key, value] of Object.entries(dom)) {
            if (key === 'domains' || NOUN_COLLECTIONS.includes(key))
                continue;
            if (value === undefined)
                continue;
            domainScalarOccs[key] ?? (domainScalarOccs[key] = []);
            domainScalarOccs[key].push({ value, source: chunk.source });
        }
    }
    const mergedDomain = {};
    for (const [key, occs] of Object.entries(domainScalarOccs)) {
        mergedDomain[key] = mergeField(occs, `domain.${key}`, conflicts, provenance);
    }
    if (typeof mergedDomain.name !== 'string')
        mergedDomain.name = '';
    // ── 2. Merge every top-level collection by name. ─────────────────────────
    // Nouns (resources/persons/roles/groups) now live at the document top level
    // alongside the activities — each names its home Domain via `domain` — so
    // they merge identically. `domains` (descendant thin Domain nodes) merges by
    // name too. Identity-by-name is global across all input chunks.
    const mergedDna = { domain: mergedDomain };
    for (const collection of MERGED_COLLECTIONS) {
        const groups = new Map();
        const order = [];
        for (const chunk of chunks) {
            const items = chunk.dna[collection];
            if (!Array.isArray(items))
                continue;
            for (const item of items) {
                const id = identityFor(collection, item);
                if (!id)
                    continue;
                if (!groups.has(id)) {
                    groups.set(id, []);
                    order.push(id);
                }
                groups.get(id).push({ value: item, source: chunk.source });
            }
        }
        if (groups.size === 0)
            continue;
        const merged = [];
        for (const id of order) {
            const occs = groups.get(id);
            const path = `${collection}.${id}`;
            merged.push(mergeObjectField(occs, path, conflicts, provenance));
        }
        mergedDna[collection] = merged;
    }
    // ── 4. Cross-reference resolution → warnings. ────────────────────────────
    resolveCrossReferences(mergedDna, conflicts);
    return { dna: mergedDna, conflicts, provenance };
}
function normalizeChunks(input) {
    return input.map((entry, i) => {
        const tagged = entry;
        if (tagged && typeof tagged === 'object' && 'dna' in tagged && tagged.dna && typeof tagged.dna === 'object' && 'domain' in tagged.dna) {
            return {
                dna: tagged.dna,
                source: tagged.source ?? syntheticSource(i),
            };
        }
        return {
            dna: entry,
            source: syntheticSource(i),
        };
    });
}
function syntheticSource(i) {
    return { uri: `chunk://${i}`, loadedAt: '' };
}
function identityFor(collection, item) {
    if (!item || typeof item !== 'object')
        return null;
    const obj = item;
    if (typeof obj.name === 'string')
        return obj.name;
    // Operations carry name explicitly; if a chunk omits it, derive from target.action.
    if (collection === 'operations' && typeof obj.target === 'string' && typeof obj.action === 'string') {
        return `${obj.target}.${obj.action}`;
    }
    // Triggers don't have a `name` field; identity is derived from operation/process + source + after.
    if (collection === 'triggers') {
        const target = typeof obj.operation === 'string' ? `op:${obj.operation}` : typeof obj.process === 'string' ? `proc:${obj.process}` : null;
        if (!target)
            return null;
        const source = typeof obj.source === 'string' ? obj.source : '';
        const after = typeof obj.after === 'string' ? obj.after : '';
        return `${target}|${source}|${after}`;
    }
    // Rules without a name use operation+type as identity.
    if (collection === 'rules' && typeof obj.operation === 'string') {
        const type = typeof obj.type === 'string' ? obj.type : '';
        return `${obj.operation}|${type}`;
    }
    return null;
}
function mergeField(occurrences, path, conflicts, provenance) {
    if (occurrences.length === 0)
        return undefined;
    const types = new Set(occurrences.map((o) => structuralTypeOf(o.value)));
    if (types.size > 1) {
        return reportScalarConflict(occurrences, path, conflicts);
    }
    const t = types.values().next().value;
    if (t === 'array')
        return mergeArrayField(occurrences, path, conflicts, provenance);
    if (t === 'object')
        return mergeObjectField(occurrences, path, conflicts, provenance);
    return reportScalarConflict(occurrences, path, conflicts);
}
function mergeObjectField(occurrences, path, conflicts, provenance) {
    recordProvenance(provenance, path, occurrences.map((o) => o.source));
    const keys = new Set();
    for (const occ of occurrences) {
        for (const k of Object.keys(occ.value))
            keys.add(k);
    }
    const merged = {};
    for (const key of keys) {
        const fieldOccs = [];
        for (const occ of occurrences) {
            const obj = occ.value;
            if (!(key in obj))
                continue;
            if (obj[key] === undefined)
                continue;
            fieldOccs.push({ value: obj[key], source: occ.source });
        }
        if (fieldOccs.length === 0)
            continue;
        const value = mergeField(fieldOccs, `${path}.${key}`, conflicts, provenance);
        if (value !== undefined)
            merged[key] = value;
    }
    return merged;
}
function mergeArrayField(occurrences, path, conflicts, provenance) {
    const allItems = [];
    for (const occ of occurrences) {
        for (const item of occ.value) {
            allItems.push({ item, source: occ.source });
        }
    }
    if (allItems.length === 0)
        return [];
    const sample = allItems[0].item;
    const identityKey = arrayIdentityKey(path, sample);
    if (identityKey) {
        const groups = new Map();
        const order = [];
        const passthrough = [];
        for (const entry of allItems) {
            if (!entry.item || typeof entry.item !== 'object') {
                passthrough.push(entry.item);
                continue;
            }
            const id = entry.item[identityKey];
            if (typeof id !== 'string') {
                passthrough.push(entry.item);
                continue;
            }
            if (!groups.has(id)) {
                groups.set(id, []);
                order.push(id);
            }
            groups.get(id).push({ value: entry.item, source: entry.source });
        }
        const result = [];
        for (const id of order) {
            const occs = groups.get(id);
            const itemPath = `${path}.${id}`;
            result.push(mergeObjectField(occs, itemPath, conflicts, provenance));
        }
        // Items without the identity key are passed through deduped by deep equality.
        for (const item of passthrough) {
            if (!result.some((r) => deepEqual(r, item)))
                result.push(item);
        }
        return result;
    }
    // No identity key — dedupe by deep equality, preserve insertion order.
    const result = [];
    for (const entry of allItems) {
        if (!result.some((r) => deepEqual(r, entry.item)))
            result.push(entry.item);
    }
    return result;
}
function arrayIdentityKey(path, sampleItem) {
    if (!sampleItem || typeof sampleItem !== 'object')
        return null;
    const obj = sampleItem;
    if (typeof obj.name === 'string')
        return 'name';
    // Operation.changes uses `attribute` as the natural key.
    if (path.endsWith('.changes') && typeof obj.attribute === 'string')
        return 'attribute';
    // Process step ids inside `steps[]`.
    if (path.endsWith('.steps') && typeof obj.id === 'string')
        return 'id';
    return null;
}
function reportScalarConflict(occurrences, path, conflicts) {
    const groups = [];
    for (const occ of occurrences) {
        const existing = groups.find((g) => deepEqual(g.value, occ.value));
        if (existing)
            existing.sources.push(occ.source);
        else
            groups.push({ value: occ.value, sources: [occ.source] });
    }
    if (groups.length === 1) {
        return groups[0].value;
    }
    const recommendation = pickRecommendation(groups);
    const values = occurrences.map((o) => ({ value: o.value, source: o.source }));
    conflicts.push({ path, values, recommendation, kind: 'scalar' });
    return recommendation.value;
}
function pickRecommendation(groups) {
    // Score by:
    //   1. Distinct source URIs supporting the value (descending)
    //   2. Most recent loadedAt across the group's sources (descending)
    //   3. Longest non-empty string representation (descending)
    //   4. Stable input order (earlier wins)
    const scored = groups.map((g, idx) => ({
        group: g,
        idx,
        distinctSources: new Set(g.sources.map((s) => s.uri)).size,
        mostRecent: maxLoadedAt(g.sources),
        valueLength: stringLength(g.value),
    }));
    scored.sort((a, b) => {
        if (a.distinctSources !== b.distinctSources)
            return b.distinctSources - a.distinctSources;
        if (a.mostRecent !== b.mostRecent)
            return a.mostRecent < b.mostRecent ? 1 : -1;
        if (a.valueLength !== b.valueLength)
            return b.valueLength - a.valueLength;
        return a.idx - b.idx;
    });
    const winner = scored[0];
    const runnerUp = scored[1];
    let reason;
    if (winner.distinctSources > runnerUp.distinctSources) {
        reason = `most-sources: backed by ${winner.distinctSources} distinct source(s) vs ${runnerUp.distinctSources}`;
    }
    else if (winner.mostRecent !== runnerUp.mostRecent && winner.mostRecent > runnerUp.mostRecent) {
        reason = `most-recent: latest loadedAt ${winner.mostRecent || '(unset)'} > ${runnerUp.mostRecent || '(unset)'}`;
    }
    else if (winner.valueLength > runnerUp.valueLength) {
        reason = `longest-value: ${winner.valueLength} chars vs ${runnerUp.valueLength}`;
    }
    else {
        reason = 'stable-order: tied on all heuristics; first-observed wins';
    }
    return { value: winner.group.value, reason };
}
function maxLoadedAt(sources) {
    let max = '';
    for (const s of sources)
        if (s.loadedAt > max)
            max = s.loadedAt;
    return max;
}
function stringLength(value) {
    if (value === null || value === undefined)
        return 0;
    if (typeof value === 'string')
        return value.length;
    try {
        return JSON.stringify(value)?.length ?? 0;
    }
    catch {
        return 0;
    }
}
function structuralTypeOf(value) {
    if (Array.isArray(value))
        return 'array';
    if (value !== null && typeof value === 'object')
        return 'object';
    return 'scalar';
}
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (a === null || b === null)
        return false;
    if (typeof a !== typeof b)
        return false;
    if (typeof a !== 'object')
        return false;
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    if (Array.isArray(a)) {
        const arrB = b;
        if (a.length !== arrB.length)
            return false;
        for (let i = 0; i < a.length; i++)
            if (!deepEqual(a[i], arrB[i]))
                return false;
        return true;
    }
    const ao = a;
    const bo = b;
    const ak = Object.keys(ao).sort();
    const bk = Object.keys(bo).sort();
    if (ak.length !== bk.length)
        return false;
    for (let i = 0; i < ak.length; i++) {
        if (ak[i] !== bk[i])
            return false;
        if (!deepEqual(ao[ak[i]], bo[bk[i]]))
            return false;
    }
    return true;
}
function recordProvenance(provenance, path, sources) {
    const existing = provenance[path] ?? [];
    const seen = new Set(existing.map(sourceKey));
    for (const s of sources) {
        const k = sourceKey(s);
        if (seen.has(k))
            continue;
        seen.add(k);
        existing.push(s);
    }
    provenance[path] = existing;
}
function sourceKey(s) {
    return `${s.uri} ${s.loadedAt}`;
}
// ── Cross-reference resolution ────────────────────────────────────────────
function resolveCrossReferences(dna, conflicts) {
    const resourceNames = collectNames(dna.resources);
    const personNames = collectNames(dna.persons);
    const roleNames = collectNames(dna.roles);
    const groupNames = collectNames(dna.groups);
    const processNames = new Set(collectNames(dna.processes));
    const operationNames = new Set(collectNames(dna.operations));
    const taskNames = new Set(collectNames(dna.tasks));
    const targetable = new Set([
        ...resourceNames,
        ...personNames,
        ...roleNames,
        ...groupNames,
        ...processNames,
    ]);
    const actorable = new Set([...personNames, ...roleNames]);
    const scopeable = new Set([...personNames, ...roleNames, ...groupNames]);
    // Roles are the memberable kind; Persons hold them (Membership.person).
    const memberable = new Set([...roleNames]);
    for (const op of asArray(dna.operations)) {
        const obj = op;
        if (typeof obj.target === 'string' && !targetable.has(obj.target)) {
            const id = (typeof obj.name === 'string' ? obj.name : `${obj.target}.${obj.action ?? ''}`);
            pushUnresolved(conflicts, `operations.${id}.target`, obj.target);
        }
    }
    for (const m of asArray(dna.memberships)) {
        const obj = m;
        const id = typeof obj.name === 'string' ? obj.name : '<unnamed>';
        if (typeof obj.person === 'string' && !personNames.has(obj.person)) {
            pushUnresolved(conflicts, `memberships.${id}.person`, obj.person);
        }
        if (typeof obj.role === 'string' && !memberable.has(obj.role)) {
            pushUnresolved(conflicts, `memberships.${id}.role`, obj.role);
        }
        if (typeof obj.group === 'string' && !scopeable.has(obj.group)) {
            pushUnresolved(conflicts, `memberships.${id}.group`, obj.group);
        }
    }
    for (const t of asArray(dna.triggers)) {
        const obj = t;
        const id = identityFor('triggers', obj) ?? '<unidentified>';
        if (typeof obj.operation === 'string' && !operationNames.has(obj.operation)) {
            pushUnresolved(conflicts, `triggers.${id}.operation`, obj.operation);
        }
        if (typeof obj.process === 'string' && !processNames.has(obj.process)) {
            pushUnresolved(conflicts, `triggers.${id}.process`, obj.process);
        }
        if (typeof obj.after === 'string' && !operationNames.has(obj.after)) {
            pushUnresolved(conflicts, `triggers.${id}.after`, obj.after);
        }
    }
    for (const r of asArray(dna.rules)) {
        const obj = r;
        const id = identityFor('rules', obj) ?? '<unidentified>';
        if (typeof obj.operation === 'string' && !operationNames.has(obj.operation)) {
            pushUnresolved(conflicts, `rules.${id}.operation`, obj.operation);
        }
    }
    for (const t of asArray(dna.tasks)) {
        const obj = t;
        const id = typeof obj.name === 'string' ? obj.name : '<unnamed>';
        if (typeof obj.actor === 'string' && !actorable.has(obj.actor)) {
            pushUnresolved(conflicts, `tasks.${id}.actor`, obj.actor);
        }
        if (typeof obj.operation === 'string' && !operationNames.has(obj.operation)) {
            pushUnresolved(conflicts, `tasks.${id}.operation`, obj.operation);
        }
    }
    for (const p of asArray(dna.processes)) {
        const obj = p;
        const procId = typeof obj.name === 'string' ? obj.name : '<unnamed>';
        const steps = Array.isArray(obj.steps) ? obj.steps : [];
        for (const step of steps) {
            const sObj = step;
            const stepId = typeof sObj.id === 'string' ? sObj.id : '<unnamed>';
            if (typeof sObj.task === 'string' && !taskNames.has(sObj.task)) {
                pushUnresolved(conflicts, `processes.${procId}.steps.${stepId}.task`, sObj.task);
            }
        }
    }
}
function collectNames(items) {
    const out = new Set();
    if (!Array.isArray(items))
        return out;
    for (const item of items) {
        if (item && typeof item === 'object' && typeof item.name === 'string') {
            out.add(item.name);
        }
    }
    return out;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function pushUnresolved(conflicts, path, value) {
    conflicts.push({
        path,
        values: [],
        recommendation: { value, reason: 'unresolved-reference: kept as-is so it surfaces for review' },
        kind: 'unresolved-reference',
    });
}
//# sourceMappingURL=index.js.map