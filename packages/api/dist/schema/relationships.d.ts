/**
 * `RelationshipType` records → GraphQL expansion fields codegen.
 *
 * For each `RelationshipType` record (typically from
 * `dataStore.relationshipType.list()`), the codegen adds an expansion
 * field on the `from` ResourceType's GraphQL type. Cardinality drives
 * single-vs-list (many-to-one/one-to-one → single; the others → list).
 *
 * The field name is derived from the relationship's `attribute` field
 * (trailing `_id` stripped, camelCased). The resolver factory is wired
 * by the schema composer in `./index.ts`.
 */
import { type GraphQLFieldConfig, type GraphQLOutputType } from 'graphql';
import type { RelationshipType } from '@dna-codes/dna-core';
import type { ResourceTypeBundle } from './types';
export interface RelationshipFieldInfo {
    fromType: string;
    toType: string;
    fieldName: string;
    relationshipName: string;
    cardinality: RelationshipType['cardinality'];
    isList: boolean;
}
export interface RelationshipFieldBuilder {
    fromType: string;
    fieldName: string;
    fieldType: GraphQLOutputType;
    info: RelationshipFieldInfo;
}
/**
 * Compute relationship-field metadata from live `RelationshipType` records.
 * Returns one entry per `RelationshipType` whose `from` AND `to` types both
 * exist in the bundle.
 */
export declare function planRelationshipFields(relationshipTypes: RelationshipType[], bundle: ResourceTypeBundle): RelationshipFieldBuilder[];
export declare function buildRelationshipFieldConfigs(builders: RelationshipFieldBuilder[], resolverFor: (info: RelationshipFieldInfo) => GraphQLFieldConfig<unknown, unknown>['resolve']): Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>;
export declare function extendObjectFields(bundle: ResourceTypeBundle, additions: Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>): void;
//# sourceMappingURL=relationships.d.ts.map