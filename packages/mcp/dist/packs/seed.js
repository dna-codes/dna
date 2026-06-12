"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PACK = void 0;
exports.seedPack = seedPack;
const index_js_1 = require("./index.js");
Object.defineProperty(exports, "DEFAULT_PACK", { enumerable: true, get: function () { return index_js_1.DEFAULT_PACK; } });
async function seedPack(store, packName = index_js_1.DEFAULT_PACK) {
    const pack = index_js_1.PACKS[packName];
    const [existingRt, existingRel] = await Promise.all([
        store.resourceType.list(),
        store.relationshipType.list(),
    ]);
    const existingRtNames = new Set(existingRt.map(r => r.name));
    const existingRelNames = new Set(existingRel.map(r => r.name));
    await Promise.all(pack.resourceTypes
        .filter(rt => !existingRtNames.has(rt.name))
        .map(rt => store.resourceType.create(rt)));
    await Promise.all(pack.relationshipTypes
        .filter(rt => !existingRelNames.has(rt.name))
        .map(rt => store.relationshipType.create(rt)));
}
//# sourceMappingURL=seed.js.map