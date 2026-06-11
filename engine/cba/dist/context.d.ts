/**
 * Resolve the repo root by walking up from cwd looking for a `dna/` directory
 * adjacent to a workspace `package.json`.
 */
export declare function findRepoRoot(startDir?: string): string;
export type Layer = 'operational' | 'product.core' | 'product.api' | 'product.ui' | 'technical';
export declare const LAYERS: Layer[];
export interface DomainPaths {
    root: string;
    domain: string;
    dir: string;
    files: Record<Layer, string>;
}
export declare function resolveDomain(domain: string, root?: string): DomainPaths;
export declare function loadLayer(paths: DomainPaths, layer: Layer): any;
export declare function saveLayer(paths: DomainPaths, layer: Layer, doc: any): void;
export declare function listDomains(root?: string): string[];
