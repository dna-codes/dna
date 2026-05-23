"use strict";
/**
 * @dna-codes/dna-adapters/integration/neo4j
 *
 * Neo4j-backed `DnaDataStore` implementation. Storage shape: Instances as
 * labeled nodes (label = Resource/Person/Role/Group name), Links as
 * `[:LINK]` edges with properties. Metadata (TypeDefinition,
 * RelationshipDef) is seeded by `migrate()`.
 *
 * Deliberately DNA-aware (takes an `OperationalDNA` at construction) —
 * see `AGENTS.md` for the rationale and the contrast with external-system
 * integrations that remain pure I/O.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCli = exports.createClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return client_1.createClient; } });
var cli_1 = require("./cli");
Object.defineProperty(exports, "runCli", { enumerable: true, get: function () { return cli_1.runCli; } });
//# sourceMappingURL=index.js.map