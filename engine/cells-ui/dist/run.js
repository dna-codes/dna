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
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dna_core_1 = require("@dna-codes/dna-core");
const viteReactAdapter = __importStar(require("./adapters/vite/react"));
const viteVueAdapter = __importStar(require("./adapters/vite/vue"));
const nextReactAdapter = __importStar(require("./adapters/next/react"));
const astroAdapter = __importStar(require("./adapters/astro"));
const ADAPTERS = {
    'vite/react': viteReactAdapter,
    'vite/vue': viteVueAdapter,
    'next/react': nextReactAdapter,
    'astro': astroAdapter,
};
function resolveAdapter(type) {
    const adapter = ADAPTERS[type];
    if (!adapter) {
        throw new Error(`Unknown adapter: "${type}". Available: ${Object.keys(ADAPTERS).join(', ')}`);
    }
    return adapter;
}
function loadDna(dnaBase, ref) {
    const resolved = path.resolve(dnaBase, `${ref}.json`);
    if (!fs.existsSync(resolved)) {
        throw new Error(`DNA file not found: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}
/**
 * Locate the `dna/` directory that holds referenced DNA files.
 *
 * Priority:
 *   1. `CBA_DNA_BASE` env var — set by `cba develop` when it spawns the
 *      generator against a resolved technical.json that lives under output/.
 *   2. Walk up from `technicalPath` looking for a `dna/` ancestor — the
 *      legacy path used when the cell generator is invoked directly.
 */
function findDnaBase(technicalPath) {
    const fromEnv = process.env.CBA_DNA_BASE;
    if (fromEnv)
        return path.resolve(fromEnv);
    let dir = path.dirname(path.resolve(technicalPath));
    const root = path.parse(dir).root;
    while (dir !== root) {
        if (path.basename(dir) === 'dna')
            return dir;
        dir = path.dirname(dir);
    }
    return path.join(path.dirname(path.resolve(technicalPath)), '..', '..', 'dna');
}
function run(technicalPath, cellName, outputDir) {
    const validator = new dna_core_1.DnaValidator();
    // ── Load Technical DNA ──────────────────────────────────────────────────────
    const technicalRaw = JSON.parse(fs.readFileSync(path.resolve(technicalPath), 'utf-8'));
    const cell = technicalRaw.cells.find(c => c.name === cellName);
    if (!cell) {
        throw new Error(`Cell "${cellName}" not found. Available: ${technicalRaw.cells.map(c => c.name).join(', ')}`);
    }
    // ── Resolve DNA base directory ──────────────────────────────────────────────
    const dnaBase = findDnaBase(technicalPath);
    // ── Load and validate Product UI DNA ───────────────────────────────────────
    const uiDnaRaw = loadDna(dnaBase, cell.dna);
    const uiValidation = validator.validate(uiDnaRaw, 'product/ui');
    if (!uiValidation.valid) {
        const errs = uiValidation.errors.map(e => `  ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`Invalid Product UI DNA:\n${errs}`);
    }
    // ── Optionally load and validate Product Core DNA ───────────────────────────
    const coreRef = cell.adapter.config?.core_dna;
    let coreRaw;
    if (coreRef) {
        const raw = loadDna(dnaBase, coreRef);
        const coreValidation = validator.validate(raw, 'product/core');
        if (!coreValidation.valid) {
            const errs = coreValidation.errors.map(e => `  ${e.instancePath} ${e.message}`).join('\n');
            throw new Error(`Invalid Product Core DNA:\n${errs}`);
        }
        coreRaw = raw;
    }
    // ── Resolve API DNA reference (sibling product.api alongside product.ui) ────
    const apiRef = cell.adapter.config?.api_dna;
    const apiFetchPath = apiRef ? `/dna/${apiRef}.json` : undefined;
    const apiBase = cell.adapter.config?.api_base ?? '';
    const vendorComponents = cell.adapter.config?.vendorComponents ?? true;
    // ── Resolve Operational DNA reference (explicit or sibling convention) ──────
    // Rules live in operational.json and drive the flag-aware render + click
    // guards. Prefer an explicit `operational_dna` config key; otherwise fall
    // back to the convention that each domain has a sibling `operational.json`
    // next to its `product.ui.json` (e.g. `lending/operational`).
    let operationalRef = cell.adapter.config?.operational_dna;
    if (!operationalRef) {
        const domainPrefix = cell.dna.includes('/') ? cell.dna.split('/').slice(0, -1).join('/') : '';
        const candidate = domainPrefix ? `${domainPrefix}/operational` : 'operational';
        if (fs.existsSync(path.resolve(dnaBase, `${candidate}.json`))) {
            operationalRef = candidate;
        }
    }
    const operationalFetchPath = operationalRef ? `/dna/${operationalRef}.json` : undefined;
    // ── Build cell context ──────────────────────────────────────────────────────
    const ctx = {
        uiFetchPath: `/dna/${cell.dna}.json`,
        apiFetchPath,
        coreFetchPath: coreRef ? `/dna/${coreRef}.json` : undefined,
        operationalFetchPath,
        apiBase,
        dnaSourceDir: dnaBase,
        vendorComponents,
        adapterConfig: cell.adapter.config,
    };
    // ── Resolve adapter and generate ────────────────────────────────────────────
    const adapter = resolveAdapter(cell.adapter.type);
    fs.mkdirSync(path.resolve(outputDir), { recursive: true });
    adapter.generate(uiDnaRaw, path.resolve(outputDir), coreRaw, ctx);
    console.log(`✓ Generated ${cellName} → ${outputDir}`);
}
//# sourceMappingURL=run.js.map