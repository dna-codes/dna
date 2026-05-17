import type { OperationalDNA } from '../types/merge';
import type { Rule } from '../types/operational';
export declare function getRules(dna: OperationalDNA): Rule[];
export declare function getRule(dna: OperationalDNA, name: string): Rule | null;
export declare function getRulesForOperation(dna: OperationalDNA, opName: string): Rule[];
//# sourceMappingURL=rule.d.ts.map