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
    // Infer relationship types from (from.typeName, to.typeName) pairs — LinkRecord carries no rel name
    const relTypes = await store.relationshipType.list();
    const belongsToRels = new Set(relTypes.filter(r => ['belongs_to', 'part_of'].includes(r.name.toLowerCase())).map(r => r.name));
    const reportsToRels = new Set(relTypes.filter(r => r.name.toLowerCase() === 'reports_to').map(r => r.name));
    const fillsRels = new Set(relTypes.filter(r => r.name.toLowerCase() === 'fills').map(r => r.name));
    // Separate maps: structural containment (belongs_to) vs reporting chain (reports_to)
    const reportsToChildrenMap = new Map(); // manager.id → [subordinate ids]
    const reportsToParentMap = new Map(); // subordinate.id → manager.id
    // Specificity score for type-pair matching: prefer concrete from+to over wildcards
    const specificity = (rt) => (rt.from === '*' ? 0 : 1) + (rt.to === '*' ? 0 : 1);
    for (const link of allLinks) {
        // Determine the relationship type name: explicit role field (set when link has a role)
        // or infer by matching registered relTypes against the link's from/to resource type names.
        // Wildcard fields ('*') match any type; prefer specific matches over wildcard ones.
        let relName = link.role;
        if (!relName) {
            const match = relTypes
                .filter(rt => (rt.from === '*' || rt.from === link.from.typeName) &&
                (rt.to === '*' || rt.to === link.to.typeName))
                .sort((a, b) => specificity(b) - specificity(a))[0];
            relName = match?.name;
        }
        if (!relName)
            continue;
        if (belongsToRels.has(relName)) {
            parentMap.set(link.from.id, link.to.id);
        }
        else if (reportsToRels.has(relName)) {
            reportsToParentMap.set(link.from.id, link.to.id);
            const subs = reportsToChildrenMap.get(link.to.id) ?? [];
            subs.push(link.from.id);
            reportsToChildrenMap.set(link.to.id, subs);
        }
        else if (fillsRels.has(relName)) {
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
    const groupTypeNames = new Set(['company', 'department', 'domain', 'group']);
    const isGroupInst = (inst) => groupTypeNames.has(inst.type.toLowerCase());
    function buildNode(inst) {
        let children;
        if (isGroupInst(inst)) {
            // Group nodes: direct belongs_to children; for position children, only include top-level ones
            // (positions with a reports_to manager appear nested under their manager card instead)
            children = orgInstances.filter(i => parentMap.get(i.id) === inst.id &&
                (isGroupInst(i) || !reportsToParentMap.has(i.id)));
        }
        else {
            // Position nodes: subordinates via reports_to
            const subIds = reportsToChildrenMap.get(inst.id) ?? [];
            children = orgInstances.filter(i => subIds.includes(i.id));
        }
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
    // Roots: group nodes with no belongs_to parent; positions with neither belongs_to nor reports_to parent
    const roots = orgInstances.filter(i => !parentMap.has(i.id) && (isGroupInst(i) || !reportsToParentMap.has(i.id))).map(buildNode);
    const groupInst = orgInstances.find(i => ['company', 'department', 'domain'].includes(i.type.toLowerCase()));
    const groupName = groupInst?.name ?? 'Organization';
    return { lens: 'org-chart', groupName, roots };
}
//# sourceMappingURL=org-chart.js.map