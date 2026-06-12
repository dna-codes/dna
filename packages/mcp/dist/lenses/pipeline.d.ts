import type { DnaDataStore } from '@dna-codes/dna-core';
export interface PipelineOpportunity {
    id: string;
    name: string;
    account: string | null;
    assignedTo: string | null;
    deal: string | null;
    status: 'open' | 'closed';
}
export interface PipelineViewModel {
    lens: 'pipeline';
    open: PipelineOpportunity[];
    closed: PipelineOpportunity[];
}
export declare function buildPipeline(store: DnaDataStore): Promise<PipelineViewModel>;
//# sourceMappingURL=pipeline.d.ts.map