"use strict";
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
async function createServer(args) {
    const { dna, dataStore, skipDnaValidation = false } = args;
    // 1 + 2: schema build (validates DNA) and store migrate.
    const schema = (0, schema_1.buildSchema)({ dna, dataStore, skipValidation: skipDnaValidation });
    await dataStore.migrate();
    // 3: Apollo + Express composition (Apollo Server v5 unbundles HTTP).
    const apolloServer = new server_1.ApolloServer({ schema });
    await apolloServer.start();
    const expressApp = (0, express_1.default)();
    expressApp.use((0, cors_1.default)());
    expressApp.use(body_parser_1.default.json());
    expressApp.get('/healthz', (_req, res) => {
        res.status(200).send('ok');
    });
    expressApp.use('/graphql', (0, express4_1.expressMiddleware)(apolloServer));
    return {
        schema,
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