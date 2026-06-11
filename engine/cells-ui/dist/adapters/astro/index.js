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
exports.pageSlug = pageSlug;
exports.routeToAstroFilename = routeToAstroFilename;
exports.blockComponentName = blockComponentName;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scaffold_1 = require("./generators/scaffold");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
/**
 * Astro ui-cell adapter. Two flavors share one adapter:
 *
 *   - `marketing` (default): plain Astro SSG. Each DNA `Page` becomes a
 *     `src/pages/*.astro` file; the `Layout` becomes a single `src/layouts/`
 *     component that wraps every page; `Block` definitions become inert
 *     `src/components/Block*.astro` partials. Output is static HTML;
 *     terraform-aws delivers via S3 + CloudFront (same path the vite
 *     adapters use — no new delivery work).
 *
 *   - `starlight`: Astro + Starlight (docs UI). Each DNA `Page` becomes a
 *     Markdown content entry under `src/content/docs/`; sidebar order is
 *     derived from the Page list. When `openapiPath` is provided in cell
 *     config, the `starlight-openapi` plugin is wired to render an API
 *     reference section sourced from that file (the output of
 *     `@dna-codes/output-openapi`).
 *
 * Both flavors emit static-buildable projects (`npm run build` produces
 * `dist/`); both reuse the existing static-site delivery path.
 */
const generate = (ui, outputDir, _core, ctx) => {
    // Pull adapter config off the context (the technical-DNA cell config flows
    // through ctx; for the astro adapter we expect `flavor` + optional
    // `openapiPath`).
    const config = (ctx?.adapterConfig ?? {});
    const flavor = config.flavor ?? 'marketing';
    const appName = ui.layout.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') +
        (flavor === 'starlight' ? '-docs' : '-ui');
    // ── Shared scaffold ─────────────────────────────────────────────────────────
    write(outputDir, 'package.json', (0, scaffold_1.generatePackageJson)(appName, flavor));
    write(outputDir, 'tsconfig.json', (0, scaffold_1.generateTsConfig)());
    write(outputDir, 'astro.config.mjs', (0, scaffold_1.generateAstroConfig)(flavor, config));
    write(outputDir, '.gitignore', (0, scaffold_1.generateGitignore)());
    if (flavor === 'starlight') {
        // Starlight emits Markdown content entries; the docs site itself comes
        // pre-built by Starlight, so we don't ship layout / page renderers.
        write(outputDir, 'src/content.config.ts', (0, scaffold_1.generateStarlightContentConfig)());
        // Sidebar order matches the Page list from product.ui.json.
        const sidebar = (0, scaffold_1.generateStarlightSidebar)(ui.pages);
        write(outputDir, 'astro.config.mjs', (0, scaffold_1.generateAstroConfig)(flavor, config, sidebar));
        for (const page of ui.pages) {
            const slug = pageSlug(page.name);
            write(outputDir, `src/content/docs/${slug}.md`, (0, scaffold_1.generateStarlightContentEntry)(page));
        }
        return;
    }
    // ── Marketing flavor ────────────────────────────────────────────────────────
    const siteTitle = config.siteTitle ?? ui.layout.name;
    // One Layout component shared by every page.
    write(outputDir, 'src/layouts/Site.astro', (0, scaffold_1.generateLayout)(siteTitle, ui.layout));
    // One Astro page per DNA Page. Routes from product.ui.json drive the file
    // path so the URL structure matches the Product UI DNA contract.
    for (const route of ui.routes) {
        const page = ui.pages.find((p) => p.name === route.page);
        if (!page)
            continue;
        const filename = routeToAstroFilename(route.path);
        write(outputDir, `src/pages/${filename}`, (0, scaffold_1.generatePage)(page, route));
    }
    // One component per unique block. Marketing pages render blocks as static
    // partials — no client JS by default. Interactivity can be added later via
    // Astro Islands when a block's type warrants it.
    const seenBlocks = new Set();
    for (const page of ui.pages) {
        for (const block of page.blocks ?? []) {
            const componentName = blockComponentName(block);
            if (seenBlocks.has(componentName))
                continue;
            seenBlocks.add(componentName);
            write(outputDir, `src/components/${componentName}.astro`, (0, scaffold_1.generateBlockComponent)(block));
        }
    }
};
exports.generate = generate;
/** Convert "About Us" → "about-us" for use as a content entry slug. */
function pageSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Map a DNA route path to an Astro file path.
 *   "/"           → "index.astro"
 *   "/about"      → "about.astro"
 *   "/loans/:id"  → "loans/[id].astro"
 */
function routeToAstroFilename(routePath) {
    if (routePath === '/' || routePath === '')
        return 'index.astro';
    const trimmed = routePath.replace(/^\//, '').replace(/\/$/, '');
    const parts = trimmed.split('/').map((seg) => seg.startsWith(':') ? `[${seg.slice(1)}]` : seg);
    return parts.join('/') + '.astro';
}
function blockComponentName(block) {
    const safe = block.name
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
    return `Block${safe || 'Generic'}`;
}
//# sourceMappingURL=index.js.map