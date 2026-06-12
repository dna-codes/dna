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
    // All links carry link.role = the relationship type name (set by patch_graph add_link)
    const BELONGS_TO = new Set(['belongs_to', 'part_of']);
    const REPORTS_TO = new Set(['reports_to']);
    const FILLS = new Set(['fills']);
    // Separate maps: structural containment (belongs_to) vs reporting chain (reports_to)
    const reportsToChildrenMap = new Map(); // manager.id → [subordinate ids]
    const reportsToParentMap = new Map(); // subordinate.id → manager.id
    for (const link of allLinks) {
        const role = link.role;
        if (!role)
            continue;
        if (BELONGS_TO.has(role)) {
            parentMap.set(link.from.id, link.to.id);
        }
        else if (REPORTS_TO.has(role)) {
            reportsToParentMap.set(link.from.id, link.to.id);
            const subs = reportsToChildrenMap.get(link.to.id) ?? [];
            subs.push(link.from.id);
            reportsToChildrenMap.set(link.to.id, subs);
        }
        else if (FILLS.has(role)) {
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