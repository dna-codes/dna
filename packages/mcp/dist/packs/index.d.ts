import type { ResourceTypeInput, RelationshipTypeInput } from '@dna-codes/dna-core';
export type PackName = 'operational' | 'crm' | 'hr';
export interface PackDefinition {
    name: PackName;
    label: string;
    description: string;
    resourceTypes: ResourceTypeInput[];
    relationshipTypes: RelationshipTypeInput[];
}
export declare const PACKS: Record<PackName, PackDefinition>;
export declare const DEFAULT_PACK: PackName;
//# sourceMappingURL=index.d.ts.map