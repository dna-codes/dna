import type { DnaDataStore } from '@dna-codes/dna-core';
export interface ReportingChainsViewModel {
    lens: 'reporting-chains';
    chains: string[][];
}
export declare function buildReportingChains(store: DnaDataStore): Promise<ReportingChainsViewModel>;
//# sourceMappingURL=reporting-chains.d.ts.map