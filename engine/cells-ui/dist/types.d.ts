export interface Field {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    values?: string[];
}
export interface Block {
    name: string;
    type: 'form' | 'table' | 'detail' | 'actions' | 'empty-state' | string;
    description?: string;
    operation?: string;
    fields?: Field[];
    rowLink?: string;
}
export interface Page {
    name: string;
    resource: string;
    description?: string;
    blocks: Block[];
}
export interface Layout {
    name: string;
    type: 'sidebar' | 'full-width' | string;
    description?: string;
}
export interface Route {
    path: string;
    page: string;
    description?: string;
}
export interface ProductUiDNA {
    layout: Layout;
    pages: Page[];
    routes: Route[];
}
export interface Attribute {
    name: string;
    type: string;
    required?: boolean;
    values?: string[];
    description?: string;
}
/**
 * Product Core noun primitive (a Resource flattened from operational DNA).
 * Renamed from `Noun` with the operational rewrite — same wire shape.
 */
export interface Resource {
    name: string;
    description?: string;
    attributes?: Attribute[];
    examples?: Record<string, unknown>[];
}
export interface Domain {
    name: string;
    path: string;
    description?: string;
}
export interface ProductCoreDNA {
    domain: Domain;
    resources?: Resource[];
}
export interface ApiEndpoint {
    method: string;
    path: string;
    operation: string;
    description?: string;
    params?: {
        name: string;
        in: string;
        type: string;
        required?: boolean;
    }[];
    request?: {
        name: string;
        fields: {
            name: string;
            type: string;
            required?: boolean;
        }[];
    };
    response?: {
        name: string;
        fields: {
            name: string;
            type: string;
        }[];
    };
}
export interface ApiResource {
    name: string;
    noun: string;
    actions: {
        name: string;
        verb?: string;
        description?: string;
    }[];
}
export interface ProductApiDNA {
    namespace: {
        name: string;
        path: string;
    };
    resources: ApiResource[];
    endpoints: ApiEndpoint[];
}
export interface UiCellContext {
    uiFetchPath: string;
    apiFetchPath?: string;
    coreFetchPath?: string;
    operationalFetchPath?: string;
    apiBase?: string;
    dnaSourceDir: string;
    vendorComponents?: boolean;
    adapterConfig?: Record<string, unknown>;
}
export interface UiCellAdapter {
    generate(ui: ProductUiDNA, outputDir: string, core?: ProductCoreDNA, ctx?: UiCellContext): void;
}
//# sourceMappingURL=types.d.ts.map