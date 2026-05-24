"use strict";
/**
 * @dna-codes/dna-api — Registry-native GraphQL API server.
 *
 * Public surface:
 *   - `createServer({ dna, dataStore })` builds the Apollo + Express stack
 *     wired around a schema generated from the data store's current
 *     `ResourceType` / `RelationshipType` records. Tests pass
 *     `integration/memory`; production code passes `integration/neo4j`.
 *   - `buildRegistrySchema({ dataStore, validatorCache, schemaManager })`
 *     for harness use when you want the schema only.
 *   - `SchemaManager` for advanced integration scenarios (e.g. wiring
 *     custom listeners onto schema-change events).
 *   - `runCli(argv, env)` is the CLI entrypoint — `bin/dna-api.js`
 *     invokes it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = exports.ValidatorCache = exports.SchemaManager = exports.buildRegistrySchema = exports.createServer = void 0;
var server_1 = require("./server");
Object.defineProperty(exports, "createServer", { enumerable: true, get: function () { return server_1.createServer; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "buildRegistrySchema", { enumerable: true, get: function () { return schema_1.buildRegistrySchema; } });
var schema_manager_1 = require("./schema/schema-manager");
Object.defineProperty(exports, "SchemaManager", { enumerable: true, get: function () { return schema_manager_1.SchemaManager; } });
var validator_cache_1 = require("./validation/validator-cache");
Object.defineProperty(exports, "ValidatorCache", { enumerable: true, get: function () { return validator_cache_1.ValidatorCache; } });
var cli_1 = require("./cli");
Object.defineProperty(exports, "runCli", { enumerable: true, get: function () { return cli_1.runCli; } });
//# sourceMappingURL=index.js.map