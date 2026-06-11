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
exports.PRIMITIVES = void 0;
exports.primitivesForLayer = primitivesForLayer;
exports.findPrimitiveSpec = findPrimitiveSpec;
exports.walkDomains = walkDomains;
exports.collectPrimitives = collectPrimitives;
exports.findDomainByPath = findDomainByPath;
exports.findNounByName = findNounByName;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** Resolve the on-disk schemas directory bundled with @dna-codes/dna-schemas. */
function schemasRoot() {
    return path.dirname(require.resolve('@dna-codes/dna-schemas/package.json'));
}
/** Read the title-case display name from a JSON Schema file. */
function readSchemaTitle(file) {
    try {
        const doc = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (typeof doc.title === 'string' && doc.title.length > 0)
            return doc.title;
    }
    catch {
        /* fall through */
    }
    return null;
}
/** Title-case a kebab/snake/lower identifier ("event-bus" → "EventBus"). */
function titleCase(name) {
    return name
        .split(/[-_]/)
        .map((seg) => (seg.length === 0 ? seg : seg[0].toUpperCase() + seg.slice(1)))
        .join('');
}
/** Build a Primitive type name from a schema file basename. Prefers the schema's `title` field. */
function typeNameFor(schemaFile) {
    const title = readSchemaTitle(schemaFile);
    if (title)
        return title;
    return titleCase(path.basename(schemaFile, '.json'));
}
/**
 * CBA-convention map of primitive type → document location. Keys are
 * `<layer-segment>/<schema-basename>` matching the `@dna-codes/dna-schemas`
 * directory layout. Schemas not listed here are treated as "child" shapes
 * (e.g. operational/action, operational/attribute) and surfaced via their
 * parent's primitive walk.
 */
const LOCATIONS = {
    // ── operational ───────────────────────────────────────────────────────
    // Domain tree (the four "noun" primitives + the tree itself)
    'operational/domain': { location: 'domain', nested: true },
    'operational/resource': { location: 'domain.*.resources', nested: true },
    'operational/person': { location: 'domain.*.persons', nested: true },
    'operational/role': { location: 'domain.*.roles', nested: true },
    'operational/group': { location: 'domain.*.groups', nested: true },
    // Children of any noun primitive — collected during tree walk
    'operational/action': { location: 'domain.*.<noun>.*.actions', nested: true, childOf: 'noun' },
    'operational/attribute': { location: 'domain.*.<noun>.*.attributes', nested: true, childOf: 'noun' },
    // Top-level operational arrays
    'operational/membership': { location: 'memberships' },
    'operational/operation': { location: 'operations' },
    'operational/trigger': { location: 'triggers' },
    'operational/rule': { location: 'rules' },
    'operational/task': { location: 'tasks' },
    'operational/process': { location: 'processes' },
    'operational/relationship': { location: 'relationships' },
    // ── product/core ──────────────────────────────────────────────────────
    'product/core/resource': { location: 'resources' },
    'product/core/operation': { location: 'operations' },
    'product/core/action': { location: 'resources.*.actions', nested: true, childOf: 'resource' },
    'product/core/field': { location: 'resources.*.fields', nested: true, childOf: 'resource' },
    // ── product/api ───────────────────────────────────────────────────────
    'product/api/namespace': { location: 'namespace', singleton: true },
    'product/api/endpoint': { location: 'endpoints' },
    'product/api/param': { location: 'params' },
    'product/api/schema': { location: 'schemas' },
    // ── product/web ───────────────────────────────────────────────────────
    'product/web/layout': { location: 'layout', singleton: true },
    'product/web/page': { location: 'pages' },
    'product/web/route': { location: 'routes' },
    'product/web/block': { location: 'pages.*.blocks', nested: true, childOf: 'page' },
    // ── technical ─────────────────────────────────────────────────────────
    'technical/environment': { location: 'environments' },
    'technical/provider': { location: 'providers' },
    'technical/construct': { location: 'constructs' },
    'technical/variable': { location: 'variables' },
    'technical/cell': { location: 'cells' },
    'technical/output': { location: 'outputs' },
    'technical/view': { location: 'views' },
    'technical/node': { location: 'views.*.nodes', nested: true },
    'technical/connection': { location: 'views.*.connections', nested: true },
    'technical/zone': { location: 'views.*.zones', nested: true },
};
/** Map @dna-codes layer-segment → CBA Layer token. */
const LAYER_BY_SEGMENT = {
    operational: 'operational',
    'product/core': 'product.core',
    'product/api': 'product.api',
    'product/web': 'product.ui',
    technical: 'technical',
};
/** Layer segments to walk (matches the @dna-codes/dna-schemas directory tree). */
const LAYER_SEGMENTS = ['operational', 'product/core', 'product/api', 'product/web', 'technical'];
/**
 * Walk the @dna-codes/dna-schemas directory tree and build the canonical primitive
 * catalog. Each primitive's type name comes from its schema's `title` field;
 * its location comes from the LOCATIONS convention map.
 *
 * Schemas matching a layer's "envelope" file (e.g. `operational/operational.json`,
 * `product/product.api.json`) are skipped — those validate the whole document,
 * not a single primitive.
 */
function buildPrimitives() {
    const root = schemasRoot();
    const out = [];
    for (const segment of LAYER_SEGMENTS) {
        const dir = path.join(root, segment);
        if (!fs.existsSync(dir))
            continue;
        const layer = LAYER_BY_SEGMENT[segment];
        for (const file of fs.readdirSync(dir).sort()) {
            if (!file.endsWith('.json'))
                continue;
            const base = path.basename(file, '.json');
            // Skip the layer-envelope schemas (e.g. operational.json validates a whole doc)
            if (base === segment.split('/').pop() || base === 'operational' || base === 'technical' || base.startsWith('product.')) {
                continue;
            }
            const key = `${segment}/${base}`;
            const loc = LOCATIONS[key];
            if (!loc)
                continue;
            out.push({
                type: typeNameFor(path.join(dir, file)),
                layer,
                ...loc,
            });
        }
    }
    return out;
}
/** Module-load: build once. Re-exported for callers that just want to enumerate. */
exports.PRIMITIVES = buildPrimitives();
function primitivesForLayer(layer) {
    return exports.PRIMITIVES.filter((p) => p.layer === layer);
}
function findPrimitiveSpec(layer, type) {
    return exports.PRIMITIVES.find((p) => p.layer === layer && p.type.toLowerCase() === type.toLowerCase());
}
/** Walk the operational domain tree, yielding each domain node with its dotted path. */
function walkDomains(domain, visit) {
    if (!domain)
        return;
    visit(domain, domain.path || domain.name);
    for (const child of domain.domains ?? []) {
        walkDomains(child, visit);
    }
}
/**
 * The four operational "noun" primitives — Resource, Person, Role, Group —
 * share a common shape (name, attributes[], actions[], parent?) and live
 * inside the domain tree. CBA needs to walk all four when surfacing
 * Action/Attribute children regardless of which kind of noun owns them.
 */
const NOUN_KINDS = [
    { key: 'resources', label: 'Resource' },
    { key: 'persons', label: 'Person' },
    { key: 'roles', label: 'Role' },
    { key: 'groups', label: 'Group' },
];
/**
 * Collect every instance of a primitive type across a layer document.
 *
 * Handles three traversal styles:
 *   - top-level array (`location: "operations"`)
 *   - top-level singleton (`location: "namespace"`, `singleton: true`)
 *   - tree-walked (`location: "domain.*.resources"` or `"views.*.nodes"`)
 *   - parent-aware children (operational actions/attributes — collected from
 *     every Resource / Person / Role / Group in the domain tree)
 */
function collectPrimitives(doc, spec) {
    if (!doc)
        return [];
    // ── Architecture view-nested primitives (nodes, connections, zones inside views) ──
    if (spec.nested && spec.location.startsWith('views.*')) {
        const out = [];
        const field = spec.location.split('.').pop();
        for (const view of doc.views ?? []) {
            for (const item of view[field] ?? []) {
                out.push({
                    type: spec.type,
                    name: item.name ?? item.id ?? '(unnamed)',
                    domainPath: view.name,
                    node: item,
                });
            }
        }
        return out;
    }
    // ── Action / Attribute on any of the four noun primitives ──
    if (spec.nested && spec.childOf === 'noun') {
        const childKey = spec.location.endsWith('.actions') ? 'actions' : 'attributes';
        const out = [];
        walkDomains(doc.domain, (node, dpath) => {
            for (const { key, label } of NOUN_KINDS) {
                for (const noun of node[key] ?? []) {
                    for (const child of noun[childKey] ?? []) {
                        out.push({
                            type: spec.type,
                            name: child.name,
                            domainPath: `${dpath}:${label}.${noun.name}`,
                            node: child,
                        });
                    }
                }
            }
        });
        return out;
    }
    // ── product/core fields/actions (children of resources) ──
    if (spec.nested && (spec.childOf === 'resource' || spec.childOf === 'page')) {
        const parentKey = spec.childOf === 'resource' ? 'resources' : 'pages';
        const childKey = spec.location.split('.').pop();
        const out = [];
        for (const parent of doc[parentKey] ?? []) {
            for (const child of parent[childKey] ?? []) {
                out.push({
                    type: spec.type,
                    name: child.name,
                    domainPath: parent.name,
                    node: child,
                });
            }
        }
        return out;
    }
    // ── Operational nouns (resources/persons/roles/groups) tree-walked ──
    if (spec.nested && spec.location.startsWith('domain.*')) {
        const out = [];
        const field = spec.location.split('.').pop(); // 'resources' | 'persons' | 'roles' | 'groups'
        walkDomains(doc.domain, (node, dpath) => {
            for (const item of node[field] ?? []) {
                out.push({ type: spec.type, name: item.name, domainPath: dpath, node: item });
            }
        });
        return out;
    }
    // ── Domain itself — flatten the tree into Domain primitives ──
    if (spec.type === 'Domain') {
        const out = [];
        walkDomains(doc.domain, (node, dpath) => {
            out.push({ type: 'Domain', name: node.name, domainPath: dpath, node });
        });
        return out;
    }
    // ── Top-level singleton (Namespace, Layout) ──
    if (spec.singleton) {
        const node = doc[spec.location];
        return node ? [{ type: spec.type, name: node.name ?? spec.type, node }] : [];
    }
    // ── Top-level array ──
    const arr = doc[spec.location] ?? [];
    return arr.map((item) => ({
        type: spec.type,
        name: item.name ?? '(unnamed)',
        node: item,
    }));
}
/** Find the domain node at a given dotted path. */
function findDomainByPath(domain, targetPath) {
    let found;
    walkDomains(domain, (node, dpath) => {
        if (dpath === targetPath)
            found = node;
    });
    return found;
}
/**
 * For an operational noun primitive (Resource/Person/Role/Group), find it by
 * `name` anywhere in the domain tree. Used by the CLI to resolve `--at` paths
 * for adding Action/Attribute children.
 *
 * Returns the noun node and its kind ("resources" | "persons" | "roles" | "groups")
 * so the caller knows which child collection to mutate.
 */
function findNounByName(domain, domainPath, nounName) {
    const dom = findDomainByPath(domain, domainPath);
    if (!dom)
        return undefined;
    for (const { key } of NOUN_KINDS) {
        const found = (dom[key] ?? []).find((n) => n.name === nounName);
        if (found)
            return { noun: found, kind: key };
    }
    return undefined;
}
//# sourceMappingURL=primitives.js.map