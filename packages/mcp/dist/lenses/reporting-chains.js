"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReportingChains = buildReportingChains;
async function buildReportingChains(store) {
    const relTypes = await store.relationshipType.list();
    const reportsToRel = relTypes.find(r => r.name.toLowerCase() === 'reports_to');
    if (!reportsToRel) {
        return { lens: 'reporting-chains', chains: [] };
    }
    const posTypeName = reportsToRel.from;
    const [posInstances, allLinks] = await Promise.all([
        store.instance.list(posTypeName),
        store.link.list(),
    ]);
    if (posInstances.length === 0) {
        return { lens: 'reporting-chains', chains: [] };
    }
    const nameById = new Map(posInstances.map(p => [p.id, String(p.name ?? p.id)]));
    // parentMap: fromId → toId (A reports_to B → parentMap[A] = B)
    const parentMap = new Map();
    for (const link of allLinks) {
        if (link.from.typeName === posTypeName && link.to.typeName === reportsToRel.to) {
            parentMap.set(link.from.id, link.to.id);
        }
    }
    // Leaves: positions that nobody reports to (not in parentMap values)
    const reportedToIds = new Set(parentMap.values());
    const posIds = posInstances.map(p => p.id);
    const leaves = posIds.filter(id => !reportedToIds.has(id));
    // If no reporting relationships at all, each position is its own chain
    if (parentMap.size === 0) {
        return {
            lens: 'reporting-chains',
            chains: posInstances.map(p => [String(p.name ?? p.id)]),
        };
    }
    const chains = [];
    for (const leafId of leaves) {
        const chain = [];
        const visited = new Set();
        let current = leafId;
        while (current && !visited.has(current)) {
            visited.add(current);
            const name = nameById.get(current);
            if (name)
                chain.push(name);
            current = parentMap.get(current);
        }
        chains.push(chain);
    }
    return { lens: 'reporting-chains', chains };
}
//# sourceMappingURL=reporting-chains.js.map