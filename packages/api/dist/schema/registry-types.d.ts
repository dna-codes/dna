/**
 * Fixed top-level GraphQL types for the registry-native admin API.
 *
 * These types are stable across schema regenerations — they don't depend
 * on which `ResourceType` records exist in the tenant's store. They are
 * the surface tenant admins use to mutate the type system itself.
 *
 * Types declared here:
 *   - `NounCategory` (enum: PERSON / ROLE / GROUP / RESOURCE)
 *   - `AttributeType` (enum: STRING / TEXT / NUMBER / BOOLEAN / DATE / DATETIME / ENUM / REFERENCE)
 *   - `AttributeSchemaEntry` (object, used in both ResourceType and input shapes)
 *   - `ResourceType`, `ResourceTypeVersion` (read+write)
 *   - `RelationshipType`, `RelationshipTypeVersion` (read+write)
 *   - Inputs for each create / update mutation
 */
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
/**
 * Stability enum, derived from the core `STABILITIES` array so the GraphQL
 * surface and the core `Stability` union cannot drift. Members are the
 * upper-cased value names (e.g. `experimental` → `EXPERIMENTAL`).
 */
export declare const StabilityEnum: GraphQLEnumType;
export declare const NounCategoryEnum: GraphQLEnumType;
export declare const AttributeTypeEnum: GraphQLEnumType;
export declare const CardinalityEnum: GraphQLEnumType;
export declare const AttributeSchemaEntryType: GraphQLObjectType<any, any>;
export declare const AttributeSchemaEntryInput: GraphQLInputObjectType;
export declare const ResourceTypeVersionType: GraphQLObjectType;
export declare const RelationshipTypeVersionType: GraphQLObjectType;
/**
 * `ResourceType` and `RelationshipType` types are constructed via a
 * factory because their `versions: [...]` field is resolved through the
 * data store, which is wired by the schema composer.
 */
export declare function buildResourceTypeOutputType(versionsResolver: (parent: {
    id: string;
}) => Promise<unknown[]>): GraphQLObjectType;
export declare function buildRelationshipTypeOutputType(versionsResolver: (parent: {
    id: string;
}) => Promise<unknown[]>): GraphQLObjectType;
export declare const ResourceTypeInputObject: GraphQLInputObjectType;
export declare const ResourceTypeUpdateInput: GraphQLInputObjectType;
export declare const RelationshipTypeInputObject: GraphQLInputObjectType;
export declare const RelationshipTypeUpdateInput: GraphQLInputObjectType;
//# sourceMappingURL=registry-types.d.ts.map