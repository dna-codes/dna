import type { DnaDataStore } from '@dna-codes/dna-core';
export interface JobDescResponsibility {
    title: string;
    description?: string;
}
export interface JobDescEntry {
    positionId: string;
    role: string;
    description?: string;
    holder?: string;
    department?: string;
    reportsTo?: string;
    responsibilities: JobDescResponsibility[];
}
export interface JobDescriptionsViewModel {
    lens: 'job-descriptions';
    groupName: string;
    entries: JobDescEntry[];
}
export declare function buildJobDescriptions(store: DnaDataStore): Promise<JobDescriptionsViewModel>;
//# sourceMappingURL=job-descriptions.d.ts.map