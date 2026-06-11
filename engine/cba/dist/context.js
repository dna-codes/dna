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
exports.LAYERS = void 0;
exports.findRepoRoot = findRepoRoot;
exports.resolveDomain = resolveDomain;
exports.loadLayer = loadLayer;
exports.saveLayer = saveLayer;
exports.listDomains = listDomains;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Resolve the repo root by walking up from cwd looking for a `dna/` directory
 * adjacent to a workspace `package.json`.
 */
function findRepoRoot(startDir = process.cwd()) {
    let dir = path.resolve(startDir);
    while (true) {
        const hasDna = fs.existsSync(path.join(dir, 'dna'));
        const hasPkg = fs.existsSync(path.join(dir, 'package.json'));
        if (hasDna && hasPkg)
            return dir;
        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error('Could not locate cell-based-architecture repo root (no `dna/` directory found walking up from cwd).');
        }
        dir = parent;
    }
}
exports.LAYERS = ['operational', 'product.core', 'product.api', 'product.ui', 'technical'];
function resolveDomain(domain, root = findRepoRoot()) {
    const dir = path.join(root, 'dna', domain);
    if (!fs.existsSync(dir)) {
        throw new Error(`Domain not found: ${domain} (expected at ${dir})`);
    }
    return {
        root,
        domain,
        dir,
        files: {
            operational: path.join(dir, 'operational.json'),
            'product.core': path.join(dir, 'product.core.json'),
            'product.api': path.join(dir, 'product.api.json'),
            'product.ui': path.join(dir, 'product.ui.json'),
            technical: path.join(dir, 'technical.json'),
        },
    };
}
function loadLayer(paths, layer) {
    const file = paths.files[layer];
    if (!fs.existsSync(file)) {
        throw new Error(`Layer file missing: ${file}`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function saveLayer(paths, layer, doc) {
    const file = paths.files[layer];
    fs.writeFileSync(file, JSON.stringify(doc, null, 2) + '\n', 'utf-8');
}
function listDomains(root = findRepoRoot()) {
    const dnaDir = path.join(root, 'dna');
    if (!fs.existsSync(dnaDir))
        return [];
    return fs
        .readdirSync(dnaDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
}
//# sourceMappingURL=context.js.map