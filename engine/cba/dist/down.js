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
exports.runDown = runDown;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
const plan_1 = require("./deliver/plan");
const registry_1 = require("./deliver/registry");
const DEFAULT_ADAPTER = 'docker-compose';
/**
 * `cba down` — tear down a deployed topology. No regen, no plan rewrite; just
 * invokes the delivery adapter's teardown hook against the existing deploy dir.
 *
 * docker-compose: `docker compose down -v` (or without -v if --keep-volumes)
 * terraform/aws : `terraform destroy` — requires --auto-approve (will destroy AWS resources)
 */
function runDown(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.DOWN_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba down <domain> --env <environment> [--adapter <name>]', opts);
        process.exit(1);
    }
    const environment = (0, args_1.flag)(args, 'env');
    if (!environment) {
        (0, output_1.emitError)('Missing required flag --env <environment>', opts);
        process.exit(1);
    }
    const adapterId = (0, args_1.flag)(args, 'adapter') ?? DEFAULT_ADAPTER;
    if (!(0, registry_1.isDeliveryAdapterId)(adapterId)) {
        (0, output_1.emitError)(`Unsupported delivery adapter "${adapterId}". Supported: ${registry_1.DELIVERY_ADAPTERS.join(', ')}`, opts);
        process.exit(1);
    }
    const flags = {
        keepVolumes: (0, args_1.boolFlag)(args, 'keep-volumes'),
        autoApprove: (0, args_1.boolFlag)(args, 'auto-approve'),
    };
    let deployDir;
    try {
        deployDir = (0, plan_1.buildPlan)(domain, environment).deployDir;
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    if (!fs.existsSync(deployDir)) {
        (0, output_1.emitError)(`No deploy dir at ${path.relative(process.cwd(), deployDir)}. Run \`cba up ${domain} --env ${environment}\` first.`, opts);
        process.exit(1);
    }
    if (!opts.json) {
        const action = adapterId === 'docker-compose' ? 'docker compose down' : 'terraform destroy';
        console.log(`→ teardown (${action}) in ${path.relative(process.cwd(), deployDir)}`);
    }
    const ctx = { deployDir, env: {}, flags };
    (0, registry_1.teardownWith)(adapterId, ctx)
        .then((code) => process.exit(code))
        .catch((err) => {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    });
}
//# sourceMappingURL=down.js.map