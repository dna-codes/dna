"use strict";
/**
 * In-memory `DnaDataStore` implementation, registry-native edition. Zero
 * dependencies; the recommended test double for any package that depends
 * on `DnaDataStore`.
 *
 * Storage shape mirrors the Neo4j adapter so tests written against this
 * adapter exercise the same behaviors the Neo4j adapter promises (modulo
 * network and persistence):
 *
 *   - `ResourceType` and `RelationshipType` records live in their own
 *     in-memory maps with versioned history.
 *   - `Instance` records are keyed by `(typeName, id)` and stamped with
 *     `_schemaVersion` from the relevant ResourceType.current_version at
 *     write time.
 *   - `Link` records carry their own unique IDs plus optional `role` and
 *     `attributes`, and a `_schemaVersion` from the RelationshipType.
 *   - `seedFromDna` writes seed records once; `hasBeenSeeded()` reflects
 *     the marker.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const crypto_1 = require("crypto");
const dna_core_1 = require("@dna-codes/dna-core");
const STABILITY_VALUES = ['experimental', 'beta', 'stable', 'deprecated'];
/** Narrow an authored `stability` field to a valid `Stability`, or `undefined`. */
function asStability(raw) {
    return typeof raw === 'string' && STABILITY_VALUES.includes(raw) ? raw : undefined;
}
const NOUN_KEYS = [
    { key: 'resources', category: 'resource' },
    { key: 'persons', category: 'person' },
    { key: 'roles', category: 'role' },
    { key: 'groups', category: 'group' },
];
const FOUNDATIONAL = [
    { name: 'Person', category: 'person' },
    { name: 'Role', category: 'role' },
    { name: 'Group', category: 'group' },
    { name: 'Resource', category: 'resource' },
];
function toAttributeSchema(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((e) => !!e && typeof e === 'object' && typeof e.name === 'string');
}
function createClient(_dna) {
    // The constructor DNA is ignored — seedFromDna takes the DNA explicitly.
    // Accepting it as an optional positional arg preserves API compatibility
    // with the prior call shape used by older test fixtures.
    const resourceTypes = new Map();
    const resourceTypeVersionsById = new Map();
    const resourceTypeIdByName = new Map();
    const relationshipTypes = new Map();
    const relationshipTypeVersionsById = new Map();
    const relationshipTypeIdByName = new Map();
    const instances = new Map();
    const links = [];
    let seedMarker = false;
    function bucket(typeName) {
        let b = instances.get(typeName);
        if (!b) {
            b = new Map();
            instances.set(typeName, b);
        }
        return b;
    }
    function refEquals(a, b) {
        return a.typeName === b.typeName && a.id === b.id;
    }
    function pushVersion(id, version, schema, stability, kind) {
        if (kind === 'resource') {
            const versions = resourceTypeVersionsById.get(id) ?? [];
            versions.push({
                id: (0, crypto_1.randomUUID)(),
                resource_type_id: id,
                version,
                attribute_schema: schema,
                stability,
                created_at: new Date().toISOString(),
            });
            resourceTypeVersionsById.set(id, versions);
        }
        else {
            const versions = relationshipTypeVersionsById.get(id) ?? [];
            versions.push({
                id: (0, crypto_1.randomUUID)(),
                relationship_type_id: id,
                version,
                attribute_schema: schema,
                stability,
                created_at: new Date().toISOString(),
            });
            relationshipTypeVersionsById.set(id, versions);
        }
    }
    function createResourceTypeImpl(input, isSeed) {
        if (resourceTypeIdByName.has(input.name)) {
            throw new Error(`integration/memory: ResourceType "${input.name}" already exists`);
        }
        const id = input.id && input.id.length > 0 ? input.id : (0, crypto_1.randomUUID)();
        const stability = input.stability ?? (0, dna_core_1.defaultStabilityForType)(input.name);
        const record = {
            id,
            name: input.name,
            category: input.category,
            attribute_schema: input.attribute_schema,
            current_version: 1,
            stability,
            is_seed: isSeed,
            ...(input.description !== undefined ? { description: input.description } : {}),
        };
        resourceTypes.set(id, record);
        resourceTypeIdByName.set(input.name, id);
        pushVersion(id, 1, input.attribute_schema, stability, 'resource');
        return { id };
    }
    function createRelationshipTypeImpl(input, isSeed) {
        if (relationshipTypeIdByName.has(input.name)) {
            throw new Error(`integration/memory: RelationshipType "${input.name}" already exists`);
        }
        const id = input.id && input.id.length > 0 ? input.id : (0, crypto_1.randomUUID)();
        const stability = input.stability ?? (0, dna_core_1.defaultStabilityForType)(input.name);
        const record = {
            id,
            name: input.name,
            from: input.from,
            to: input.to,
            cardinality: input.cardinality,
            attribute: input.attribute,
            current_version: 1,
            stability,
            is_seed: isSeed,
            ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
            ...(input.attribute_schema !== undefined ? { attribute_schema: input.attribute_schema } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
        };
        relationshipTypes.set(id, record);
        relationshipTypeIdByName.set(input.name, id);
        pushVersion(id, 1, input.attribute_schema ?? [], stability, 'relationship');
        return { id };
    }
    function resourceTypeByName(name) {
        const id = resourceTypeIdByName.get(name);
        return id ? resourceTypes.get(id) : undefined;
    }
    function relationshipTypeByName(name) {
        const id = relationshipTypeIdByName.get(name);
        return id ? relationshipTypes.get(id) : undefined;
    }
    return {
        async migrate() {
            // Memory adapter has no constraints/indexes to create.
        },
        async seedFromDna(dna) {
            const report = {
                resourceTypesCreated: 0,
                resourceTypesSkipped: 0,
                relationshipTypesCreated: 0,
                relationshipTypesSkipped: 0,
            };
            // 1. Four foundational ResourceTypes.
            for (const f of FOUNDATIONAL) {
                if (resourceTypeIdByName.has(f.name)) {
                    report.resourceTypesSkipped += 1;
                    continue;
                }
                createResourceTypeImpl({ name: f.name, category: f.category, attribute_schema: [] }, 
                /* isSeed */ true);
                report.resourceTypesCreated += 1;
            }
            // 2. Tenant ResourceTypes from the document's top-level noun collections
            //    (home-edge model — nouns no longer live under `dna.domain`).
            for (const { key, category } of NOUN_KEYS) {
                const list = Array.isArray(dna[key]) ? dna[key] : [];
                for (const entry of list) {
                    if (typeof entry?.name !== 'string')
                        continue;
                    if (resourceTypeIdByName.has(entry.name)) {
                        report.resourceTypesSkipped += 1;
                        continue;
                    }
                    createResourceTypeImpl({
                        name: entry.name,
                        category,
                        attribute_schema: toAttributeSchema(entry.attributes),
                        ...(asStability(entry.stability) ? { stability: asStability(entry.stability) } : {}),
                    }, true);
                    report.resourceTypesCreated += 1;
                }
            }
            // 3. RelationshipTypes from dna.relationships[]
            const rels = Array.isArray(dna.relationships) ? dna.relationships : [];
            for (const rel of rels) {
                if (typeof rel?.name !== 'string' ||
                    typeof rel?.from !== 'string' ||
                    typeof rel?.to !== 'string' ||
                    typeof rel?.cardinality !== 'string' ||
                    typeof rel?.attribute !== 'string') {
                    continue;
                }
                if (relationshipTypeIdByName.has(rel.name)) {
                    report.relationshipTypesSkipped += 1;
                    continue;
                }
                createRelationshipTypeImpl({
                    name: rel.name,
                    from: rel.from,
                    to: rel.to,
                    cardinality: rel.cardinality,
                    attribute: rel.attribute,
                    ...(typeof rel.inverse === 'string' ? { inverse: rel.inverse } : {}),
                    ...(asStability(rel.stability) ? { stability: asStability(rel.stability) } : {}),
                }, true);
                report.relationshipTypesCreated += 1;
            }
            seedMarker = true;
            return report;
        },
        async hasBeenSeeded() {
            return seedMarker;
        },
        resourceType: {
            async create(input) {
                return createResourceTypeImpl(input, /* isSeed */ false);
            },
            async get(id) {
                return resourceTypes.get(id) ?? null;
            },
            async list(filter) {
                const all = [...resourceTypes.values()];
                if (filter?.category)
                    return all.filter((rt) => rt.category === filter.category);
                return all;
            },
            async update(id, patch) {
                const existing = resourceTypes.get(id);
                if (!existing)
                    throw new Error(`integration/memory: ResourceType ${id} not found`);
                const nextSchema = patch.attribute_schema ?? existing.attribute_schema;
                const nextStability = patch.stability ?? existing.stability;
                const next = {
                    ...existing,
                    ...(patch.attribute_schema !== undefined ? { attribute_schema: patch.attribute_schema } : {}),
                    ...(patch.stability !== undefined ? { stability: patch.stability } : {}),
                    ...(patch.description !== undefined ? { description: patch.description } : {}),
                    current_version: existing.current_version + 1,
                };
                resourceTypes.set(id, next);
                pushVersion(id, next.current_version, nextSchema, nextStability, 'resource');
            },
            async setStability(id, stability) {
                const existing = resourceTypes.get(id);
                if (!existing)
                    throw new Error(`integration/memory: ResourceType ${id} not found`);
                // Orthogonal to schema version: no current_version bump, no version record.
                resourceTypes.set(id, { ...existing, stability });
            },
            async delete(id, opts) {
                const existing = resourceTypes.get(id);
                if (!existing)
                    return;
                const inUse = instances.get(existing.name)?.size ?? 0;
                if (inUse > 0 && !opts?.cascade) {
                    throw new dna_core_1.TypeInUseError(existing.name, inUse);
                }
                if (inUse > 0 && opts?.cascade) {
                    // Remove all instances of that type and any adjacent Links.
                    instances.delete(existing.name);
                    for (let i = links.length - 1; i >= 0; i--) {
                        const l = links[i];
                        if (l.from.typeName === existing.name || l.to.typeName === existing.name) {
                            links.splice(i, 1);
                        }
                    }
                }
                resourceTypes.delete(id);
                resourceTypeIdByName.delete(existing.name);
                resourceTypeVersionsById.delete(id);
            },
            async versions(id) {
                const versions = resourceTypeVersionsById.get(id) ?? [];
                return [...versions].sort((a, b) => b.version - a.version);
            },
        },
        relationshipType: {
            async create(input) {
                return createRelationshipTypeImpl(input, /* isSeed */ false);
            },
            async get(id) {
                return relationshipTypes.get(id) ?? null;
            },
            async list() {
                return [...relationshipTypes.values()];
            },
            async update(id, patch) {
                const existing = relationshipTypes.get(id);
                if (!existing)
                    throw new Error(`integration/memory: RelationshipType ${id} not found`);
                const nextSchema = patch.attribute_schema ?? existing.attribute_schema ?? [];
                const nextStability = patch.stability ?? existing.stability;
                const next = {
                    ...existing,
                    ...(patch.cardinality !== undefined ? { cardinality: patch.cardinality } : {}),
                    ...(patch.attribute !== undefined ? { attribute: patch.attribute } : {}),
                    ...(patch.inverse !== undefined ? { inverse: patch.inverse } : {}),
                    ...(patch.attribute_schema !== undefined ? { attribute_schema: patch.attribute_schema } : {}),
                    ...(patch.stability !== undefined ? { stability: patch.stability } : {}),
                    ...(patch.description !== undefined ? { description: patch.description } : {}),
                    current_version: existing.current_version + 1,
                };
                relationshipTypes.set(id, next);
                pushVersion(id, next.current_version, nextSchema, nextStability, 'relationship');
            },
            async setStability(id, stability) {
                const existing = relationshipTypes.get(id);
                if (!existing)
                    throw new Error(`integration/memory: RelationshipType ${id} not found`);
                // Orthogonal to schema version: no current_version bump, no version record.
                relationshipTypes.set(id, { ...existing, stability });
            },
            async delete(id, opts) {
                const existing = relationshipTypes.get(id);
                if (!existing)
                    return;
                const inUse = links.filter((l) => l.role === existing.name).length;
                if (inUse > 0 && !opts?.cascade) {
                    throw new dna_core_1.TypeInUseError(existing.name, inUse);
                }
                if (inUse > 0 && opts?.cascade) {
                    for (let i = links.length - 1; i >= 0; i--) {
                        if (links[i].role === existing.name)
                            links.splice(i, 1);
                    }
                }
                relationshipTypes.delete(id);
                relationshipTypeIdByName.delete(existing.name);
                relationshipTypeVersionsById.delete(id);
            },
            async versions(id) {
                const versions = relationshipTypeVersionsById.get(id) ?? [];
                return [...versions].sort((a, b) => b.version - a.version);
            },
        },
        instance: {
            async create(typeName, data) {
                const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : (0, crypto_1.randomUUID)();
                const b = bucket(typeName);
                if (b.has(id)) {
                    throw new Error(`integration/memory: ${typeName} instance with id "${id}" already exists`);
                }
                const { id: _stripped, ...rest } = data;
                void _stripped;
                const rt = resourceTypeByName(typeName);
                const schemaVersion = rt?.current_version;
                const record = {
                    id,
                    ...rest,
                    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
                };
                b.set(id, record);
                return { id };
            },
            async get(typeName, id) {
                return bucket(typeName).get(id) ?? null;
            },
            async update(typeName, id, patch) {
                const b = bucket(typeName);
                const existing = b.get(id);
                if (!existing) {
                    throw new Error(`integration/memory: ${typeName} instance with id "${id}" not found`);
                }
                const { id: _stripped, _schemaVersion: _v, ...rest } = patch;
                void _stripped;
                void _v;
                const rt = resourceTypeByName(typeName);
                const schemaVersion = rt?.current_version;
                const next = {
                    ...existing,
                    ...rest,
                    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
                };
                b.set(id, next);
            },
            async delete(typeName, id) {
                bucket(typeName).delete(id);
            },
            async list(typeName) {
                return [...bucket(typeName).values()];
            },
        },
        link: {
            async create(from, to, opts = {}) {
                const id = typeof opts.id === 'string' && opts.id.length > 0 ? opts.id : (0, crypto_1.randomUUID)();
                if (links.some((l) => l.id === id)) {
                    throw new Error(`integration/memory: link with id "${id}" already exists`);
                }
                const rrt = opts.role !== undefined ? relationshipTypeByName(opts.role) : undefined;
                const schemaVersion = rrt?.current_version;
                const record = {
                    id,
                    from: { ...from },
                    to: { ...to },
                    ...(opts.role !== undefined ? { role: opts.role } : {}),
                    ...(opts.attributes !== undefined ? { attributes: { ...opts.attributes } } : {}),
                    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
                };
                links.push(record);
                return { id };
            },
            async delete(linkId) {
                const idx = links.findIndex((l) => l.id === linkId);
                if (idx >= 0)
                    links.splice(idx, 1);
            },
            async list(filter = {}) {
                return links
                    .filter((l) => (filter.from ? refEquals(l.from, filter.from) : true))
                    .filter((l) => (filter.to ? refEquals(l.to, filter.to) : true))
                    .filter((l) => (filter.role !== undefined ? l.role === filter.role : true))
                    .map((l) => ({
                    id: l.id,
                    from: { ...l.from },
                    to: { ...l.to },
                    ...(l.role !== undefined ? { role: l.role } : {}),
                    ...(l.attributes !== undefined ? { attributes: { ...l.attributes } } : {}),
                    ...(l._schemaVersion !== undefined ? { _schemaVersion: l._schemaVersion } : {}),
                }));
            },
        },
        async close() {
            // no-op
        },
    };
}
//# sourceMappingURL=client.js.map