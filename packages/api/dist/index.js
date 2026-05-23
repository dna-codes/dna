"use strict";
/**
 * @dna-codes/dna-api — DNA-derived GraphQL API server.
 *
 * The public surface is intentionally small:
 *   - `createServer({ dna, dataStore })` builds and returns an Apollo
 *     Server + Express app wired around a GraphQL schema generated from
 *     the supplied DNA. Tests pass `integration/memory`; production code
 *     passes `integration/neo4j`.
 *   - `buildSchema({ dna, dataStore })` is exported for harness use when
 *     you want just the schema (e.g. for introspection-only tests).
 *   - `runCli(argv, env)` is the CLI entrypoint — `bin/dna-api.js`
 *     invokes it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = exports.buildSchema = exports.createServer = void 0;
var server_1 = require("./server");
Object.defineProperty(exports, "createServer", { enumerable: true, get: function () { return server_1.createServer; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "buildSchema", { enumerable: true, get: function () { return schema_1.buildSchema; } });
var cli_1 = require("./cli");
Object.defineProperty(exports, "runCli", { enumerable: true, get: function () { return cli_1.runCli; } });
//# sourceMappingURL=index.js.map