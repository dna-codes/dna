"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOrgChart = buildOrgChart;
const ORG_TYPES = new Set(['company', 'department', 'position', 'domain', 'group']);
async function buildOrgChart(store) {
    // Load all resource types to find org-relevant type names
    const allTypes = await store.resourceType.list();
    const orgTypeNames = new Set(allTypes.filter(t => ORG_TYPES.has(t.name.toLowerCase())).map(t => t.name));
    // Load all instances of org types
    const instancesByType = new Map();
    for (const typeName of orgTypeNames) {
        const records = await store.instance.list(typeName);
        instancesByType.set(typeName, records);
    }
    // Load person instances to find holders
    const personTypeName = allTypes.find(t => t.category === 'person')?.name ?? 'Person';
    const persons = await store.instance.list(personTypeName);
    // Load all links
    const allLinks = await store.link.list();
    // Build lookup maps
    const allInstances = new Map();
    for (const [typeName, records] of instancesByType) {
        for (const r of records) {
            allInstances.set(r.id, { ...r, type: typeName });
        }
    }
    for (const p of persons) {
        allInstances.set(p.id, { ...p, type: personTypeName });
    }
    // reports_to / belongs_to → parentId
    const parentMap = new Map();
    const fillsMap = new Map();
    for (const link of allLinks) {
        const relType = link.from.typeName + '->' + link.to.typeName;
        void relType;
        if (['reports_to', 'belongs_to', 'part_of'].includes(link.from.typeName)) {
            // link.from.typeName is actually the RelationshipType name here? No — it's the resource type name.
            // We need to check the relationship type name differently.
        }
    }
    // Re-approach: load relationship types to find which rel names mean containment/fills
    const relTypes = await store.relationshipType.list();
    const containmentRels = new Set(relTypes.filter(r => ['reports_to', 'belongs_to', 'part_of'].includes(r.name.toLowerCase())).map(r => r.name));
    const fillsRels = new Set(relTypes.filter(r => r.name.toLowerCase() === 'fills').map(r => r.name));
    // Now match links to relationship types
    // LinkRecord doesn't directly carry relationship type name — we match by from/to typeName pair
    // Actually DnaDataStore links don't carry rel type name in the record.
    // We need to infer from the from/to type combo and the registered relationship types.
    // Simplest approach: list links and group by matching RelationshipType via from/to TypeName pair.
    for (const link of allLinks) {
        const matchingRelType = relTypes.find(rt => rt.from === link.from.typeName && rt.to === link.to.typeName);
        if (!matchingRelType)
            continue;
        if (containmentRels.has(matchingRelType.name)) {
            parentMap.set(link.from.id, link.to.id);
        }
        if (fillsRels.has(matchingRelType.name)) {
            const person = allInstances.get(link.from.id);
            if (person) {
                const existing = fillsMap.get(link.to.id) ?? [];
                existing.push({ id: link.from.id, name: person.name });
                fillsMap.set(link.to.id, existing);
            }
        }
    }
    // Build tree nodes for org types only
    const orgInstances = [...allInstances.values()].filter(i => orgTypeNames.has(i.type));
    function buildNode(inst) {
        const children = orgInstances.filter(i => parentMap.get(i.id) === inst.id);
        return {
            id: inst.id,
            name: inst.name,
            type: inst.type,
            description: inst.description,
            holders: fillsMap.get(inst.id) ?? [],
            reports: children.map(buildNode),
            parentId: parentMap.get(inst.id),
        };
    }
    const roots = orgInstances.filter(i => !parentMap.has(i.id)).map(buildNode);
    const groupInst = orgInstances.find(i => ['company', 'department', 'domain'].includes(i.type.toLowerCase()));
    const groupName = groupInst?.name ?? 'Organization';
    return { lens: 'org-chart', groupName, roots };
}
//# sourceMappingURL=org-chart.js.map