import { Layout, Page, Route, Block } from '../../../types';
import { AstroFlavor, AstroAdapterConfig } from '..';
/**
 * package.json — common deps + flavor-specific additions. Marketing ships
 * astro alone; Starlight adds the integration + the openapi plugin (we
 * always include the plugin so cell config can flip openapiPath without
 * regenerating; the integration is a no-op when no path is wired).
 */
export declare function generatePackageJson(appName: string, flavor: AstroFlavor): string;
export declare function generateTsConfig(): string;
/**
 * astro.config.mjs — flavor-aware:
 *   - marketing: bare Astro config
 *   - starlight: registers the Starlight integration + (optionally) the
 *     starlight-openapi plugin pointing at the OpenAPI document supplied
 *     via cell config
 */
export declare function generateAstroConfig(flavor: AstroFlavor, config: AstroAdapterConfig, sidebar?: string): string;
export declare function generateGitignore(): string;
/**
 * Marketing layout — wraps every page. `<slot />` is Astro's children API.
 * Pulls the layout type from DNA so a `full-width` layout doesn't render the
 * sidebar nav, and `sidebar` does.
 */
export declare function generateLayout(siteTitle: string, layout: Layout): string;
/**
 * Page — imports each block component, then renders them in DNA order.
 * Static-only; no client JS. The page receives the route's path metadata
 * via Astro frontmatter so client-side enhancement can layer on later.
 */
export declare function generatePage(page: Page, route: Route): string;
/**
 * Block component — block.type drives the rendered markup. For v1 we render
 * each block as a static section; interactivity (form submission, table
 * sorting, etc.) is delegated to a later iteration that adds Astro Islands
 * + client-side hydration as needed.
 */
export declare function generateBlockComponent(block: Block): string;
/**
 * Starlight content config — the Starlight integration consumes the docs
 * collection at src/content/docs/. We define it explicitly so the Markdown
 * entries we emit pick up the right schema.
 */
export declare function generateStarlightContentConfig(): string;
/**
 * Starlight content entry — one Markdown file per Page. Each block in the
 * page becomes a section with its description + (where applicable) a small
 * field list, so the docs page mirrors what the marketing flavor renders
 * without dragging in custom Astro components.
 */
export declare function generateStarlightContentEntry(page: Page): string;
/**
 * Starlight sidebar literal — emitted into astro.config.mjs as a JS array
 * literal. We list manual sidebar entries for the Pages and append the
 * `openAPISidebarGroups` from starlight-openapi when an OpenAPI document
 * is wired in.
 */
export declare function generateStarlightSidebar(pages: Page[]): string;
//# sourceMappingURL=scaffold.d.ts.map