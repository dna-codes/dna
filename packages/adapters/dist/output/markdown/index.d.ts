import { DnaInput } from './types';
export type Section = 'summary' | 'domain-model' | 'operations' | 'sops' | 'process-flow' | 'product-ui';
export declare const DEFAULT_SECTIONS: readonly Section[];
export interface RenderOptions {
    /** Which sections to include, in the given order. Defaults to DEFAULT_SECTIONS. */
    sections?: readonly Section[];
    /** Document title. Defaults to the operational domain's `path` or `name`. */
    title?: string;
    /** Starting heading level for the document title (1 or 2). Section headings nest below. */
    headingLevel?: 1 | 2;
    /**
     * Rename canonical primitive labels (typically the plural collection name) for
     * company-friendly output. The DNA schema vocabulary stays canonical
     * (Resource/Person/Role/Group/Process) — only the rendered text changes.
     *
     * @example { Persons: 'Individuals', Roles: 'Positions' }
     */
    rename?: Record<string, string>;
}
export declare function render(dna: DnaInput, options?: RenderOptions): string;
export * from './types';
//# sourceMappingURL=index.d.ts.map