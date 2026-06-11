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
/**
 * Flag-aware render + click guard tests.
 *
 * Verifies that each ui-cell adapter (vite/react, vite/vue, next/react):
 *   - emits a flags-context module with a FlagProvider / provideFlags seam
 *   - emits a rules module with evaluateRule + missingFlagsForEntry helpers
 *   - copies operational.json into public/dna/ alongside the other DNA files
 *   - wires operational + rule.allow[].flags into the ActionsBlock guard path
 *   - injects the flag source into the scaffold entry point
 */
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const react_1 = require("./adapters/vite/react");
const vue_1 = require("./adapters/vite/vue");
const react_2 = require("./adapters/next/react");
// ── Fixtures ─────────────────────────────────────────────────────────────────
const minimalUi = {
    layout: { name: 'FlagTest', type: 'sidebar' },
    pages: [{ name: 'LoansPage', resource: 'loans', blocks: [] }],
    routes: [{ path: '/loans', page: 'LoansPage' }],
};
const minimalCore = {
    domain: { name: 'demo', path: 'demo' },
    resources: [],
};
// Sibling operational.json with a mix of rules — including one that uses the
// new flags field — to drive the generator's copy + wire path end-to-end.
const operational = {
    operations: [
        { resource: 'Loan', action: 'Approve', name: 'Loan.Approve' },
        { resource: 'Loan', action: 'Reject', name: 'Loan.Reject' },
    ],
    rules: [
        {
            operation: 'Loan.Approve',
            type: 'access',
            allow: [
                { role: 'underwriter', flags: ['new_approval_flow'] },
                { role: 'senior_underwriter' },
            ],
        },
        {
            operation: 'Loan.Reject',
            type: 'access',
            allow: [{ role: 'underwriter' }],
        },
    ],
};
function withDnaDir(fn) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-cell-flag-'));
    const dnaDir = path.join(root, 'dna', 'demo');
    fs.mkdirSync(dnaDir, { recursive: true });
    fs.writeFileSync(path.join(dnaDir, 'product.ui.json'), JSON.stringify(minimalUi));
    fs.writeFileSync(path.join(dnaDir, 'product.core.json'), JSON.stringify(minimalCore));
    fs.writeFileSync(path.join(dnaDir, 'operational.json'), JSON.stringify(operational));
    const ctx = {
        uiFetchPath: '/dna/demo/product.ui.json',
        coreFetchPath: '/dna/demo/product.core.json',
        operationalFetchPath: '/dna/demo/operational.json',
        apiBase: 'http://localhost:3000',
        dnaSourceDir: path.join(root, 'dna'),
        vendorComponents: false,
    };
    try {
        fn(dnaDir, ctx);
    }
    finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}
function withOutputDir(fn) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-cell-flag-out-'));
    try {
        fn(dir);
    }
    finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
const ADAPTERS = [
    {
        name: 'vite/react',
        generate: react_1.generate,
        flagsContextRelPath: 'src/renderer/flags-context.tsx',
        rulesRelPath: 'src/renderer/rules.ts',
        actionButtonRelPath: 'src/renderer/blocks/ActionsBlock.tsx',
        scaffoldEntryRelPath: 'src/renderer/App.tsx',
    },
    {
        name: 'vite/vue',
        generate: vue_1.generate,
        flagsContextRelPath: 'src/renderer/flags-context.ts',
        rulesRelPath: 'src/renderer/rules.ts',
        actionButtonRelPath: 'src/renderer/blocks/ActionButton.vue',
        scaffoldEntryRelPath: 'src/renderer/App.vue',
    },
    {
        name: 'next/react',
        generate: react_2.generate,
        flagsContextRelPath: 'src/renderer/flags-context.tsx',
        rulesRelPath: 'src/renderer/rules.ts',
        actionButtonRelPath: 'src/renderer/blocks/ActionsBlock.tsx',
        scaffoldEntryRelPath: 'src/renderer/DnaProvider.tsx',
    },
];
describe.each(ADAPTERS)('flag-aware guards — $name', adapter => {
    test('emits a flags-context module', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const file = path.join(outputDir, adapter.flagsContextRelPath);
                expect(fs.existsSync(file)).toBe(true);
                const contents = fs.readFileSync(file, 'utf-8');
                // Provider seam — React: FlagProvider; Vue: provideFlags
                expect(contents).toMatch(/FlagProvider|provideFlags/);
                // Hook seam for render-time guards
                expect(contents).toContain('useFlags');
                // Module-level snapshot for click-time guards
                expect(contents).toContain('readFlagSnapshotSync');
                // Fail-closed default
                expect(contents).toMatch(/EMPTY|{}/);
                // Default endpoint
                expect(contents).toContain('/api/flags');
            });
        });
    });
    test('emits a rules module with evaluateRule + missingFlagsForEntry', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const file = path.join(outputDir, adapter.rulesRelPath);
                expect(fs.existsSync(file)).toBe(true);
                const contents = fs.readFileSync(file, 'utf-8');
                expect(contents).toContain('evaluateRule');
                expect(contents).toContain('missingFlagsForEntry');
                expect(contents).toContain('findAccessRule');
                // Undefined rule → allowed (API is authoritative)
                expect(contents).toMatch(/if \(!rule\) return true/);
                // Empty allow → blocked
                expect(contents).toMatch(/allow\.length === 0/);
            });
        });
    });
    test('copies operational.json into public/dna/ alongside the other DNA files', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const copied = path.join(outputDir, 'public/dna/demo/operational.json');
                expect(fs.existsSync(copied)).toBe(true);
                const parsed = JSON.parse(fs.readFileSync(copied, 'utf-8'));
                // Flag survived the copy — the generator doesn't mangle the DNA.
                const approve = parsed.rules.find((r) => r.operation === 'Loan.Approve' && r.type === 'access');
                expect(approve).toBeDefined();
                expect(approve.allow[0].flags).toEqual(['new_approval_flow']);
            });
        });
    });
    test('config.json points at the operational fetch path', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const config = JSON.parse(fs.readFileSync(path.join(outputDir, 'public/config.json'), 'utf-8'));
                expect(config.operational).toBe('/dna/demo/operational.json');
            });
        });
    });
    test('ActionsBlock wires the flag + rule evaluator into the render-time guard', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const contents = fs.readFileSync(path.join(outputDir, adapter.actionButtonRelPath), 'utf-8');
                // Imports the flag hook + rule evaluator
                expect(contents).toContain('useFlags');
                expect(contents).toContain('findAccessRule');
                expect(contents).toContain('evaluateRule');
                expect(contents).toContain('missingFlagsForEntry');
                // Disable-with-tooltip path for flag-only failures
                expect(contents).toContain('blockedByFlagOnly');
                expect(contents).toMatch(/Requires feature/);
                // Click-time fast-path re-read of the live snapshot
                expect(contents).toContain('readFlagSnapshotSync');
            });
        });
    });
    test('scaffold entry wires the flag provider', () => {
        withDnaDir((_dnaDir, ctx) => {
            withOutputDir(outputDir => {
                adapter.generate(minimalUi, outputDir, minimalCore, ctx);
                const contents = fs.readFileSync(path.join(outputDir, adapter.scaffoldEntryRelPath), 'utf-8');
                // React adapters wrap with <FlagProvider>; Vue calls provideFlags().
                expect(contents).toMatch(/FlagProvider|provideFlags/);
            });
        });
    });
});
//# sourceMappingURL=flag-guards.test.js.map