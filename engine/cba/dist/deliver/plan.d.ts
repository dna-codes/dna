import { DomainPaths } from '../context';
export interface ResolvedConstruct {
    name: string;
    label?: string;
    category: string;
    type: string;
    provider: string;
    config?: Record<string, any>;
    environment?: string;
    description?: string;
}
export interface ResolvedVariable {
    name: string;
    source: 'literal' | 'secret' | 'env' | 'output';
    value?: string;
    required?: boolean;
    environment?: string;
}
export interface ResolvedCell {
    name: string;
    label?: string;
    description?: string;
    dna?: string;
    adapterType: string;
    adapterConfig?: Record<string, any>;
    constructs: string[];
    variables: ResolvedVariable[];
    outputs: Array<{
        name: string;
        cell: string;
        value: string;
    }>;
    outputDir: string;
}
export interface ResolvedProvider {
    name: string;
    type: string;
    region?: string;
    description?: string;
    config?: Record<string, any>;
}
export interface ResolvedScript {
    name: string;
    equation: string;
    construct: string;
    runtime: string;
    handler: string;
    environment?: string;
}
export interface EnvironmentPlan {
    domain: string;
    environment: string;
    paths: DomainPaths;
    constructs: ResolvedConstruct[];
    cells: ResolvedCell[];
    variables: ResolvedVariable[];
    providers: ResolvedProvider[];
    scripts: ResolvedScript[];
    deployDir: string;
}
/**
 * Build a delivery plan for a given domain + environment.
 *
 * Environment overlay rule: entries with matching `environment` field override
 * entries with no `environment` field (the default). This applies to Cells,
 * Constructs, Variables, and Scripts.
 *
 * Output layout is env-scoped: every generated cell and the deploy dir live
 * under `output/<domain>/<env>/`, so dev and prod artifacts coexist without
 * clobbering each other (dev can compile against SQLite + RabbitMQ while
 * prod uses Postgres + EventBridge, etc.).
 */
export declare function buildPlan(domain: string, environment: string): EnvironmentPlan;
/**
 * Verify that every cell in the plan has been developed (output dir exists
 * with a canonical artifact). Returns a list of missing cells.
 *
 * Canonical artifact per adapter family:
 *   node/*, vite/*, next/*  → package.json (node project)
 *   postgres                 → docker-compose.yml (infra-only, no node deps)
 */
export declare function checkArtifacts(plan: EnvironmentPlan): string[];
/**
 * Look up a named profile from the technical DNA's `profiles` map.
 * Returns the cell name list, or null if the profile doesn't exist.
 */
export declare function resolveProfile(domain: string, profileName: string): string[] | null;
