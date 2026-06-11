import { UiCellAdapter } from '../../types';
export type AstroFlavor = 'marketing' | 'starlight';
export interface AstroAdapterConfig {
    flavor?: AstroFlavor;
    /**
     * Path to an OpenAPI document emitted by `@dna-codes/output-openapi`.
     * Resolved relative to the cell's outputDir. Only the `starlight` flavor
     * consumes this — the `starlight-openapi` plugin renders an API reference
     * section from it.
     */
    openapiPath?: string;
    /**
     * Marketing flavor only — site title shown in the header. Defaults to the
     * Layout's name from product.ui.json.
     */
    siteTitle?: string;
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
export declare const generate: UiCellAdapter['generate'];
/** Convert "About Us" → "about-us" for use as a content entry slug. */
declare function pageSlug(name: string): string;
/**
 * Map a DNA route path to an Astro file path.
 *   "/"           → "index.astro"
 *   "/about"      → "about.astro"
 *   "/loans/:id"  → "loans/[id].astro"
 */
declare function routeToAstroFilename(routePath: string): string;
declare function blockComponentName(block: {
    name: string;
}): string;
export { pageSlug, routeToAstroFilename, blockComponentName };
//# sourceMappingURL=index.d.ts.map