/**
 * Apollo Server v5 + Express HTTP integration for the registry-native API.
 *
 * `createServer({ dna, dataStore })`:
 *   1. Calls `dataStore.migrate()` (constraints/indexes only).
 *   2. Checks `dataStore.hasBeenSeeded()`. If false, calls
 *      `dataStore.seedFromDna(dna)` to populate the foundational
 *      `ResourceType` / `RelationshipType` records.
 *   3. Instantiates a `SchemaManager` whose builder reads from the store
 *      and calls `rebuild()` to populate the initial schema.
 *   4. Subscribes to schema-change events to recreate the Apollo Server
 *      instance on swap (D5 — restart pattern).
 *   5. Returns the composed server + Express app + `listen(port)` helper.
 */
import { ApolloServer } from '@apollo/server';
import { type Express } from 'express';
import type { DnaDataStore, OperationalDNA } from '@dna-codes/dna-core';
import { SchemaManager } from './schema/schema-manager';
export interface CreateServerArgs {
    /** DNA used ONLY for first-boot seeding via `dataStore.seedFromDna`. Ignored on subsequent boots. */
    dna: OperationalDNA;
    dataStore: DnaDataStore;
}
export interface CreatedServer {
    schemaManager: SchemaManager;
    apolloServer: ApolloServer;
    expressApp: Express;
    listen(port: number): Promise<{
        close(): Promise<void>;
    }>;
}
export declare function createServer(args: CreateServerArgs): Promise<CreatedServer>;
//# sourceMappingURL=server.d.ts.map