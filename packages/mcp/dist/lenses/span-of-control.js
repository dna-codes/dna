"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSpanOfControl = buildSpanOfControl;
async function buildSpanOfControl(store) {
    const relTypes = await store.relationshipType.list();
    const reportsToRel = relTypes.find(r => r.name.toLowerCase() === 'reports_to');
    if (!reportsToRel) {
        return { lens: 'span-of-control', positions: [] };
    }
    const posTypeName = reportsToRel.from;
    const [posInstances, allLinks] = await Promise.all([
        store.instance.list(posTypeName),
        store.link.list(),
    ]);
    if (posInstances.length === 0) {
        return { lens: 'span-of-control', positions: [] };
    }
    // childrenMap: managerId → [reporterIds]
    const childrenMap = new Map();
    for (const link of allLinks) {
        if (link.from.typeName === posTypeName && link.to.typeName === reportsToRel.to) {
            const existing = childrenMap.get(link.to.id) ?? [];
            existing.push(link.from.id);
            childrenMap.set(link.to.id, existing);
        }
    }
    function countTotal(posId, visited = new Set()) {
        if (visited.has(posId))
            return 0;
        visited.add(posId);
        const direct = childrenMap.get(posId) ?? [];
        return direct.length + direct.reduce((sum, childId) => sum + countTotal(childId, visited), 0);
    }
    const positions = posInstances.map(pos => {
        const direct = childrenMap.get(pos.id) ?? [];
        return {
            id: pos.id,
            name: String(pos.name ?? pos.id),
            directReports: direct.length,
            totalReports: countTotal(pos.id),
        };
    });
    return { lens: 'span-of-control', positions };
}
//# sourceMappingURL=span-of-control.js.map