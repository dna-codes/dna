"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const server_1 = require("@apollo/server");
const express4_1 = require("@as-integrations/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const schema_1 = require("./schema");
const schema_manager_1 = require("./schema/schema-manager");
const validator_cache_1 = require("./validation/validator-cache");
async function createServer(args) {
    const { dna, dataStore } = args;
    // 1. Migrate constraints/indexes. No data writes.
    await dataStore.migrate();
    // 2. First-boot seeding if needed.
    const alreadySeeded = await dataStore.hasBeenSeeded();
    if (!alreadySeeded) {
        await dataStore.seedFromDna(dna);
    }
    // 3. SchemaManager owns the live schema. Builder closure reads from
    //    the data store + threads the validator cache and a self-reference
    //    so admin mutations can trigger rebuilds.
    const validatorCache = new validator_cache_1.ValidatorCache();
    // Lazy ref so SchemaManager can pass itself to the builder.
    let manager;
    manager = new schema_manager_1.SchemaManager(() => (0, schema_1.buildRegistrySchema)({ dataStore, validatorCache, schemaManager: manager }));
    await manager.rebuild();
    // 4. Apollo Server v5 + Express. The Apollo instance is re-created on
    //    schema swaps (D5 restart pattern); the Express app and HTTP server
    //    stay up between swaps. We expose the *current* Apollo instance to
    //    Express through a single middleware wrapper that forwards to
    //    whichever Apollo instance is live.
    let apolloServer = new server_1.ApolloServer({ schema: manager.getSchema() });
    await apolloServer.start();
    let graphqlMiddleware = (0, express4_1.expressMiddleware)(apolloServer);
    manager.onChange(async (newSchema) => {
        const newApollo = new server_1.ApolloServer({ schema: newSchema });
        await newApollo.start();
        const oldApollo = apolloServer;
        apolloServer = newApollo;
        graphqlMiddleware = (0, express4_1.expressMiddleware)(newApollo);
        // Stop the old instance after the swap so in-flight requests already
        // bound to it complete.
        setImmediate(() => {
            void oldApollo.stop();
        });
    });
    const expressApp = (0, express_1.default)();
    expressApp.use((0, cors_1.default)());
    expressApp.use(body_parser_1.default.json());
    expressApp.get('/healthz', (_req, res) => {
        res.status(200).send('ok');
    });
    // Forwarder middleware — looks up the current GraphQL middleware on
    // every request so schema swaps land without re-mounting Express routes.
    expressApp.use('/graphql', (req, res, next) => {
        graphqlMiddleware(req, res, next);
    });
    return {
        schemaManager: manager,
        apolloServer,
        expressApp,
        async listen(port) {
            const httpServer = http_1.default.createServer(expressApp);
            await new Promise((resolve, reject) => {
                httpServer.once('error', reject);
                httpServer.listen(port, () => resolve());
            });
            return {
                async close() {
                    await new Promise((resolve, reject) => {
                        httpServer.close((err) => (err ? reject(err) : resolve()));
                    });
                    await apolloServer.stop();
                },
            };
        },
    };
}
//# sourceMappingURL=server.js.map