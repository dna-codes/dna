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
exports.runUp = runUp;
const path = __importStar(require("path"));
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
const validate_1 = require("./validate");
const develop_1 = require("./develop");
const index_1 = require("./deliver/index");
const plan_1 = require("./deliver/plan");
const registry_1 = require("./deliver/registry");
const DEFAULT_ADAPTER = 'docker-compose';
/**
 * `cba up` — the full pipeline from DNA to running topology:
 *   validate → develop → deliver → adapter.launch
 *
 * Each step reuses the existing in-process command function; only the final
 * launch step shells out (to `docker compose` or `terraform`). If any step
 * fails it exits non-zero — the same behavior as running the commands by hand.
 */
function runUp(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.UP_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba up <domain> --env <environment> [--adapter <name>]', opts);
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
    const skipDevelop = (0, args_1.boolFlag)(args, 'skip-develop');
    const planOnly = (0, args_1.boolFlag)(args, 'plan');
    const seed = (0, args_1.boolFlag)(args, 'seed');
    const launchFlags = {
        attach: (0, args_1.boolFlag)(args, 'attach'),
        build: (0, args_1.boolFlag)(args, 'build'),
        forceRecreate: (0, args_1.boolFlag)(args, 'force-recreate'),
        autoApprove: (0, args_1.boolFlag)(args, 'auto-approve'),
    };
    // ── Step 1: validate ────────────────────────────────────────────────────────
    if (!opts.json)
        console.log(`→ validate ${domain}`);
    (0, validate_1.runValidate)([domain], { positional: [domain], flags: opts.json ? { json: true } : {} });
    // ── Step 2: develop ────────────────────────────────────────────────────────
    if (!skipDevelop) {
        if (!opts.json)
            console.log(`→ develop ${domain}`);
        const cellFilter = (0, args_1.flag)(args, 'cell');
        const developArgs = {
            positional: [domain],
            flags: {
                ...(cellFilter ? { cell: cellFilter } : {}),
                ...(opts.json ? { json: true } : {}),
            },
        };
        (0, develop_1.runDevelop)([domain], developArgs);
    }
    else if (!opts.json) {
        console.log(`→ develop (skipped)`);
    }
    // ── Step 3: deliver ────────────────────────────────────────────────────────
    if (!opts.json)
        console.log(`→ deploy ${domain} --env ${environment} --adapter ${adapterId}`);
    const deliverArgs = {
        positional: [domain],
        flags: {
            env: environment,
            adapter: adapterId,
            ...((0, args_1.flag)(args, 'cells') ? { cells: (0, args_1.flag)(args, 'cells') } : {}),
            ...((0, args_1.flag)(args, 'profile') ? { profile: (0, args_1.flag)(args, 'profile') } : {}),
            ...(opts.json ? { json: true } : {}),
            // Suppress the trailing "Next: cd … && docker compose up -d" hint —
            // `cba up` launches immediately after this step, so the hint is noise.
            'no-next-hint': true,
        },
    };
    (0, index_1.runDeliver)([domain], deliverArgs);
    // Resolve the deploy dir the same way deliver does — reuse buildPlan so the
    // path convention can't drift between deliver and up.
    const deployDirResolved = (0, plan_1.buildPlan)(domain, environment).deployDir;
    if (planOnly) {
        if (!opts.json) {
            console.log('');
            console.log(`→ plan only — topology written to ${path.relative(process.cwd(), deployDirResolved)}`);
            console.log(`  Drop --plan to launch the stack.`);
        }
        else {
            (0, output_1.emit)({ ok: true, domain, environment, adapter: adapterId, planOnly: true, deployDir: deployDirResolved }, opts, () => '');
        }
        return;
    }
    // ── Step 4: launch ──────────────────────────────────────────────────────────
    const launchCtx = {
        deployDir: deployDirResolved,
        env: seed ? { SEED_EXAMPLES: 'true' } : {},
        flags: launchFlags,
    };
    if (!opts.json) {
        const action = adapterId === 'docker-compose' ? 'docker compose up' : 'terraform apply';
        console.log(`→ launch (${action}) in ${path.relative(process.cwd(), deployDirResolved)}`);
    }
    (0, registry_1.launchWith)(adapterId, launchCtx)
        .then((code) => process.exit(code))
        .catch((err) => {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    });
}
//# sourceMappingURL=up.js.map