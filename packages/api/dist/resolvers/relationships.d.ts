/**
 * Relationship-expansion resolvers.
 *
 * GraphQL field on `Loan.borrower` resolves via:
 *
 *   1. List Links from `(Loan, parent.id)` filtered by the relationship's
 *      `role` (the DNA `Relationship.name`).
 *   2. For each Link, look up the target Instance via
 *      `store.instance.get(toType, link.to.id)`.
 *   3. Return the resolved Instance(s). Single-cardinality returns the
 *      first match (or `null`); list-cardinality returns the array.
 */
import type { DnaDataStore } from '@dna-codes/dna-core';
import type { GraphQLFieldResolver } from 'graphql';
import type { RelationshipFieldInfo } from '../schema/relationships';
interface RelationshipResolverArgs {
    dataStore: DnaDataStore;
    info: RelationshipFieldInfo;
}
export declare function makeRelationshipResolver({ dataStore, info, }: RelationshipResolverArgs): GraphQLFieldResolver<unknown, unknown>;
export {};
//# sourceMappingURL=relationships.d.ts.map