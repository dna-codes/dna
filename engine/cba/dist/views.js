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
exports.runViews = runViews;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const args_1 = require("./args");
const output_1 = require("./output");
const plan_1 = require("./deliver/plan");
const context_1 = require("./context");
/**
 * `cba views <domain> --env <env>` — derive architecture graph JSON from technical DNA.
 *
 * The graph is auto-derived from the cells, constructs, and providers arrays in
 * technical.json (with environment overlay applied). The hand-maintained
 * technical.json `views[]` section is treated as a pure layout overlay:
 * saved position/size are merged onto derived nodes. This means:
 *
 *   - Adding a cell/construct/provider to technical DNA makes it appear automatically
 *   - Removing one removes it from the graph
 *   - Manual position edits persist across DNA changes
 *
 * Output: { views: [ { name: 'deployment', nodes: [...], connections: [...], zones: [...] } ] }
 */
function runViews(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba views <domain> [--env <environment>]', opts);
        process.exit(1);
    }
    // Environment is optional — if omitted, pick the first one declared in technical DNA
    let environment = (0, args_1.flag)(args, 'env');
    if (!environment) {
        try {
            const paths = (0, context_1.resolveDomain)(domain);
            const technical = (0, context_1.loadLayer)(paths, 'technical');
            environment = (technical.environments?.[0]?.name) ?? 'dev';
        }
        catch (err) {
            (0, output_1.emitError)(err.message, opts);
            process.exit(1);
        }
    }
    let plan;
    try {
        plan = (0, plan_1.buildPlan)(domain, environment);
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    // Read the existing views[] section as a layout overlay (positions, sizes, zone bounds)
    const technical = (0, context_1.loadLayer)(plan.paths, 'technical');
    const savedViews = technical.views ?? [];
    const derived = deriveView(plan, savedViews[0]);
    const output = { views: [derived] };
    if (opts.json) {
        process.stdout.write(JSON.stringify(output));
    }
    else {
        process.stdout.write(JSON.stringify(output, null, 2));
    }
}
// ── Derivation ──
/**
 * Adapters that don't produce a running service of their own — their entire
 * purpose is to provision an underlying Construct (schema, queue config, etc.).
 * On a deployment view these cells are redundant with their construct, so we
 * hide them. The provisioning relationship still lives in technical DNA's
 * `cell.constructs[]`; it's just not shown as a separate node.
 */
const PROVISIONER_ADAPTERS = new Set([
    'postgres',
    'node/event-bus',
]);
function isProvisioner(cell) {
    return PROVISIONER_ADAPTERS.has(cell.adapterType);
}
/**
 * Adapters that produce a frontend/UI service. Used to arrange cells in the
 * deployment view top-to-bottom: frontend → backend → storage.
 */
function isFrontend(cell) {
    const t = cell.adapterType;
    return (t.startsWith('vite/') ||
        t.startsWith('next/') ||
        t.startsWith('nuxt/') ||
        t === 'react' ||
        t === 'vue' ||
        t === 'svelte');
}
/**
 * Infer the deployed URL for a cell. Priority order:
 *
 *   1. Live terraform outputs (`deployedUrls` map) — CloudFront for vite
 *      cells, ALB for non-vite. Only populated for non-dev envs.
 *   2. First outputs[] entry whose value starts with `http`. Dev-only entries
 *      hardcoded to localhost are filtered out under non-dev envs.
 *   3. `http://localhost:<port>` from adapterConfig.port — DEV ONLY.
 *   4. undefined (unknown — renders as a blank URL ribbon in cba-viz).
 *
 * dev and prod are strictly separated: dev cells never show terraform
 * outputs (they should be docker-compose/local URLs), and prod cells never
 * show localhost (those would be dead links). When prod has no tfstate
 * yet, cells render with a blank ribbon as a placeholder.
 */
function cellUrl(cell, environment, deployedUrls) {
    const deployed = deployedUrls.get(cell.name);
    if (deployed)
        return deployed;
    const isDev = environment === 'dev';
    for (const output of cell.outputs ?? []) {
        const value = output?.value;
        if (typeof value !== 'string' || !value.startsWith('http'))
            continue;
        // `localhost` / `127.0.0.1` is a dev-only concept — skip it under prod so
        // we don't advertise dead links. (Technical.json currently hardcodes
        // api-cell's output to http://localhost:3001; a proper env-scoped
        // outputs overlay is a follow-up.)
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(value);
        if (isLocalhost && !isDev)
            continue;
        return value;
    }
    if (isDev) {
        const port = cell.adapterConfig?.port;
        if (typeof port === 'number')
            return `http://localhost:${port}`;
    }
    return undefined;
}
/**
 * Dev-only admin URL for a construct, when one is inferable from its
 * config. Right now this only covers engines that expose a web management
 * UI on a declared `management_port` (RabbitMQ is the main one). Anything
 * else returns undefined and the viewer renders a blank URL ribbon — same
 * behavior as cells without an inferred URL.
 *
 * Prod intentionally returns undefined: managed services (RDS, EventBridge,
 * SQS) don't expose a public admin URL, and advertising an AWS console
 * deeplink from DNA would require the account id + region we don't carry.
 */
function constructUrl(construct, environment) {
    if (environment !== 'dev')
        return undefined;
    const mgmt = construct.config?.management_port;
    if (typeof mgmt === 'number')
        return `http://localhost:${mgmt}`;
    return undefined;
}
/**
 * Convert a DNA name to a terraform identifier. Mirrors the `tfId` helper in
 * `packages/cba/src/deliver/adapters/terraform-aws.ts` and the copy in
 * `packages/cba-viz/vite.config.ts`. If you change this, change them all.
 */
function tfIdOf(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}
/**
 * Build a `cellName → deployed URL` map from the domain's terraform state,
 * if it exists. Runs on every `cba views` call, so it has to be a cheap
 * synchronous read — no CLI spawns, no AWS probing. The tfstate itself is
 * the source of truth: outputs only appear after a successful `terraform
 * apply`, so "output is present" = "this resource is running".
 *
 * Mapping rules (must match `buildOutputsTf` in terraform-aws.ts):
 *   - vite/*  cells → `cloudfront_domain_<tfIdOf(name)>` → `https://<value>/`
 *   - non-vite, non-provisioner cells → `alb_dns_name`  → `http://<value>`
 *
 * All non-vite cells share one ALB in the current topology, so they all get
 * the same hostname — that's accurate since the ALB routes by path.
 * When there's no tfstate or no matching output, the cell is absent from
 * the map and `cellUrl` falls through to its next priority rule.
 */
function readDeployedCellUrls(plan) {
    const out = new Map();
    const statePath = path.join(plan.deployDir, 'terraform.tfstate');
    if (!fs.existsSync(statePath))
        return out;
    let state;
    try {
        state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    catch {
        return out;
    }
    const outputs = {};
    for (const [name, entry] of Object.entries(state.outputs ?? {})) {
        outputs[name] = entry?.value;
    }
    if (Object.keys(outputs).length === 0)
        return out;
    const albDns = typeof outputs.alb_dns_name === 'string' ? outputs.alb_dns_name : undefined;
    for (const cell of plan.cells) {
        if (isProvisioner(cell))
            continue;
        const key = tfIdOf(cell.name);
        if (cell.adapterType.startsWith('vite/')) {
            const cf = outputs[`cloudfront_domain_${key}`];
            if (typeof cf === 'string' && cf.length > 0) {
                out.set(cell.name, `https://${cf}/`);
            }
            continue;
        }
        // Non-vite cells ride the shared ALB. Root path is what a user wants to
        // click; the status probe uses /health separately for healthchecks.
        if (albDns) {
            out.set(cell.name, `http://${albDns}`);
        }
    }
    return out;
}
/**
 * Derive a single deployment view from an EnvironmentPlan.
 *
 * Layout rules — top to bottom, frontend → backend → storage:
 *   - Frontend cells (UI) in the top row
 *   - Backend cells (API/service) in the middle row
 *   - Constructs (storage) in the bottom row
 *   - If savedView has a node with the same id, its position/size wins
 *
 * Providers are NOT rendered on the deployment view — they're config
 * (which cloud, which auth backend), not deployable infrastructure.
 */
function deriveView(plan, savedView) {
    // Visible cells excludes provisioner cells (those whose job is to set up
    // a construct — they have no independent runtime service)
    const visibleCells = plan.cells.filter((c) => !isProvisioner(c));
    const frontendCells = visibleCells.filter(isFrontend);
    const backendCells = visibleCells.filter((c) => !isFrontend(c));
    // Read terraform outputs once per derive call — gives each visible cell
    // its live CloudFront / ALB URL in prod mode. Scoped to non-dev so that
    // a populated tfstate doesn't leak prod URLs into the dev view (dev is
    // strictly docker-compose/local). Empty map before the first terraform
    // apply; cellUrl() then falls back to its next priority.
    const deployedUrls = plan.environment === 'dev'
        ? new Map()
        : readDeployedCellUrls(plan);
    // Build a lookup of saved positions by node id
    const savedPositions = new Map();
    for (const node of savedView?.nodes ?? []) {
        savedPositions.set(node.id, { pos: node.position, size: node.size });
    }
    const savedZoneLayout = new Map();
    for (const zone of savedView?.zones ?? []) {
        savedZoneLayout.set(zone.id, { pos: zone.position, size: zone.size });
    }
    const nodes = [];
    const connections = [];
    // ── Layout constants ──
    //
    // ROW_GAP must leave enough space for the manhattan router to elbow in
    // the middle of the channel between rows (router padding is 20px per
    // side in cba-viz, so a ~80px row gap gives a comfortable 40px routing
    // channel where arrows can bend without touching node edges).
    const CELL_W = 160;
    const CELL_H = 70;
    const CONSTRUCT_W = 160;
    const CONSTRUCT_H = 70;
    const GAP_X = 40; // horizontal gap between siblings
    const ROW_GAP = 90; // vertical gap between rows within a zone
    const ZONE_GAP = 60; // extra gap between zones
    const MARGIN = 40; // margin inside a zone
    // Row Ys — frontend on top, backend below, constructs at the bottom
    const FRONTEND_Y = MARGIN + 30; // room for zone header
    const BACKEND_Y = FRONTEND_Y + CELL_H + ROW_GAP;
    const CONSTRUCT_Y = BACKEND_Y + CELL_H + ROW_GAP + ZONE_GAP + 30; // room for next zone header
    // Layout a row of cells centered inside the compute zone width.
    // Currently left-aligned starting at MARGIN — same as constructs.
    const layoutRow = (cells, y) => {
        let x = MARGIN;
        for (const cell of cells) {
            const saved = savedPositions.get(cell.name);
            nodes.push({
                id: cell.name,
                name: cell.label ?? cell.name,
                type: 'cell',
                status: 'planned',
                position: saved?.pos ?? { x, y },
                size: saved?.size ?? { width: CELL_W, height: CELL_H },
                description: cell.description,
                metadata: {
                    // `role` is the kebab-case cell name (e.g. "api-cell") — the
                    // viewer renders it as a subtitle under `name` when `label`
                    // supplied a friendlier title. Kept distinct from `id` because
                    // the viewer's ids are treated as opaque identity keys.
                    role: cell.name,
                    adapter: cell.adapterType,
                    url: cellUrl(cell, plan.environment, deployedUrls),
                },
            });
            x += CELL_W + GAP_X;
        }
    };
    // ── Frontend row (top) ──
    layoutRow(frontendCells, FRONTEND_Y);
    // ── Backend row (middle) ──
    layoutRow(backendCells, BACKEND_Y);
    // ── Constructs (bottom) ──
    let constructX = MARGIN;
    for (const construct of plan.constructs) {
        const saved = savedPositions.get(construct.name);
        const engine = construct.config?.engine ?? construct.type;
        nodes.push({
            id: construct.name,
            name: construct.label ?? construct.name,
            type: 'construct',
            status: 'planned',
            position: saved?.pos ?? { x: constructX, y: CONSTRUCT_Y },
            size: saved?.size ?? { width: CONSTRUCT_W, height: CONSTRUCT_H },
            description: construct.description,
            metadata: {
                // See cell layout above: `role` carries the kebab-case name so
                // the viewer can render it as a subtitle when `label` has
                // replaced it in `name`.
                role: construct.name,
                category: construct.category,
                type: construct.type,
                engine,
                provider: construct.provider,
                url: constructUrl(construct, plan.environment),
            },
        });
        constructX += CONSTRUCT_W + GAP_X;
    }
    // ── Connections: visible cells → their constructs (communicates-with) ──
    // Provisioner cells are excluded, so we don't emit edges from them.
    // Backend cells talk to their storage constructs at runtime (reads/writes,
    // publishes signals), which is `communicates-with` semantics — not a
    // build-time `depends-on` relationship.
    for (const cell of visibleCells) {
        for (const constructName of cell.constructs) {
            if (!plan.constructs.some((c) => c.name === constructName))
                continue;
            connections.push({
                id: `${cell.name}->${constructName}`,
                source: cell.name,
                target: constructName,
                type: 'communicates-with',
            });
        }
    }
    // ── Connections: cell → cell (communicates-with) ──
    //
    // Two inference rules, both emit a `communicates-with` edge:
    //
    //   1. adapter.config.api_dna matches another cell's `dna` field.
    //      (e.g. ui-cell.api_dna = torts/marshall/product.api, api-cell.dna = same)
    //      This catches the authoring-time relationship: a UI cell is built
    //      against a specific Product API DNA, so it talks to whichever cell
    //      serves that DNA. Works even when the UI has no explicit api_base URL.
    //
    //   2. adapter.config.api_base matches another cell's outputs[].value.
    //      (e.g. admin-ui-cell.api_base = http://localhost:3001 matches
    //       api-cell outputs.api_url = http://localhost:3001)
    //      This catches the runtime-URL relationship.
    //
    // Rule 1 subsumes rule 2 for well-formed DNA, but we keep both for robustness.
    // Duplicates are deduped by edge id.
    const cellByDna = new Map();
    const cellByOutputUrl = new Map();
    for (const cell of visibleCells) {
        if (cell.dna)
            cellByDna.set(cell.dna, cell.name);
        for (const output of cell.outputs ?? []) {
            if (output?.value)
                cellByOutputUrl.set(output.value, cell.name);
        }
    }
    const addedEdges = new Set();
    const addEdge = (source, target) => {
        if (!target || source === target)
            return;
        const id = `${source}->${target}`;
        if (addedEdges.has(id))
            return;
        addedEdges.add(id);
        connections.push({ id, source, target, type: 'communicates-with' });
    };
    for (const cell of visibleCells) {
        const apiDna = cell.adapterConfig?.api_dna;
        if (apiDna) {
            const target = cellByDna.get(apiDna);
            if (target)
                addEdge(cell.name, target);
        }
        const apiBase = cell.adapterConfig?.api_base;
        if (apiBase) {
            const target = cellByOutputUrl.get(apiBase);
            if (target)
                addEdge(cell.name, target);
        }
    }
    // ── Zones: delivery boundary + Compute tier + Storage tier ──
    //
    // The delivery boundary is a single zone wrapping all visible nodes,
    // labeled by the environment's delivery target:
    //   - dev  → "Docker" (docker-compose running locally)
    //   - prod → "AWS / us-east-1 VPC" (or whatever cloud provider + region)
    //
    // Dev and prod stay structurally symmetric — same number of nodes, same
    // zones, same connections. Only the outer boundary's label and the inner
    // styling (status, URLs) change. Listed FIRST so cba-viz renders it
    // behind the tier zones (see dna-to-graph.ts z-ordering).
    const zones = [];
    const boundaryNodes = [
        ...visibleCells.map((c) => c.name),
        ...plan.constructs.map((c) => c.name),
    ];
    const cloudProvider = plan.providers.find((p) => p.type === 'cloud');
    let boundaryName;
    let boundaryId = 'zone-delivery';
    if (plan.environment === 'dev') {
        // All local-dev topologies we support (docker-compose) run under Docker.
        boundaryName = 'Docker';
        boundaryId = 'zone-docker';
    }
    else if (cloudProvider) {
        const providerLabel = cloudProvider.name.toUpperCase();
        const regionLabel = cloudProvider.region ? ` / ${cloudProvider.region}` : '';
        boundaryName = `${providerLabel}${regionLabel} VPC`;
        boundaryId = 'zone-vpc';
    }
    if (boundaryName && boundaryNodes.length > 0) {
        const savedZone = savedZoneLayout.get(boundaryId);
        zones.push({
            id: boundaryId,
            name: boundaryName,
            type: 'boundary',
            nodes: boundaryNodes,
            position: savedZone?.pos,
            size: savedZone?.size,
        });
    }
    if (visibleCells.length > 0) {
        const savedZone = savedZoneLayout.get('zone-compute');
        zones.push({
            id: 'zone-compute',
            name: 'Compute',
            type: 'tier',
            nodes: visibleCells.map((c) => c.name),
            position: savedZone?.pos,
            size: savedZone?.size,
        });
    }
    if (plan.constructs.length > 0) {
        const savedZone = savedZoneLayout.get('zone-storage');
        zones.push({
            id: 'zone-storage',
            name: 'Storage',
            type: 'tier',
            nodes: plan.constructs.map((c) => c.name),
            position: savedZone?.pos,
            size: savedZone?.size,
        });
    }
    return {
        name: 'deployment',
        description: `Derived from ${plan.domain} technical DNA (environment: ${plan.environment}).`,
        nodes,
        connections,
        zones,
    };
}
//# sourceMappingURL=views.js.map