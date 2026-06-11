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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const CLI = path.join(REPO_ROOT, 'engine/cba/src/index.ts');
function cba(args) {
    const result = (0, child_process_1.spawnSync)('npx', ['ts-node', CLI, ...args], { cwd: REPO_ROOT, encoding: 'utf-8' });
    return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        code: result.status ?? -1,
    };
}
describe('cba agent', () => {
    jest.setTimeout(30000);
    it('lists every AGENTS.md contract', () => {
        const r = cba(['agent', 'list']);
        expect(r.code).toBe(0);
        expect(r.stdout).toContain('operational');
        expect(r.stdout).toContain('product');
        expect(r.stdout).toContain('technical');
        expect(r.stdout).toContain('cell:api-cell');
        expect(r.stdout).toContain('cell:ui-cell');
        expect(r.stdout).toContain('cell:db-cell');
        expect(r.stdout).toContain('dna');
        // No per-domain AGENTS.md — dna/AGENTS.md is the meta-agent
        expect(r.stdout).not.toContain('domain:');
    });
    it('resolves dna-core to the package-level AGENTS.md', () => {
        // @dna-codes/dna-core ships an AGENTS.md (the dispatcher across the three
        // layer docs). After `align-cba-internal-dna-codes-deps`, cba resolves it
        // from the sibling `dna/packages/core/` rather than a registry copy.
        const r = cba(['agent', 'dna-core']);
        expect(r.code).toBe(0);
        expect(r.stdout).toContain('AGENTS.md: dna-core');
    });
    it('resolves layer shorthand', () => {
        const r = cba(['agent', 'operational']);
        expect(r.code).toBe(0);
        expect(r.stdout).toContain('AGENTS.md: operational');
        expect(r.stdout).toContain('Operational Layer Agents');
    });
    it('resolves cell shorthand', () => {
        const r = cba(['agent', 'api-cell']);
        expect(r.code).toBe(0);
        expect(r.stdout).toContain('cell:api-cell');
        expect(r.stdout).toContain('api-cell Agent');
    });
    it('resolves the top-level dna meta-agent', () => {
        const r = cba(['agent', 'dna']);
        expect(r.code).toBe(0);
        expect(r.stdout).toContain('AGENTS.md: dna');
        expect(r.stdout).toContain('file:  dna/AGENTS.md');
    });
    it('errors on unknown concern', () => {
        const r = cba(['agent', 'nope']);
        expect(r.code).toBe(1);
        expect(r.stderr).toContain('No AGENTS.md found');
    });
    it('emits JSON when --json is set', () => {
        const r = cba(['agent', 'operational', '--json']);
        expect(r.code).toBe(0);
        const parsed = JSON.parse(r.stdout);
        expect(parsed.concern).toBe('operational');
        // Layer docs ship inside @dna-codes/dna-core. After
        // `align-cba-internal-dna-codes-deps`, cba resolves the package via a
        // file: dep that symlinks to the sibling `dna/packages/core/`, so the
        // reported path traces through the sibling — not through a registry
        // copy in node_modules. Either ending is acceptable as long as the file
        // resolves and has content; the regression marker is the suffix.
        expect(parsed.file).toMatch(/docs\/operational\.md$/);
        expect(parsed.file).not.toMatch(/node_modules\/@dna-codes\/core\/docs\/operational\.md$/);
        expect(typeof parsed.content).toBe('string');
        expect(parsed.content.length).toBeGreaterThan(100);
    });
});
//# sourceMappingURL=agent.test.js.map