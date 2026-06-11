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
exports.runDeliver = runDeliver;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const args_1 = require("../args");
const output_1 = require("../output");
const help_1 = require("../help");
const plan_1 = require("./plan");
const docker_compose_1 = require("./adapters/docker-compose");
const terraform_aws_1 = require("./adapters/terraform-aws");
const DEFAULT_ADAPTER = 'docker-compose';
const SUPPORTED_ADAPTERS = ['docker-compose', 'terraform/aws'];
function runDeliver(argv, args) {
    const opts = { json: (0, args_1.boolFlag)(args, 'json') };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.DEPLOY_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba deploy <domain> --env <environment> [--adapter <name>] [--plan]', opts);
        process.exit(1);
    }
    const environment = (0, args_1.flag)(args, 'env');
    if (!environment) {
        (0, output_1.emitError)('Missing required flag --env <environment>', opts);
        process.exit(1);
    }
    const adapter = (0, args_1.flag)(args, 'adapter') ?? DEFAULT_ADAPTER;
    if (!SUPPORTED_ADAPTERS.includes(adapter)) {
        (0, output_1.emitError)(`Unsupported delivery adapter "${adapter}". Supported: ${SUPPORTED_ADAPTERS.join(', ')}`, opts);
        process.exit(1);
    }
    const cellsFlag = (0, args_1.flag)(args, 'cells');
    const profileFlag = (0, args_1.flag)(args, 'profile');
    if (cellsFlag && profileFlag) {
        (0, output_1.emitError)('Cannot use both --cells and --profile. Pick one.', opts);
        process.exit(1);
    }
    const planOnly = (0, args_1.boolFlag)(args, 'plan');
    // Internal: suppress the "Next: cd … && docker compose up -d" hint when
    // runDeliver is invoked from `cba up`, which will launch immediately after.
    const suppressNextHint = (0, args_1.boolFlag)(args, 'no-next-hint');
    let plan;
    try {
        plan = (0, plan_1.buildPlan)(domain, environment);
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    // Filter cells by --cells or --profile
    if (cellsFlag || profileFlag) {
        let selectedCells;
        if (cellsFlag) {
            selectedCells = cellsFlag.split(',').map((c) => c.trim());
        }
        else {
            const resolved = (0, plan_1.resolveProfile)(domain, profileFlag);
            if (!resolved) {
                (0, output_1.emitError)(`Profile "${profileFlag}" not found in technical DNA. Use \`cba technical show ${domain} --type Profile\` to list available profiles.`, opts);
                process.exit(1);
            }
            selectedCells = resolved;
        }
        const allCellNames = plan.cells.map((c) => c.name);
        const unknown = selectedCells.filter((c) => !allCellNames.includes(c));
        if (unknown.length) {
            (0, output_1.emitError)(`Unknown cell(s): ${unknown.join(', ')}. Available: ${allCellNames.join(', ')}`, opts);
            process.exit(1);
        }
        plan.cells = plan.cells.filter((c) => selectedCells.includes(c.name));
    }
    // Verify cell artifacts exist (fail loudly — don't auto-develop)
    const missing = (0, plan_1.checkArtifacts)(plan);
    if (missing.length) {
        (0, output_1.emitError)(`Missing generated artifacts for cells: ${missing.join(', ')}. Run \`cba develop ${domain}\` first.`, opts, { missing });
        process.exit(1);
    }
    if (adapter === 'docker-compose') {
        const result = (0, docker_compose_1.generateDockerCompose)(plan);
        if (planOnly) {
            (0, output_1.emit)({
                domain,
                environment,
                adapter,
                deployDir: plan.deployDir,
                services: result.services,
                skipped: result.skipped,
                files: result.files.map((f) => path.relative(process.cwd(), f.path)),
            }, opts, () => {
                const lines = [
                    `cba deploy ${domain} --env ${environment} --adapter ${adapter} — plan`,
                    ``,
                    `  deploy dir : ${path.relative(process.cwd(), plan.deployDir)}`,
                    `  services   : ${result.services.length}`,
                    ...result.services.map((s) => `    · ${s}`),
                ];
                if (result.skipped.length) {
                    lines.push(``, `  skipped    : ${result.skipped.length}`);
                    for (const s of result.skipped) {
                        lines.push(`    · ${s.name} (${s.kind}) — ${s.reason}`);
                    }
                }
                return lines.join('\n');
            });
            return;
        }
        // Write files
        fs.mkdirSync(plan.deployDir, { recursive: true });
        for (const file of result.files) {
            fs.mkdirSync(path.dirname(file.path), { recursive: true });
            fs.writeFileSync(file.path, file.content, 'utf-8');
        }
        (0, output_1.emitOk)({
            domain,
            environment,
            adapter,
            deployDir: plan.deployDir,
            services: result.services,
            skipped: result.skipped,
            files: result.files.map((f) => path.relative(process.cwd(), f.path)),
        }, opts, () => {
            const lines = [
                `✓ Deployed ${domain}/${environment} → ${path.relative(process.cwd(), plan.deployDir)}`,
                ``,
                `  ${result.services.length} service(s): ${result.services.join(', ')}`,
            ];
            if (result.skipped.length) {
                lines.push(`  ${result.skipped.length} skipped construct(s)`);
            }
            if (!suppressNextHint) {
                lines.push(``, `  Next: cd ${path.relative(process.cwd(), plan.deployDir)} && docker compose up -d`);
            }
            return lines.join('\n');
        });
    }
    if (adapter === 'terraform/aws') {
        const result = (0, terraform_aws_1.generateTerraformAws)(plan);
        if (planOnly) {
            (0, output_1.emit)({
                domain,
                environment,
                adapter,
                deployDir: plan.deployDir,
                resources: result.resources,
                skipped: result.skipped,
                files: result.files.map((f) => path.relative(process.cwd(), f.path)),
            }, opts, () => {
                const lines = [
                    `cba deploy ${domain} --env ${environment} --adapter ${adapter} — plan`,
                    ``,
                    `  deploy dir : ${path.relative(process.cwd(), plan.deployDir)}`,
                    `  resources  : ${result.resources.length}`,
                    ...result.resources.map((r) => `    · ${r}`),
                ];
                if (result.skipped.length) {
                    lines.push(``, `  skipped    : ${result.skipped.length}`);
                    for (const s of result.skipped) {
                        lines.push(`    · ${s.name} (${s.kind}) — ${s.reason}`);
                    }
                }
                return lines.join('\n');
            });
            return;
        }
        // Write files
        fs.mkdirSync(plan.deployDir, { recursive: true });
        for (const file of result.files) {
            fs.mkdirSync(path.dirname(file.path), { recursive: true });
            fs.writeFileSync(file.path, file.content, 'utf-8');
        }
        (0, output_1.emitOk)({
            domain,
            environment,
            adapter,
            deployDir: plan.deployDir,
            resources: result.resources,
            skipped: result.skipped,
            files: result.files.map((f) => path.relative(process.cwd(), f.path)),
        }, opts, () => {
            const lines = [
                `✓ Deployed ${domain}/${environment} → ${path.relative(process.cwd(), plan.deployDir)}`,
                ``,
                `  ${result.resources.length} resource(s): ${result.resources.join(', ')}`,
            ];
            if (result.skipped.length) {
                lines.push(`  ${result.skipped.length} skipped construct(s)`);
            }
            if (!suppressNextHint) {
                lines.push(``, `  Next: cd ${path.relative(process.cwd(), plan.deployDir)} && terraform init && terraform plan`);
            }
            return lines.join('\n');
        });
    }
}
//# sourceMappingURL=index.js.map