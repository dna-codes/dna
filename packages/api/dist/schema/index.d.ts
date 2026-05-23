/**
 * Schema composition entry point.
 *
 * Builds a GraphQL schema from an `OperationalDNA` and an injected
 * `DnaDataStore`. The order of operations matters:
 *
 *   1. Validate DNA via `DnaValidator` (fails fast on malformed input).
 *   2. Build per-noun-primitive types + inputs + enums.
 *   3. Plan relationship fields, build their resolvers, and extend the
 *      object types in the registry with the expansion fields.
 *   4. Build CRUD queries + mutations with resolvers.
 *   5. Build Operation mutations; collisions resolve to the Operation.
 *   6. Assemble into a `GraphQLSchema` with `Query` + `Mutation`
 *      root types.
 */
import { GraphQLSchema } from 'graphql';
import { type DnaDataStore, type OperationalDNA } from '@dna-codes/dna-core';
export interface BuildSchemaArgs {
    dna: OperationalDNA;
    dataStore: DnaDataStore;
    /** Skip the up-front DNA validation. Tests use this when fixtures intentionally omit base-contract fields. Default false. */
    skipValidation?: boolean;
}
export declare function buildSchema({ dna, dataStore, skipValidation }: BuildSchemaArgs): GraphQLSchema;
//# sourceMappingURL=index.d.ts.map