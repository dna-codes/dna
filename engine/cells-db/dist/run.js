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
const postgresAdapter = __importStar(require("./adapters/postgres"));
const ADAPTERS = {
    postgres: postgresAdapter,
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
    // ── Resolve DNA base directory (the `dna/` ancestor of technical.json) ────
    const dnaBase = findDnaBase(technicalPath);
    // ── Load and validate Product Core DNA ─────────────────────────────────────
    const coreRaw = loadDna(dnaBase, cell.dna);
    const coreValidation = validator.validate(coreRaw, 'product/core');
    if (!coreValidation.valid) {
        const errs = coreValidation.errors.map(e => `  ${e.instancePath} ${e.message}`).join('\n');
        throw new Error(`Invalid Product Core DNA:\n${errs}`);
    }
    // ── Resolve construct config ───────────────────────────────────────────────
    const adapterConfig = (cell.adapter.config ?? {});
    const constructName = adapterConfig.construct;
    const construct = (technicalRaw.constructs ?? []).find(c => c.name === constructName && c.type === 'database' && !c.environment);
    const constructConfig = construct?.config ?? {
        engine: 'postgres',
        version: '16',
    };
    // ── Resolve adapter and generate ────────────────────────────────────────────
    const adapter = resolveAdapter(cell.adapter.type);
    fs.mkdirSync(path.resolve(outputDir), { recursive: true });
    adapter.generate(coreRaw, adapterConfig, constructConfig, path.resolve(outputDir));
    console.log(`✓ Generated ${cellName} → ${outputDir}`);
}
//# sourceMappingURL=run.js.map