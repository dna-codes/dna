/**
 * DNA `Relationship` primitive → GraphQL expansion fields.
 *
 * Reference attributes (`attribute.type === 'reference'`) already produce
 * scalar `ID` fields in `./types.ts` — those stay. This module ADDS the
 * expansion field on the `from` type for every entry in
 * `dna.relationships[]`:
 *
 *   - Cardinality `many-to-one` / `one-to-one` → single nullable field
 *     (`borrower: Borrower`).
 *   - Cardinality `one-to-many` / `many-to-many` → nullable list of
 *     non-null elements (`borrowers: [Borrower!]`).
 *
 * The field name is the relationship's `attribute` field with any
 * trailing `_id`/`Id`/`ID` stripped, then camelCased. The resolver wires
 * via `./resolvers/relationships.ts` (passes a closure over the data
 * store) when the schema is composed in `./index.ts`.
 */
import { type GraphQLFieldConfig, type GraphQLOutputType } from 'graphql';
import type { OperationalDNA } from '@dna-codes/dna-core';
import type { DnaRelationship } from './dna-shapes';
import type { ResourceTypeBundle } from './types';
/**
 * Metadata captured for each Relationship the codegen registered. The
 * resolver factory in `./resolvers/relationships.ts` reads this to know
 * which store call to issue and how to shape the result.
 */
export interface RelationshipFieldInfo {
    /** The `from` type name (Resource that holds the expansion field). */
    fromType: string;
    /** The `to` type name (target of the expansion). */
    toType: string;
    /** The GraphQL field name on `fromType` (e.g. `borrower` for `Loan.borrower_id`). */
    fieldName: string;
    /** The store's link `role` to filter on (the relationship's `name`). */
    relationshipName: string;
    /** Cardinality, drives single-vs-list. */
    cardinality: DnaRelationship['cardinality'];
    /** True for list-valued fields (one-to-many, many-to-many). */
    isList: boolean;
}
export interface RelationshipFieldBuilder {
    fromType: string;
    fieldName: string;
    fieldType: GraphQLOutputType;
    info: RelationshipFieldInfo;
}
/**
 * Compute the relationship-field metadata. Returns one entry per
 * `dna.relationships[]` whose `from` AND `to` types both exist in the
 * bundle. Orphan relationships (dangling references) are silently
 * skipped — same policy as the merge / validator layers.
 *
 * The actual field installation requires resolvers (which the schema
 * composer wires); this function only returns the descriptors.
 */
export declare function planRelationshipFields(dna: OperationalDNA, bundle: ResourceTypeBundle): RelationshipFieldBuilder[];
/**
 * Build the field configs to install on the corresponding object types.
 * The schema composer feeds these back into `extendObjectFields` (a
 * thunk-friendly merger) so the resolvers can be wired alongside.
 *
 * `resolverFor` is the dependency the composer injects; it returns the
 * GraphQL resolver for a given `RelationshipFieldInfo`. Keeping this
 * dependency-injected means this module owns no I/O and stays unit-
 * testable without the data store.
 */
export declare function buildRelationshipFieldConfigs(builders: RelationshipFieldBuilder[], resolverFor: (info: RelationshipFieldInfo) => GraphQLFieldConfig<unknown, unknown>['resolve']): Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>;
/**
 * The thunked-fields API on `GraphQLObjectType` means you can't naively
 * mutate `.fields` after construction. We re-wrap each affected type's
 * field thunk to include the new relationship fields, returning a fresh
 * map of types the schema composer should substitute.
 *
 * This is intentionally a non-destructive operation — callers receive a
 * new Map and decide whether to swap the originals.
 */
export declare function extendObjectFields(bundle: ResourceTypeBundle, additions: Map<string, Record<string, GraphQLFieldConfig<unknown, unknown>>>): void;
//# sourceMappingURL=relationships.d.ts.map