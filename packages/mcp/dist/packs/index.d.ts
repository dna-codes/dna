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
/**
 * Render a pack's real type definitions as a structured prompt block. This is
 * the single source of truth for the agent's pack vocabulary — it reads the
 * same `PackDefinition` used to seed the store, so the prompt can never drift
 * from what is registered. Resource types render as `name · category — desc`;
 * relationship types as `name · from→to · cardinality — desc`, mirroring the
 * shape of the reference example documents.
 */
export declare function renderPackForPrompt(packName: PackName): string;
//# sourceMappingURL=index.d.ts.map