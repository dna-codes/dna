import type { DnaDataStore } from '@dna-codes/dna-core';
export interface SpanEntry {
    id: string;
    name: string;
    directReports: number;
    totalReports: number;
}
export interface SpanOfControlViewModel {
    lens: 'span-of-control';
    positions: SpanEntry[];
}
export declare function buildSpanOfControl(store: DnaDataStore): Promise<SpanOfControlViewModel>;
//# sourceMappingURL=span-of-control.d.ts.map