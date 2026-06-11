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
exports.runProduct = runProduct;
const path = __importStar(require("path"));
const args_1 = require("./args");
const design_1 = require("./design");
const help_1 = require("./help");
const output_1 = require("./output");
const context_1 = require("./context");
const product_core_1 = require("./product-core");
function runProduct(argv, args) {
    if ((0, args_1.boolFlag)(args, 'help') || argv.length === 0) {
        console.log(help_1.PRODUCT_HELP);
        return;
    }
    const [sublayer, ...rest] = argv;
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if (sublayer === 'core') {
        runCore(rest, args, opts);
        return;
    }
    if (sublayer !== 'api' && sublayer !== 'ui') {
        (0, output_1.emitError)(`Unknown product layer: "${sublayer}". Valid: core, api, ui`, opts);
        process.exit(1);
    }
    const layer = sublayer === 'api' ? 'product.api' : 'product.ui';
    (0, design_1.runLayerCommand)(layer, rest, args);
}
/**
 * cba product core materialize <domain>
 *   Reads operational.json + product.api.json + product.ui.json for the domain
 *   and writes the materialized product.core.json. Called automatically by
 *   cba develop; this is the manual trigger.
 */
function runCore(argv, _args, opts) {
    const [sub, domain] = argv;
    if (sub !== 'materialize' || !domain) {
        (0, output_1.emitError)('Usage: cba product core materialize <domain>', opts);
        process.exit(1);
    }
    let paths;
    try {
        paths = (0, context_1.resolveDomain)(domain);
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    try {
        const core = (0, product_core_1.materializeAndSaveProductCore)(paths);
        (0, output_1.emitOk)({
            domain,
            file: paths.files['product.core'],
            resources: core.resources?.length ?? 0,
            operations: core.operations?.length ?? 0,
            triggers: core.triggers?.length ?? 0,
        }, opts, () => `✓ materialized ${path.relative(process.cwd(), paths.files['product.core'])} — ${core.resources?.length ?? 0} resource(s), ${core.operations?.length ?? 0} operation(s), ${core.triggers?.length ?? 0} trigger(s)`);
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
}
//# sourceMappingURL=product.js.map