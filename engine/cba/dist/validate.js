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
exports.runValidate = runValidate;
const fs = __importStar(require("fs"));
const dna_core_1 = require("@dna-codes/dna-core");
const context_1 = require("./context");
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
const SCHEMA_IDS = {
    operational: 'operational',
    'product.core': 'product/core',
    'product.api': 'product/api',
    'product.ui': 'product/ui',
    technical: 'technical',
};
function runValidate(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.VALIDATE_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba validate <domain> [--layer <layer>]', opts);
        process.exit(1);
    }
    const layerFilter = (0, args_1.flag)(args, 'layer');
    if (layerFilter && !context_1.LAYERS.includes(layerFilter)) {
        (0, output_1.emitError)(`Unknown layer: "${layerFilter}". Valid: ${context_1.LAYERS.join(', ')}`, opts);
        process.exit(1);
    }
    const targetLayers = layerFilter ? [layerFilter] : context_1.LAYERS;
    let paths;
    try {
        paths = (0, context_1.resolveDomain)(domain);
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    const validator = new dna_core_1.DnaValidator();
    const results = [];
    for (const layer of targetLayers) {
        // product.core is optional — it is a derived artifact; skip if absent
        if (layer === 'product.core' && !fs.existsSync(paths.files['product.core'])) {
            continue;
        }
        const doc = (0, context_1.loadLayer)(paths, layer);
        const r = validator.validate(doc, SCHEMA_IDS[layer]);
        results.push({
            layer,
            valid: r.valid,
            errors: r.errors.map((e) => ({ path: e.instancePath || '/', message: e.message })),
        });
    }
    const allValid = results.every((r) => r.valid);
    // Cross-layer checks (lightweight)
    const crossLayerErrors = !layerFilter ? crossLayerValidate(paths) : [];
    const summary = {
        ok: allValid && crossLayerErrors.length === 0,
        domain,
        layers: results,
        crossLayerErrors,
    };
    if (opts.json) {
        console.log(JSON.stringify(summary, null, 2));
    }
    else {
        for (const r of results) {
            if (r.valid) {
                console.log(`✓ ${r.layer}`);
            }
            else {
                console.error(`✗ ${r.layer}`);
                for (const e of r.errors)
                    console.error(`    ${e.path} ${e.message}`);
            }
        }
        if (crossLayerErrors.length > 0) {
            console.error(`✗ cross-layer`);
            for (const e of crossLayerErrors)
                console.error(`    ${e.message}`);
        }
        else if (!layerFilter) {
            console.log(`✓ cross-layer`);
        }
    }
    if (!summary.ok)
        process.exit(1);
}
function crossLayerValidate(paths) {
    let operational, productCore, productApi, productUi, technical;
    try {
        operational = (0, context_1.loadLayer)(paths, 'operational');
    }
    catch {
        return [];
    }
    if (fs.existsSync(paths.files['product.core'])) {
        try {
            productCore = (0, context_1.loadLayer)(paths, 'product.core');
        }
        catch {
            /* optional */
        }
    }
    try {
        productApi = (0, context_1.loadLayer)(paths, 'product.api');
    }
    catch {
        /* optional */
    }
    try {
        productUi = (0, context_1.loadLayer)(paths, 'product.ui');
    }
    catch {
        /* optional */
    }
    try {
        technical = (0, context_1.loadLayer)(paths, 'technical');
    }
    catch {
        /* optional */
    }
    const validator = new dna_core_1.DnaValidator();
    const result = validator.validateCrossLayer({ operational, productCore, productApi, productUi, technical });
    return result.errors.map((e) => ({ message: `[${e.layer}] ${e.path}: ${e.message}` }));
}
//# sourceMappingURL=validate.js.map