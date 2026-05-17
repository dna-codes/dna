import type { OperationalDNA } from '../types/merge';
import type { Process, Trigger } from '../types/operational';
export declare function getProcesses(dna: OperationalDNA): Process[];
export declare function getProcess(dna: OperationalDNA, name: string): Process | null;
export declare function getTriggersForProcess(dna: OperationalDNA, processName: string): Trigger[];
//# sourceMappingURL=process.d.ts.map