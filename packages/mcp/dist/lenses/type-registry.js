"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTypeRegistryGraph = buildTypeRegistryGraph;
/**
 * Build a type-level view of the registry: resource types as nodes and
 * relationship types as directed edges. Sourced entirely from registered type
 * records — it reads no instances, so it is fully populated in Build mode where
 * the graph has types but no data.
 */
async function buildTypeRegistryGraph(store) {
    const [resourceTypes, relTypes] = await Promise.all([
        store.resourceType.list(),
        store.relationshipType.list(),
    ]);
    return {
        lens: 'type-registry',
        resourceTypes: resourceTypes.map(rt => ({
            name: rt.name,
            category: rt.category,
            description: rt.description,
            stability: rt.stability,
            attributes: rt.attribute_schema ?? [],
        })),
        relationshipTypes: relTypes.map(rel => ({
            name: rel.name,
            from: rel.from,
            to: rel.to,
            cardinality: rel.cardinality,
            description: rel.description,
            stability: rel.stability,
        })),
    };
}
//# sourceMappingURL=type-registry.js.map