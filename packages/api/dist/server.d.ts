/**
 * Apollo Server v5 + Express HTTP integration.
 *
 * `createServer({ dna, dataStore })`:
 *   1. Builds the GraphQL schema from the DNA (validates DNA first).
 *   2. Calls `dataStore.migrate()` so the store backend is ready before
 *      requests arrive.
 *   3. Returns the composed Apollo server, an Express app with
 *      `/graphql` and `/healthz` mounted, and a `listen(port)` helper.
 *
 * The function NEVER instantiates a `DnaDataStore` directly — the caller
 * (CLI or a test harness) constructs the store and passes it in.
 */
import { ApolloServer } from '@apollo/server';
import { type Express } from 'express';
import type { GraphQLSchema } from 'graphql';
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
export interface CreateServerArgs {
    dna: OperationalDNA;
    dataStore: DnaDataStore;
    /** Skip DNA validation (tests with intentionally minimal fixtures). Default false. */
    skipDnaValidation?: boolean;
}
export interface CreatedServer {
    schema: GraphQLSchema;
    apolloServer: ApolloServer;
    expressApp: Express;
    listen(port: number): Promise<{
        close(): Promise<void>;
    }>;
}
export declare function createServer(args: CreateServerArgs): Promise<CreatedServer>;
//# sourceMappingURL=server.d.ts.map