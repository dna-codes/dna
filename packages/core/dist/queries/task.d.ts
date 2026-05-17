import type { OperationalDNA } from '../types/merge';
import type { Task } from '../types/operational';
export declare function getTasks(dna: OperationalDNA): Task[];
export declare function getTask(dna: OperationalDNA, name: string): Task | null;
export declare function getTasksForOperation(dna: OperationalDNA, opName: string): Task[];
//# sourceMappingURL=task.d.ts.map