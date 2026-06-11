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
exports.runDevelop = runDevelop;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const context_1 = require("./context");
const args_1 = require("./args");
const output_1 = require("./output");
const help_1 = require("./help");
const product_core_1 = require("./product-core");
/**
 * Resolve the workspace package that provides a given adapter.type.
 * Convention: adapter-type prefix identifies the cell package.
 */
function workspaceForAdapter(adapterType) {
    if (adapterType.startsWith('node/'))
        return '@dna-codes/cells-api';
    if (adapterType.startsWith('ruby/'))
        return '@dna-codes/cells-api';
    if (adapterType.startsWith('python/'))
        return '@dna-codes/cells-api';
    if (adapterType === 'postgres')
        return '@dna-codes/cells-db';
    if (adapterType.startsWith('vite/') || adapterType.startsWith('next/'))
        return '@dna-codes/cells-ui';
    return undefined;
}
/**
 * Output directory convention: output/<domain>/<env>/<cell-suffix>/
 * where cell-suffix = cell.name with "-cell" suffix stripped.
 *   api-cell         → output/<domain>/<env>/api
 *   api-cell-nestjs  → output/<domain>/<env>/api-nestjs
 *   db-cell          → output/<domain>/<env>/db
 *   ui-cell          → output/<domain>/<env>/ui
 *
 * Env-scoping lets dev and prod generate independently — e.g. dev api-cell
 * can be built against SQLite + RabbitMQ while prod is Postgres + EventBridge.
 */
function outputDirFor(cellName, domain, root, environment) {
    const suffix = cellName.replace(/-cell/g, '').replace(/^-|-$/g, '');
    return path.join(root, 'output', domain, environment, suffix);
}
/**
 * Resolve the environment from --env or fall back to the first one declared
 * in technical.json. Mirrors `cba views`' fallback so `cba develop` and
 * `cba views` land on the same default when invoked without --env.
 */
function resolveEnvironment(paths, envArg) {
    if (envArg)
        return envArg;
    const technical = (0, context_1.loadLayer)(paths, 'technical');
    const envs = (technical.environments ?? []);
    return envs[0]?.name ?? 'dev';
}
/**
 * Apply the same `environment` overlay rule as `buildPlan`: entries with a
 * matching `environment` field override entries with no `environment` field.
 * Kept local to develop.ts so this command doesn't depend on deliver/plan.ts,
 * which would drag the deploy-adapter graph in.
 */
function overlayByEnv(items, environment) {
    const byName = new Map();
    for (const item of items) {
        if (item.environment && item.environment !== environment)
            continue;
        const existing = byName.get(item.name);
        if (!existing || (item.environment && !existing.environment)) {
            byName.set(item.name, item);
        }
    }
    return Array.from(byName.values());
}
/**
 * Materialize an env-resolved technical.json for the cell generators to read.
 *
 * Cell generators are spawned as child processes and find their cell by name
 * via `technical.cells.find(c => c.name === cellName)`. With env-scoped
 * duplicates in source technical.json, that lookup would find the first entry
 * (the default) and miss the env-specific override. Rather than teach every
 * generator about overlays, we resolve once here and hand them a flat copy.
 *
 * Written inside the env's output dir so it's discoverable when debugging a
 * generator run — "what exact config was the api-cell built with?" answers
 * with one file read.
 */
function writeResolvedTechnical(sourcePath, domain, environment, root) {
    const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const resolved = {
        ...raw,
        cells: overlayByEnv(raw.cells ?? [], environment),
        constructs: overlayByEnv(raw.constructs ?? [], environment),
        variables: overlayByEnv(raw.variables ?? [], environment),
        scripts: overlayByEnv(raw.scripts ?? [], environment),
    };
    const envDir = path.join(root, 'output', domain, environment);
    fs.mkdirSync(envDir, { recursive: true });
    const outPath = path.join(envDir, 'technical.resolved.json');
    fs.writeFileSync(outPath, JSON.stringify(resolved, null, 2) + '\n', 'utf-8');
    return outPath;
}
function planCells(domain, environment, cellFilter) {
    const paths = (0, context_1.resolveDomain)(domain);
    const resolvedTechnical = writeResolvedTechnical(paths.files.technical, domain, environment, paths.root);
    const technical = JSON.parse(fs.readFileSync(resolvedTechnical, 'utf-8'));
    const cells = technical.cells ?? [];
    const plans = cells
        .filter((c) => !cellFilter || c.name === cellFilter)
        .map((cell) => {
        const workspace = workspaceForAdapter(cell.adapter.type);
        if (!workspace) {
            throw new Error(`No cba workspace registered for adapter type "${cell.adapter.type}" (cell: ${cell.name})`);
        }
        return {
            name: cell.name,
            adapter: cell.adapter.type,
            workspace,
            outputDir: outputDirFor(cell.name, domain, paths.root, environment),
            technicalPath: resolvedTechnical,
        };
    });
    return { plans, paths, resolvedTechnical };
}
function runDevelop(argv, args) {
    const json = (0, args_1.boolFlag)(args, 'json');
    const opts = { json };
    if ((0, args_1.boolFlag)(args, 'help')) {
        console.log(help_1.DEVELOP_HELP);
        return;
    }
    const [domain] = argv;
    if (!domain) {
        (0, output_1.emitError)('Usage: cba develop <domain> [--env <environment>] [--cell <name>] [--dry-run]', opts);
        process.exit(1);
    }
    const cellFilter = (0, args_1.flag)(args, 'cell');
    const dryRun = (0, args_1.boolFlag)(args, 'dry-run');
    const envArg = (0, args_1.flag)(args, 'env');
    let plans;
    let paths;
    let environment;
    try {
        const paths0 = (0, context_1.resolveDomain)(domain);
        environment = resolveEnvironment(paths0, envArg);
        ({ plans, paths } = planCells(domain, environment, cellFilter));
    }
    catch (err) {
        (0, output_1.emitError)(err.message, opts);
        process.exit(1);
    }
    if (plans.length === 0) {
        (0, output_1.emitError)(cellFilter
            ? `Cell "${cellFilter}" not found in technical DNA of ${domain}`
            : `No cells declared in technical DNA of ${domain}`, opts);
        process.exit(1);
    }
    if (dryRun) {
        (0, output_1.emit)({ domain, environment, dryRun: true, plans }, opts, () => {
            const lines = [`cba develop ${domain} --env ${environment} — dry run (${plans.length} cell(s))`];
            for (const p of plans) {
                lines.push(``, `  ${p.name}  (${p.adapter})`);
                lines.push(`    workspace : ${p.workspace}`);
                lines.push(`    output    : ${path.relative(process.cwd(), p.outputDir)}`);
            }
            return lines.join('\n');
        });
        return;
    }
    // Materialize product.core.json before invoking any cell generators.
    // Cells read product core in place of operational DNA — it must be fresh.
    try {
        (0, product_core_1.materializeAndSaveProductCore)(paths);
        if (!json)
            console.log(`→ materialized ${path.relative(process.cwd(), paths.files['product.core'])}`);
    }
    catch (err) {
        (0, output_1.emitError)(`Failed to materialize product.core.json: ${err.message}`, opts);
        process.exit(1);
    }
    // Execute each cell's generator. CBA_DNA_BASE tells the generator where to
    // find referenced DNA files — the resolved technical.json we pass lives
    // under output/, so the generator's own `dna/` ancestor-walk wouldn't find
    // the source tree.
    const dnaRoot = findDnaRoot(paths.files.technical);
    const results = [];
    for (const p of plans) {
        if (!json)
            console.log(`→ ${p.name} (${p.adapter}) → ${path.relative(process.cwd(), p.outputDir)}`);
        const cwd = workspaceDir(p.workspace);
        const result = (0, child_process_1.spawnSync)('npx', [
            'ts-node',
            '-r',
            'tsconfig-paths/register',
            'src/index.ts',
            p.technicalPath,
            p.name,
            p.outputDir,
        ], {
            cwd,
            stdio: json ? 'pipe' : 'inherit',
            env: { ...process.env, CBA_DNA_BASE: dnaRoot },
        });
        if (result.error) {
            // ENOENT on cwd is the most common shape — surface the cwd so the user
            // doesn't have to dig into source to see what path was attempted.
            const detail = result.error.code === 'ENOENT' ? ` (cwd: ${cwd})` : '';
            const message = `Failed to spawn cell generator for "${p.name}": ${result.error.message}${detail}`;
            results.push({ cell: p.name, ok: false, code: 1, error: result.error.message });
            if (json) {
                (0, output_1.emitError)(message, opts, { results });
            }
            else {
                console.error(`✗ ${message}`);
            }
            process.exit(1);
        }
        results.push({ cell: p.name, ok: result.status === 0, code: result.status ?? 1 });
        if (result.status !== 0) {
            if (json) {
                (0, output_1.emitError)(`Cell "${p.name}" generation failed`, opts, { results });
            }
            else {
                console.error(`✗ Cell "${p.name}" generation failed`);
            }
            process.exit(1);
        }
    }
    (0, output_1.emitOk)({ domain, results }, opts, () => `✓ Generated ${results.length} cell(s) for ${domain}`);
}
/**
 * Resolve the cell-based-architecture workspace root from cba's own install
 * location, not from the consumer's cwd. When cba is installed via a `file:`
 * dep, npm symlinks `consumer/node_modules/@dna-codes/cells → cba-workspace/packages/cba`;
 * `realpathSync` follows that link back to the actual workspace so the join
 * below points at real `packages/` and `technical/cells/` siblings.
 *
 * In-workspace behavior is identical: `realpathSync` is a no-op when the
 * package isn't reached through a symlink.
 */
function cbaWorkspaceRoot() {
    const pkgPath = require.resolve('@dna-codes/cells/package.json');
    const realPkgPath = fs.realpathSync(pkgPath);
    return path.resolve(path.dirname(realPkgPath), '..', '..');
}
/**
 * Workspace package name → relative directory path.
 *
 * After the `rebrand-to-cells-prefix` change, package names live under the
 * `@dna-codes/*` scope but on-disk directory names didn't change (the
 * proposal explicitly kept the workspace layout — only names moved).
 * That divergence means we can't derive the directory from the name with
 * a string transform; an explicit map is the simplest stable answer.
 */
const WORKSPACE_DIRS = {
    '@dna-codes/cells': 'packages/cba',
    '@dna-codes/cells-viz': 'packages/cba-viz',
    '@dna-codes/cells-api': 'technical/cells/api-cell',
    '@dna-codes/cells-ui': 'technical/cells/ui-cell',
    '@dna-codes/cells-db': 'technical/cells/db-cell',
};
function workspaceDir(workspace) {
    const root = cbaWorkspaceRoot();
    const sub = WORKSPACE_DIRS[workspace];
    if (!sub)
        throw new Error(`Unknown cba workspace: ${workspace}`);
    return path.join(root, sub);
}
/**
 * Walk up from a source technical.json path to find the `dna/` ancestor
 * directory. Mirrors the logic in each cell generator's `findDnaBase`, but
 * runs against the source path (not the resolved one under output/), so
 * it's guaranteed to hit the real source tree.
 */
function findDnaRoot(sourceTechnicalPath) {
    let dir = path.dirname(path.resolve(sourceTechnicalPath));
    const root = path.parse(dir).root;
    while (dir !== root) {
        if (path.basename(dir) === 'dna')
            return dir;
        dir = path.dirname(dir);
    }
    throw new Error(`No "dna" ancestor directory found for ${sourceTechnicalPath}`);
}
//# sourceMappingURL=develop.js.map