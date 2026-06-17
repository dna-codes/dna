import type { DnaDataStore } from '@dna-codes/dna-core';
export interface ProcessFlowStep {
    id: string;
    name: string;
    description?: string;
    /** The position responsible for this step (via `assigned_to`), if any. */
    assignee?: string;
}
export interface ProcessFlowProcess {
    id: string;
    name: string;
    description?: string;
    /** Steps in execution order, following the `next_step` chain. */
    steps: ProcessFlowStep[];
}
export interface ProcessFlowViewModel {
    lens: 'process-flow';
    processes: ProcessFlowProcess[];
}
/**
 * Process-flow lens — how each `process` flows through its `step`s. Steps belong
 * to a process (`belongs_to`), are ordered by `next_step`, and name the position
 * that owns them (`assigned_to`). Read-only.
 */
export declare function buildProcessFlow(store: DnaDataStore): Promise<ProcessFlowViewModel>;
//# sourceMappingURL=process-flow.d.ts.map