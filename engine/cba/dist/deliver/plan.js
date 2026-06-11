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
exports.buildPlan = buildPlan;
exports.checkArtifacts = checkArtifacts;
exports.resolveProfile = resolveProfile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const context_1 = require("../context");
/**
 * Build a delivery plan for a given domain + environment.
 *
 * Environment overlay rule: entries with matching `environment` field override
 * entries with no `environment` field (the default). This applies to Cells,
 * Constructs, Variables, and Scripts.
 *
 * Output layout is env-scoped: every generated cell and the deploy dir live
 * under `output/<domain>/<env>/`, so dev and prod artifacts coexist without
 * clobbering each other (dev can compile against SQLite + RabbitMQ while
 * prod uses Postgres + EventBridge, etc.).
 */
function buildPlan(domain, environment) {
    const paths = (0, context_1.resolveDomain)(domain);
    const technical = (0, context_1.loadLayer)(paths, 'technical');
    // Validate environment exists
    const envs = (technical.environments ?? []);
    if (!envs.some((e) => e.name === environment)) {
        const names = envs.map((e) => e.name).join(', ') || '(none)';
        throw new Error(`Environment "${environment}" not declared in technical DNA. Available: ${names}`);
    }
    return {
        domain,
        environment,
        paths,
        constructs: overlayByName(technical.constructs ?? [], environment),
        variables: overlayByName(technical.variables ?? [], environment),
        cells: overlayByName(technical.cells ?? [], environment).map((c) => resolveCell(c, domain, paths.root, environment)),
        providers: (technical.providers ?? []).map((p) => ({
            name: p.name,
            type: p.type,
            region: p.region,
            description: p.description,
            config: p.config,
        })),
        scripts: overlayByName(technical.scripts ?? [], environment),
        deployDir: path.join(paths.root, 'output', domain, environment, 'deploy'),
    };
}
/**
 * Overlay logic: for each distinct `name`, prefer the entry whose
 * `environment` matches the target env; fall back to the entry with no
 * `environment` field.
 */
function overlayByName(items, environment) {
    const byName = new Map();
    for (const item of items) {
        if (item.environment && item.environment !== environment)
            continue;
        const existing = byName.get(item.name);
        // env-specific wins over default
        if (!existing || (item.environment && !existing.environment)) {
            byName.set(item.name, item);
        }
    }
    return Array.from(byName.values());
}
function resolveCell(cell, domain, root, environment) {
    const suffix = cell.name.replace(/-cell/g, '').replace(/^-|-$/g, '');
    const outputDir = path.join(root, 'output', domain, environment, suffix);
    return {
        name: cell.name,
        label: cell.label,
        description: cell.description,
        dna: cell.dna,
        adapterType: cell.adapter.type,
        adapterConfig: cell.adapter.config,
        constructs: cell.constructs ?? [],
        variables: overlayByName(cell.variables ?? [], environment),
        outputs: cell.outputs ?? [],
        outputDir,
    };
}
/**
 * Verify that every cell in the plan has been developed (output dir exists
 * with a canonical artifact). Returns a list of missing cells.
 *
 * Canonical artifact per adapter family:
 *   node/*, vite/*, next/*  → package.json (node project)
 *   postgres                 → docker-compose.yml (infra-only, no node deps)
 */
function checkArtifacts(plan) {
    const missing = [];
    for (const cell of plan.cells) {
        const marker = canonicalArtifactFor(cell.adapterType);
        if (!fs.existsSync(path.join(cell.outputDir, marker))) {
            missing.push(cell.name);
        }
    }
    return missing;
}
/**
 * Look up a named profile from the technical DNA's `profiles` map.
 * Returns the cell name list, or null if the profile doesn't exist.
 */
function resolveProfile(domain, profileName) {
    const paths = (0, context_1.resolveDomain)(domain);
    const technical = (0, context_1.loadLayer)(paths, 'technical');
    const profiles = technical.profiles;
    if (!profiles || !(profileName in profiles))
        return null;
    return profiles[profileName];
}
function canonicalArtifactFor(adapterType) {
    if (adapterType === 'postgres')
        return 'docker-compose.yml';
    if (adapterType.startsWith('ruby/'))
        return 'Gemfile';
    if (adapterType.startsWith('python/'))
        return 'requirements.txt';
    return 'package.json';
}
//# sourceMappingURL=plan.js.map