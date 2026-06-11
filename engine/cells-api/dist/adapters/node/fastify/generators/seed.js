"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeed = void 0;
// Standalone seed script — reads product.core.json and writes examples to
// Postgres. Independent of the HTTP framework; re-exported from express.
var seed_1 = require("../../express/generators/seed");
Object.defineProperty(exports, "generateSeed", { enumerable: true, get: function () { return seed_1.generateSeed; } });
//# sourceMappingURL=seed.js.map