"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPeoplePositions = buildPeoplePositions;
async function buildPeoplePositions(store) {
    const relTypes = await store.relationshipType.list();
    const fillsRel = relTypes.find(r => r.name.toLowerCase() === 'fills');
    if (!fillsRel) {
        return { lens: 'people-positions', positions: [] };
    }
    const positionTypeName = fillsRel.to;
    const personTypeName = fillsRel.from;
    const [positionInstances, personInstances, allLinks] = await Promise.all([
        store.instance.list(positionTypeName),
        store.instance.list(personTypeName),
        store.link.list(),
    ]);
    // Build map: positionId → person name
    const personById = new Map(personInstances.map(p => [p.id, String(p.name ?? '')]));
    // Find fills links: from.typeName === personTypeName, to.typeName === positionTypeName
    const positionToPersonMap = new Map();
    for (const link of allLinks) {
        if (link.from.typeName === personTypeName && link.to.typeName === positionTypeName) {
            const personName = personById.get(link.from.id);
            if (personName)
                positionToPersonMap.set(link.to.id, personName);
        }
    }
    const positions = positionInstances.map(pos => ({
        id: pos.id,
        name: String(pos.name ?? pos.id),
        person: positionToPersonMap.get(pos.id) ?? null,
    }));
    return { lens: 'people-positions', positions };
}
//# sourceMappingURL=people-positions.js.map