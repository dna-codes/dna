"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildJobDescriptions = buildJobDescriptions;
async function buildJobDescriptions(store) {
    const [rtList, relTypes, allLinks] = await Promise.all([
        store.resourceType.list(),
        store.relationshipType.list(),
        store.link.list(),
    ]);
    const rtByName = new Map(rtList.map(r => [r.name, r]));
    const relByName = new Map(relTypes.map(r => [r.name, r]));
    // Resolve all instances we care about
    const typeNames = rtList.map(r => r.name);
    const allInstances = new Map();
    await Promise.all(typeNames.map(async (tn) => {
        const instances = await store.instance.list(tn);
        for (const inst of instances) {
            allInstances.set(inst.id, {
                id: inst.id,
                name: String(inst.name ?? inst.id),
                description: inst.description,
                typeName: tn,
            });
        }
    }));
    const positions = [...allInstances.values()].filter(i => i.typeName === 'position');
    // Group name: prefer department or company over graph name
    const groupNode = [...allInstances.values()].find(i => i.typeName === 'department' || i.typeName === 'company');
    const groupName = groupNode?.name ?? 'Organization';
    // fills: person → position
    const fillsRel = relByName.get('fills');
    const posToHolder = new Map();
    if (fillsRel) {
        for (const link of allLinks) {
            if (link.from.typeName === fillsRel.from && link.to.typeName === fillsRel.to) {
                const person = allInstances.get(link.from.id);
                if (person)
                    posToHolder.set(link.to.id, person.name);
            }
        }
    }
    // reports_to: position → position (from = subordinate, to = manager)
    const reportsToRel = relByName.get('reports_to');
    const posReportsTo = new Map();
    if (reportsToRel) {
        for (const link of allLinks) {
            if (link.from.typeName === reportsToRel.from && link.to.typeName === reportsToRel.to) {
                posReportsTo.set(link.from.id, link.to.id);
            }
        }
    }
    // belongs_to: find department/company for each position
    const posDept = new Map();
    for (const link of allLinks) {
        if (link.from.typeName === 'position') {
            const parent = allInstances.get(link.to.id);
            if (parent && (parent.typeName === 'department' || parent.typeName === 'company')) {
                posDept.set(link.from.id, parent.name);
            }
        }
    }
    // assigned_to: step → position  (from = step, to = position)
    const assignedToRel = relByName.get('assigned_to');
    const stepsByPos = new Map();
    if (assignedToRel) {
        for (const link of allLinks) {
            if (link.from.typeName === 'step' && link.to.typeName === 'position') {
                const step = allInstances.get(link.from.id);
                if (step) {
                    const list = stepsByPos.get(link.to.id) ?? [];
                    list.push({ title: step.name, description: step.description });
                    stepsByPos.set(link.to.id, list);
                }
            }
        }
    }
    const entries = positions.map((pos) => {
        const reportsToId = posReportsTo.get(pos.id);
        return {
            positionId: pos.id,
            role: pos.name,
            description: pos.description,
            holder: posToHolder.get(pos.id),
            department: posDept.get(pos.id) ?? groupName,
            reportsTo: reportsToId ? allInstances.get(reportsToId)?.name : undefined,
            responsibilities: stepsByPos.get(pos.id) ?? [],
        };
    });
    return { lens: 'job-descriptions', groupName, entries };
}
//# sourceMappingURL=job-descriptions.js.map