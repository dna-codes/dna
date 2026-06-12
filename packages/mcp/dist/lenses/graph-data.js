"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraphData = buildGraphData;
async function buildGraphData(store) {
    const [resourceTypes, relTypes, allLinks] = await Promise.all([
        store.resourceType.list(),
        store.relationshipType.list(),
        store.link.list(),
    ]);
    // Build a lookup: from/to typeName pair → relationship type name
    const relTypeByPair = new Map();
    for (const rt of relTypes) {
        relTypeByPair.set(`${rt.from}→${rt.to}`, rt.name);
    }
    // Collect all instances across all resource types
    const nodes = [];
    for (const rt of resourceTypes) {
        const instances = await store.instance.list(rt.name);
        for (const inst of instances) {
            nodes.push({
                id: inst.id,
                type: rt.name,
                name: String(inst.name ?? inst.id),
            });
        }
    }
    const edges = allLinks.map(link => ({
        id: link.id,
        source: link.from.id,
        target: link.to.id,
        type: relTypeByPair.get(`${link.from.typeName}→${link.to.typeName}`) ?? 'link',
    }));
    return { nodes, edges };
}
//# sourceMappingURL=graph-data.js.map