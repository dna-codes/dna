/**
 * DNA `Operation` primitive → GraphQL mutation codegen.
 *
 * Each entry in `dna.operations[]` becomes a mutation:
 *
 *     loanApply(id: ID!, input: LoanInput!): Loan!
 *
 * In v1, Operation resolvers behave like `updateLoan` — they forward to
 * `store.instance.update(target, id, input)` and re-read the record.
 * The DNA `Operation.changes[]` semantics (state-machine enforcement)
 * are part of Rule enforcement and are deferred.
 *
 * When an Operation's generated mutation name collides with a generic
 * CRUD mutation name, the Operation wins (design.md D3): the collision
 * is reported to the schema composer via `crudMutationsToOmit` so the
 * CRUD entry is dropped before final schema assembly.
 */
import { type GraphQLFieldConfig, type GraphQLFieldResolver } from 'graphql';
import type { OperationalDNA } from '@dna-codes/dna-core';
import type { ResourceTypeBundle } from './types';
export interface OperationResolverFactory {
    forTarget(targetType: string): GraphQLFieldResolver<unknown, unknown>;
}
export interface OperationsBundle {
    mutations: Record<string, GraphQLFieldConfig<unknown, unknown>>;
    /** CRUD mutation names that should be omitted in favor of an Operation-mutation collision. */
    crudMutationsToOmit: Set<string>;
}
export declare function buildOperationMutations(dna: OperationalDNA, bundle: ResourceTypeBundle, resolverFactory: OperationResolverFactory, crudMutationNames: Set<string>): OperationsBundle;
//# sourceMappingURL=operations.d.ts.map