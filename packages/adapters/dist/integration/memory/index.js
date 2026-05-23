"use strict";
/**
 * @dna-codes/dna-adapters/integration/memory
 *
 * In-memory `DnaDataStore` implementation. Zero dependencies. The
 * recommended test double for any package that depends on `DnaDataStore`
 * (the runtime-data persistence contract from `@dna-codes/dna-core`).
 *
 * The adapter is constructed with an `OperationalDNA` so it knows the
 * type system. `migrate()` seeds TypeDefinition and RelationshipDef
 * metadata from that DNA. The adapter does NOT validate Instance data
 * against the DNA — validation is the caller's job (or the CLI's
 * composition layer).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return client_1.createClient; } });
//# sourceMappingURL=index.js.map