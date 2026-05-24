/**
 * `ResourceType` records → GraphQL types codegen.
 *
 * Given an array of live `ResourceType` records (typically from
 * `dataStore.resourceType.list()`), produces one `GraphQLObjectType` per
 * ResourceType, each carrying `id: ID!`, `_schemaVersion: Int!`, plus one
 * field per declared `AttributeSchemaEntry` (with the attribute-type
 * mapping table documented in design.md D1).
 *
 * Reference attributes (`type === 'reference'`) are surfaced as scalar
 * `ID` fields here. The expansion field (e.g. `borrower: Borrower`) is
 * added by `./relationships.ts` based on declared `RelationshipType`
 * records — not from the reference attribute alone.
 */
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLList, GraphQLObjectType } from 'graphql';
import type { NounCategory, ResourceType } from '@dna-codes/dna-core';
export interface ResourceTypeBundle {
    registry: Map<string, GraphQLObjectType>;
    categories: Map<string, NounCategory>;
    inputRegistry: Map<string, GraphQLInputObjectType>;
    enumRegistry: Map<string, GraphQLEnumType>;
}
/**
 * Build per-ResourceType GraphQL output and input types. Returns mutable
 * registries; `./relationships.ts` and `./crud.ts` consume them.
 */
export declare function buildResourceTypes(resourceTypes: ResourceType[]): ResourceTypeBundle;
export { GraphQLList };
//# sourceMappingURL=types.d.ts.map