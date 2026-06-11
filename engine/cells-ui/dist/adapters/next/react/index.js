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
exports.generate = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const docker_1 = require("../docker");
const scaffold_1 = require("./generators/scaffold");
const renderer_1 = require("./generators/renderer");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
const generate = (ui, outputDir, _core, ctx) => {
    const appName = ui.layout.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '-ui';
    // ── config.json — tells the renderer where to fetch DNA at runtime ───────────
    write(outputDir, 'public/config.json', JSON.stringify({
        ui: ctx?.uiFetchPath ?? '/dna.json',
        api: ctx?.apiFetchPath ?? null,
        core: ctx?.coreFetchPath ?? null,
        operational: ctx?.operationalFetchPath ?? null,
        apiBase: ctx?.apiBase ?? '',
    }, null, 2) + '\n');
    // ── Copy DNA files into public/dna/ so they ship with the Next.js build ─────
    if (ctx) {
        const fetchPaths = [ctx.uiFetchPath, ctx.apiFetchPath, ctx.coreFetchPath, ctx.operationalFetchPath].filter((p) => typeof p === 'string' && p.startsWith('/dna/'));
        for (const fetchPath of fetchPaths) {
            const rel = fetchPath.replace(/^\/dna\//, '');
            const src = path.join(ctx.dnaSourceDir, rel);
            if (fs.existsSync(src)) {
                const dest = path.join(outputDir, 'public/dna', rel);
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                fs.copyFileSync(src, dest);
            }
        }
    }
    // ── Scaffold ────────────────────────────────────────────────────────────────
    write(outputDir, 'package.json', (0, scaffold_1.generatePackageJson)(appName));
    write(outputDir, 'tsconfig.json', (0, scaffold_1.generateTsConfig)());
    write(outputDir, 'next.config.js', (0, scaffold_1.generateNextConfig)(ctx?.apiBase));
    // ── App Router pages ───────────────────────────────────────────────────────
    write(outputDir, 'src/app/layout.tsx', (0, renderer_1.rendererRootLayout)());
    write(outputDir, 'src/app/(app)/layout.tsx', (0, renderer_1.rendererAppLayout)());
    write(outputDir, 'src/app/(app)/page.tsx', (0, renderer_1.rendererAppPage)());
    write(outputDir, 'src/app/(app)/[...slug]/page.tsx', (0, renderer_1.rendererCatchAllPage)());
    // ── Renderer — fetches DNA at runtime, no DNA bundled in the build ──────────
    write(outputDir, 'src/renderer/types.ts', (0, renderer_1.rendererTypes)());
    write(outputDir, 'src/renderer/context.ts', (0, renderer_1.rendererContext)());
    write(outputDir, 'src/renderer/flags-context.tsx', (0, renderer_1.rendererFlagsContext)());
    write(outputDir, 'src/renderer/rules.ts', (0, renderer_1.rendererRules)());
    write(outputDir, 'src/renderer/dna-loader.ts', (0, renderer_1.rendererDnaLoader)());
    write(outputDir, 'src/renderer/useApi.ts', (0, renderer_1.rendererApiHook)());
    write(outputDir, 'src/renderer/DnaProvider.tsx', (0, renderer_1.rendererDnaProvider)());
    write(outputDir, 'src/renderer/Layout.tsx', (0, renderer_1.rendererLayout)());
    write(outputDir, 'src/renderer/Page.tsx', (0, renderer_1.rendererPage)());
    write(outputDir, 'src/renderer/Block.tsx', (0, renderer_1.rendererBlock)());
    write(outputDir, 'src/renderer/blocks/FormBlock.tsx', (0, renderer_1.rendererFormBlock)());
    write(outputDir, 'src/renderer/blocks/TableBlock.tsx', (0, renderer_1.rendererTableBlock)());
    write(outputDir, 'src/renderer/blocks/DetailBlock.tsx', (0, renderer_1.rendererDetailBlock)());
    write(outputDir, 'src/renderer/blocks/ActionsBlock.tsx', (0, renderer_1.rendererActionsBlock)());
    write(outputDir, 'src/renderer/blocks/EmptyStateBlock.tsx', (0, renderer_1.rendererEmptyStateBlock)());
    // ── Containerization (Next.js standalone) ──────────────────────────────────
    write(outputDir, 'Dockerfile', (0, docker_1.generateDockerfile)());
    write(outputDir, '.dockerignore', (0, docker_1.generateDockerIgnore)());
};
exports.generate = generate;
//# sourceMappingURL=index.js.map