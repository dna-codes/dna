"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.materializeProductCore = materializeProductCore;
exports.materializeAndSaveProductCore = materializeAndSaveProductCore;
const fs = __importStar(require("fs"));
const context_1 = require("./context");
/**
 * Materialize product.core.json from operational + surfaces.
 *
 * Algorithm:
 * 1. Flatten the operational domain tree into a flat list of Resources
 *    (annotating each with the domain path it lives under).
 * 2. Walk product.api (resources[].resource) and product.ui (pages[].resource
 *    → api.resources[].resource) to collect surfaced Resource names. Default
 *    to all resources if no surfaces reference anything.
 * 3. Expand the surfaced set via Relationships — a Resource reachable from a
 *    surfaced Resource via any Relationship is included (transitive closure).
 * 4. Filter Operations to those whose `target` is a surfaced Resource.
 * 5. Filter Triggers to those that fire surfaced Operations or Processes
 *    that operate on surfaced Resources.
 * 6. Filter Relationships to ones whose endpoints are both surfaced.
 * 7. Pick the deepest single domain node that contains at least one
 *    surfaced Resource as the core's `domain` field.
 */
function materializeProductCore(operational, api, ui) {
    if (!operational?.domain) {
        throw new Error('materializeProductCore: operational.domain is required');
    }
    // 1. Flatten resources from the domain tree, annotating each with its domain path
    const allResources = flattenResources(operational.domain);
    const resourceByName = new Map(allResources.map((r) => [r.name, r]));
    // 2. Collect surfaced Resource names from product surfaces
    const surfaced = new Set();
    for (const r of api?.resources ?? []) {
        if (r.resource)
            surfaced.add(r.resource);
    }
    // product.ui pages reference Product API resource names; resolve through to operational
    const apiResourceToOpResource = new Map();
    for (const r of api?.resources ?? []) {
        if (r.resource)
            apiResourceToOpResource.set(r.name, r.resource);
    }
    for (const p of ui?.pages ?? []) {
        if (p.resource) {
            const opResource = apiResourceToOpResource.get(p.resource);
            if (opResource)
                surfaced.add(opResource);
        }
    }
    // Fallback: if no surface references anything, surface every Resource
    if (surfaced.size === 0) {
        for (const r of allResources)
            surfaced.add(r.name);
    }
    // 3. Transitive closure via Relationships
    const relationships = operational.relationships ?? [];
    let grew = true;
    while (grew) {
        grew = false;
        for (const rel of relationships) {
            if (surfaced.has(rel.from) && !surfaced.has(rel.to) && resourceByName.has(rel.to)) {
                surfaced.add(rel.to);
                grew = true;
            }
            if (surfaced.has(rel.to) && !surfaced.has(rel.from) && resourceByName.has(rel.from)) {
                surfaced.add(rel.from);
                grew = true;
            }
        }
    }
    // 4. Build the surfaced Resource list (preserve operational.json declaration order)
    const resources = allResources.filter((r) => surfaced.has(r.name));
    // 5. Filter Operations to those targeting a surfaced Resource. Product
    //    Core Operations require a `resource` field (the target as a Resource);
    //    rewrite operational `target` → `resource` while preserving the rest.
    const operations = (operational.operations ?? [])
        .filter((op) => surfaced.has(op.target))
        .map((op) => {
        const projected = { ...op, resource: op.target };
        delete projected.target;
        return projected;
    });
    const operationNames = new Set(operations.map((op) => op.name));
    // 6a. Filter Rules to those constraining surfaced Operations
    const rules = (operational.rules ?? []).filter((r) => operationNames.has(r.operation));
    // 6. Filter Triggers to those firing surfaced Operations / surfaced Processes
    const surfacedProcessNames = new Set();
    for (const proc of operational.processes ?? []) {
        // A Process is surfaced if any of its tasks bind to a surfaced Operation
        const taskNames = new Set((proc.steps ?? []).map((s) => s.task));
        for (const task of operational.tasks ?? []) {
            if (taskNames.has(task.name) && operationNames.has(task.operation)) {
                surfacedProcessNames.add(proc.name);
                break;
            }
        }
    }
    const triggers = (operational.triggers ?? []).filter((t) => (t.operation && operationNames.has(t.operation)) ||
        (t.process && surfacedProcessNames.has(t.process)));
    // 7. Filter Relationships to ones with both endpoints surfaced
    const rels = relationships.filter((r) => surfaced.has(r.from) && surfaced.has(r.to));
    // 8. Pick the domain node for `core.domain`
    const domainInfo = pickDomain(operational.domain, resources);
    const core = { domain: domainInfo };
    if (resources.length)
        core.resources = resources;
    if (operations.length)
        core.operations = operations;
    if (triggers.length)
        core.triggers = triggers;
    if (rules.length)
        core.rules = rules;
    if (rels.length)
        core.relationships = rels;
    return core;
}
function flattenResources(domain) {
    const out = [];
    const walk = (d) => {
        const dpath = d.path || d.name;
        for (const r of d.resources ?? []) {
            // Spread so we don't mutate the source. The `domain` annotation is for
            // the materializer's own use — strip it before writing product.core
            // so the output stays clean.
            out.push({ ...r, _domain: r._domain ?? dpath });
        }
        for (const sub of d.domains ?? [])
            walk(sub);
    };
    walk(domain);
    return out.map(({ _domain, ...rest }) => rest);
}
/**
 * Pick the deepest domain node that contains at least one surfaced Resource.
 * For single-domain platforms, this is the leaf domain the Resources live under.
 */
function pickDomain(root, surfaced) {
    // Re-scan the tree for surfaced names so we know which domains contain them
    const surfacedNames = new Set(surfaced.map((r) => r.name));
    const domainsContainingSurfaced = new Set();
    const walk = (d) => {
        const dpath = d.path || d.name || '';
        for (const r of d.resources ?? []) {
            if (surfacedNames.has(r.name))
                domainsContainingSurfaced.add(dpath);
        }
        for (const sub of d.domains ?? [])
            walk(sub);
    };
    walk(root);
    let best = root;
    let bestDepth = (root.path || root.name || '').split('.').length;
    const visit = (d) => {
        const dpath = d.path || d.name || '';
        const depth = dpath.split('.').length;
        if (domainsContainingSurfaced.has(dpath) && depth >= bestDepth) {
            best = d;
            bestDepth = depth;
        }
        for (const sub of d.domains ?? [])
            visit(sub);
    };
    visit(root);
    const out = {
        name: best.name,
        path: best.path || best.name,
    };
    if (best.description)
        out.description = best.description;
    return out;
}
/**
 * Read operational.json + optional product surfaces from a domain, materialize
 * product.core.json, and write it to the domain directory.
 */
function materializeAndSaveProductCore(paths) {
    const operational = (0, context_1.loadLayer)(paths, 'operational');
    let api;
    let ui;
    try {
        if (fs.existsSync(paths.files['product.api']))
            api = (0, context_1.loadLayer)(paths, 'product.api');
    }
    catch { /* optional */ }
    try {
        if (fs.existsSync(paths.files['product.ui']))
            ui = (0, context_1.loadLayer)(paths, 'product.ui');
    }
    catch { /* optional */ }
    const core = materializeProductCore(operational, api, ui);
    fs.writeFileSync(paths.files['product.core'], JSON.stringify(core, null, 2) + '\n', 'utf-8');
    return core;
}
//# sourceMappingURL=product-core.js.map