export type ProductCoreDNA = unknown;
export interface DbConstructConfig {
    engine: string;
    version?: string;
    instance_class?: string;
    port?: number;
}
export interface DbAdapterConfig {
    construct: string;
    database: string;
    app_role?: string;
    app_password?: string;
    port?: number;
}
export interface DbCellAdapter {
    generate(core: ProductCoreDNA, adapterConfig: DbAdapterConfig, constructConfig: DbConstructConfig, outputDir: string): void;
}
//# sourceMappingURL=types.d.ts.map