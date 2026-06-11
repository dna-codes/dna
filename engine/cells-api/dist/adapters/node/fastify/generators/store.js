"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStore = void 0;
// In-memory + Drizzle store implementations are framework-agnostic — both
// adapters generate the same DataStore shape. Re-export so a fix to the
// store layer in express benefits fastify automatically.
var store_1 = require("../../express/generators/store");
Object.defineProperty(exports, "generateStore", { enumerable: true, get: function () { return store_1.generateStore; } });
//# sourceMappingURL=store.js.map