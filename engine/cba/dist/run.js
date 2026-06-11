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
exports.runRun = runRun;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const context_1 = require("./context");
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
function resolveAdapter(domain, environment, adapter, root) {
    const envDir = path.join(root, 'output', domain, environment);
    const conventions = {
        express: {
            dir: path.join(envDir, 'api'),
            cmd: 'npx',
            args: ['ts-node', 'src/main.ts'],
        },
        nestjs: {
            dir: path.join(envDir, 'api-nestjs'),
            cmd: 'npx',
            args: ['ts-node', '-r', 'tsconfig-paths/register', 'src/main.ts'],
        },
        vite: {
            dir: path.join(envDir, 'ui'),
            cmd: 'npx',
            args: ['vite'],
        },
    };
    const spec = conventions[adapter];
    if (!spec) {
        throw new Error(`Unknown adapter "${adapter}". Known: ${Object.keys(conventions).join(', ')}`);
    }
    if (!fs.existsSync(spec.dir)) {
        throw new Error(`Generated output not found at ${spec.dir}. Run 'cba develop ${domain} --env ${environment}' first.`);
    }
    return spec;
}
function runRun(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.RUN_HELP);
        return;
    }
    const [domain] = argv;
    const adapter = (0, args_1.flag)(args, 'adapter');
    const envArg = (0, args_1.flag)(args, 'env');
    if (!domain || !adapter) {
        (0, output_1.emitError)('Usage: cba run <domain> --adapter <name> [--env <environment>]', opts);
        process.exit(1);
    }
    let spec;
    try {
        const paths = (0, context_1.resolveDomain)(domain);
        const technical = (0, context_1.loadLayer)(paths, 'technical');
        const envs = (technical.environments ?? []);
        const environment = envArg ?? envs[0]?.name ?? 'dev';
        spec = resolveAdapter(domain, environment, adapter, (0, context_1.findRepoRoot)());
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    console.log(`→ ${adapter}  cwd=${path.relative(process.cwd(), spec.dir)}`);
    const child = (0, child_process_1.spawn)(spec.cmd, spec.args, { cwd: spec.dir, stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
}
//# sourceMappingURL=run.js.map