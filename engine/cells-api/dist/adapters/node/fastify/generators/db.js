"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDrizzleStore = exports.generateDbConnection = void 0;
// The Drizzle layer is identical to express — it returns table SQL strings
// and a generic resource→table lookup, neither of which touches the HTTP
// framework. Re-export so both adapters stay in sync with one source of truth.
var db_1 = require("../../express/generators/db");
Object.defineProperty(exports, "generateDbConnection", { enumerable: true, get: function () { return db_1.generateDbConnection; } });
Object.defineProperty(exports, "generateDrizzleStore", { enumerable: true, get: function () { return db_1.generateDrizzleStore; } });
//# sourceMappingURL=db.js.map