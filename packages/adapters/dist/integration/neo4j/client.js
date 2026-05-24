"use strict";
/**
 * Neo4j-backed `DnaDataStore` implementation, registry-native edition.
 *
 * Storage shape:
 *   :ResourceType            metadata nodes for runtime type system
 *   :RelationshipType        metadata nodes for runtime relationship types
 *   :ResourceTypeVersion     append-only history → :ResourceType via [:VERSION_OF]
 *   :RelationshipTypeVersion append-only history → :RelationshipType
 *   :<TypeName>              labeled Instance nodes (e.g. :Loan, :Borrower)
 *   [:LINK]                  edges between Instance nodes, with `_id`, `role`,
 *                            `attributes` (JSON-stringified), `_schemaVersion`
 *   :SeedMarker              singleton sentinel written by seedFromDna
 *
 * Cypher snippets live in `./cypher.ts` and are unit-testable in
 * isolation. The client composes them with the driver.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const crypto_1 = require("crypto");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const dna_core_1 = require("@dna-codes/dna-core");
const cypher_1 = require("./cypher");
const RESERVED_PROPS = new Set(['_id', '_typeName', '_createdAt', '_updatedAt', '_schemaVersion']);
const FOUNDATIONAL = [
    { name: 'Person', category: 'person' },
    { name: 'Role', category: 'role' },
    { name: 'Group', category: 'group' },
    { name: 'Resource', category: 'resource' },
];
const NOUN_KEYS = [
    { key: 'resources', category: 'resource' },
    { key: 'persons', category: 'person' },
    { key: 'roles', category: 'role' },
    { key: 'groups', category: 'group' },
];
function toAttributeSchema(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((e) => !!e && typeof e === 'object' && typeof e.name === 'string');
}
function stripReservedAndId(node) {
    const id = String(node._id);
    const out = {};
    for (const [k, v] of Object.entries(node)) {
        if (k === '_id')
            continue;
        if (k === '_schemaVersion') {
            out._schemaVersion = typeof v === 'number' ? v : Number(v);
            continue;
        }
        if (RESERVED_PROPS.has(k))
            continue;
        out[k] = v;
    }
    return { id, ...out };
}
function nodePropsFor(id, data, now, schemaVersion) {
    const { id: _stripped, ...rest } = data;
    void _stripped;
    return {
        _id: id,
        _createdAt: now,
        _updatedAt: now,
        ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
        ...rest,
    };
}
function resourceTypeFromNode(node) {
    return {
        id: String(node.id),
        name: String(node.name),
        category: node.category,
        attribute_schema: parseAttributeSchema(node.attribute_schema),
        current_version: typeof node.current_version === 'number' ? node.current_version : Number(node.current_version),
        is_seed: Boolean(node.is_seed),
        ...(typeof node.description === 'string' ? { description: node.description } : {}),
    };
}
function relationshipTypeFromNode(node) {
    return {
        id: String(node.id),
        name: String(node.name),
        from: String(node.from),
        to: String(node.to),
        cardinality: node.cardinality,
        attribute: String(node.attribute),
        current_version: typeof node.current_version === 'number' ? node.current_version : Number(node.current_version),
        is_seed: Boolean(node.is_seed),
        ...(typeof node.inverse === 'string' ? { inverse: node.inverse } : {}),
        ...(typeof node.description === 'string' ? { description: node.description } : {}),
        ...(node.attribute_schema !== undefined
            ? { attribute_schema: parseAttributeSchema(node.attribute_schema) }
            : {}),
    };
}
function resourceTypeVersionFromNode(node) {
    return {
        id: String(node.id),
        resource_type_id: String(node.resource_type_id),
        version: typeof node.version === 'number' ? node.version : Number(node.version),
        attribute_schema: parseAttributeSchema(node.attribute_schema),
        created_at: String(node.created_at),
    };
}
function relationshipTypeVersionFromNode(node) {
    return {
        id: String(node.id),
        relationship_type_id: String(node.relationship_type_id),
        version: typeof node.version === 'number' ? node.version : Number(node.version),
        attribute_schema: node.attribute_schema !== undefined
            ? parseAttributeSchema(node.attribute_schema)
            : undefined,
        created_at: String(node.created_at),
    };
}
function parseAttributeSchema(raw) {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
function serializeAttributeSchema(schema) {
    return JSON.stringify(schema ?? []);
}
function createClient(opts, _dna) {
    // Constructor DNA is no longer used internally — seedFromDna takes it
    // explicitly. The positional argument stays for API compatibility with
    // older callers.
    const driver = neo4j_driver_1.default.driver(opts.uri, neo4j_driver_1.default.auth.basic(opts.username, opts.password), { disableLosslessIntegers: true });
    function session() {
        return opts.database ? driver.session({ database: opts.database }) : driver.session();
    }
    async function getResourceTypeByName(name) {
        const s = session();
        try {
            const result = await s.run(cypher_1.GET_RESOURCE_TYPE_BY_NAME_CYPHER, { name });
            if (result.records.length === 0)
                return null;
            return resourceTypeFromNode(result.records[0].get('rt').properties);
        }
        finally {
            await s.close();
        }
    }
    async function getRelationshipTypeByName(name) {
        const s = session();
        try {
            const result = await s.run(cypher_1.GET_RELATIONSHIP_TYPE_BY_NAME_CYPHER, { name });
            if (result.records.length === 0)
                return null;
            return relationshipTypeFromNode(result.records[0].get('rt').properties);
        }
        finally {
            await s.close();
        }
    }
    async function ensurePerTypeConstraints(label) {
        const s = session();
        try {
            for (const stmt of (0, cypher_1.labelSchemaCypher)(label)) {
                await s.run(stmt);
            }
        }
        finally {
            await s.close();
        }
    }
    async function dropPerTypeConstraints(label) {
        const s = session();
        try {
            for (const stmt of (0, cypher_1.dropLabelSchemaCypher)(label)) {
                await s.run(stmt);
            }
        }
        finally {
            await s.close();
        }
    }
    return {
        async migrate() {
            const s = session();
            try {
                for (const stmt of cypher_1.METADATA_SCHEMA_CYPHER) {
                    await s.run(stmt);
                }
            }
            finally {
                await s.close();
            }
        },
        async seedFromDna(dna) {
            const report = {
                resourceTypesCreated: 0,
                resourceTypesSkipped: 0,
                relationshipTypesCreated: 0,
                relationshipTypesSkipped: 0,
            };
            // 1. Foundational types.
            for (const f of FOUNDATIONAL) {
                const existing = await getResourceTypeByName(f.name);
                if (existing) {
                    report.resourceTypesSkipped += 1;
                    continue;
                }
                await this.resourceType.create({ name: f.name, category: f.category, attribute_schema: [] });
                // Re-fetch and mark as seed
                const fetched = await getResourceTypeByName(f.name);
                if (fetched) {
                    const s = session();
                    try {
                        await s.run('MATCH (rt:ResourceType {id: $id}) SET rt.is_seed = true', { id: fetched.id });
                    }
                    finally {
                        await s.close();
                    }
                }
                report.resourceTypesCreated += 1;
            }
            // 2. Domain ResourceTypes.
            const domain = dna.domain ?? {};
            for (const { key, category } of NOUN_KEYS) {
                const list = Array.isArray(domain[key])
                    ? domain[key]
                    : [];
                for (const entry of list) {
                    if (typeof entry?.name !== 'string')
                        continue;
                    const existing = await getResourceTypeByName(entry.name);
                    if (existing) {
                        report.resourceTypesSkipped += 1;
                        continue;
                    }
                    await this.resourceType.create({
                        name: entry.name,
                        category,
                        attribute_schema: toAttributeSchema(entry.attributes),
                        ...(typeof entry.description === 'string' ? { description: entry.description } : {}),
                    });
                    const fetched = await getResourceTypeByName(entry.name);
                    if (fetched) {
                        const s = session();
                        try {
                            await s.run('MATCH (rt:ResourceType {id: $id}) SET rt.is_seed = true', { id: fetched.id });
                        }
                        finally {
                            await s.close();
                        }
                    }
                    report.resourceTypesCreated += 1;
                }
            }
            // 3. RelationshipTypes.
            const rels = Array.isArray(dna.relationships)
                ? dna.relationships
                : [];
            for (const rel of rels) {
                if (typeof rel?.name !== 'string' ||
                    typeof rel?.from !== 'string' ||
                    typeof rel?.to !== 'string' ||
                    typeof rel?.cardinality !== 'string' ||
                    typeof rel?.attribute !== 'string') {
                    continue;
                }
                const existing = await getRelationshipTypeByName(rel.name);
                if (existing) {
                    report.relationshipTypesSkipped += 1;
                    continue;
                }
                await this.relationshipType.create({
                    name: rel.name,
                    from: rel.from,
                    to: rel.to,
                    cardinality: rel.cardinality,
                    attribute: rel.attribute,
                    ...(typeof rel.inverse === 'string' ? { inverse: rel.inverse } : {}),
                });
                const fetched = await getRelationshipTypeByName(rel.name);
                if (fetched) {
                    const s = session();
                    try {
                        await s.run('MATCH (rt:RelationshipType {id: $id}) SET rt.is_seed = true', {
                            id: fetched.id,
                        });
                    }
                    finally {
                        await s.close();
                    }
                }
                report.relationshipTypesCreated += 1;
            }
            // 4. Write seed marker with DNA hash for drift detection.
            const dnaHash = (0, crypto_1.createHash)('sha256').update(JSON.stringify(dna)).digest('hex');
            const s = session();
            try {
                await s.run(cypher_1.WRITE_SEED_MARKER_CYPHER, {
                    createdAt: new Date().toISOString(),
                    dnaHash,
                });
            }
            finally {
                await s.close();
            }
            return report;
        },
        async hasBeenSeeded() {
            const s = session();
            try {
                const result = await s.run(cypher_1.HAS_SEED_MARKER_CYPHER);
                return result.records.length > 0;
            }
            finally {
                await s.close();
            }
        },
        resourceType: {
            async create(input) {
                (0, cypher_1.validateLabel)(input.name);
                const id = input.id && input.id.length > 0 ? input.id : (0, crypto_1.randomUUID)();
                const now = new Date().toISOString();
                const props = {
                    id,
                    name: input.name,
                    category: input.category,
                    attribute_schema: serializeAttributeSchema(input.attribute_schema),
                    current_version: 1,
                    is_seed: false,
                    created_at: now,
                    ...(input.description !== undefined ? { description: input.description } : {}),
                };
                const s = session();
                try {
                    await s.run(cypher_1.CREATE_RESOURCE_TYPE_CYPHER, { props });
                    await s.run(cypher_1.CREATE_RESOURCE_TYPE_VERSION_CYPHER, {
                        resourceTypeId: id,
                        versionProps: {
                            id: (0, crypto_1.randomUUID)(),
                            resource_type_id: id,
                            version: 1,
                            attribute_schema: serializeAttributeSchema(input.attribute_schema),
                            created_at: now,
                        },
                    });
                }
                finally {
                    await s.close();
                }
                await ensurePerTypeConstraints(input.name);
                return { id };
            },
            async get(id) {
                const s = session();
                try {
                    const result = await s.run(cypher_1.GET_RESOURCE_TYPE_CYPHER, { id });
                    if (result.records.length === 0)
                        return null;
                    return resourceTypeFromNode(result.records[0].get('rt').properties);
                }
                finally {
                    await s.close();
                }
            },
            async list(filter) {
                const s = session();
                try {
                    const result = filter?.category
                        ? await s.run(cypher_1.LIST_RESOURCE_TYPES_BY_CATEGORY_CYPHER, { category: filter.category })
                        : await s.run(cypher_1.LIST_RESOURCE_TYPES_CYPHER);
                    return result.records.map((rec) => resourceTypeFromNode(rec.get('rt').properties));
                }
                finally {
                    await s.close();
                }
            },
            async update(id, patch) {
                const s = session();
                try {
                    const current = await s.run(cypher_1.GET_RESOURCE_TYPE_CYPHER, { id });
                    if (current.records.length === 0) {
                        throw new Error(`integration/neo4j: ResourceType ${id} not found`);
                    }
                    const existing = resourceTypeFromNode(current.records[0].get('rt').properties);
                    const newVersion = existing.current_version + 1;
                    const nextSchema = patch.attribute_schema ?? existing.attribute_schema;
                    const updatePatch = {};
                    if (patch.attribute_schema !== undefined) {
                        updatePatch.attribute_schema = serializeAttributeSchema(patch.attribute_schema);
                    }
                    if (patch.description !== undefined) {
                        updatePatch.description = patch.description;
                    }
                    await s.run(cypher_1.UPDATE_RESOURCE_TYPE_CYPHER, { id, patch: updatePatch, newVersion });
                    await s.run(cypher_1.CREATE_RESOURCE_TYPE_VERSION_CYPHER, {
                        resourceTypeId: id,
                        versionProps: {
                            id: (0, crypto_1.randomUUID)(),
                            resource_type_id: id,
                            version: newVersion,
                            attribute_schema: serializeAttributeSchema(nextSchema),
                            created_at: new Date().toISOString(),
                        },
                    });
                }
                finally {
                    await s.close();
                }
            },
            async delete(id, deleteOpts) {
                const s = session();
                let existingName = null;
                try {
                    const current = await s.run(cypher_1.GET_RESOURCE_TYPE_CYPHER, { id });
                    if (current.records.length === 0)
                        return;
                    const existing = resourceTypeFromNode(current.records[0].get('rt').properties);
                    existingName = existing.name;
                    (0, cypher_1.validateLabel)(existing.name);
                    const count = await s.run((0, cypher_1.COUNT_INSTANCES_OF_TYPE_CYPHER)(existing.name));
                    const inUse = Number(count.records[0]?.get('count') ?? 0);
                    if (inUse > 0 && !deleteOpts?.cascade) {
                        throw new dna_core_1.TypeInUseError(existing.name, inUse);
                    }
                    if (inUse > 0 && deleteOpts?.cascade) {
                        await s.run(`MATCH (n:${existing.name}) DETACH DELETE n`);
                    }
                    await s.run(cypher_1.DELETE_RESOURCE_TYPE_CYPHER, { id });
                }
                finally {
                    await s.close();
                }
                if (existingName) {
                    await dropPerTypeConstraints(existingName);
                }
            },
            async versions(id) {
                const s = session();
                try {
                    const result = await s.run(cypher_1.LIST_RESOURCE_TYPE_VERSIONS_CYPHER, { id });
                    return result.records.map((rec) => resourceTypeVersionFromNode(rec.get('v').properties));
                }
                finally {
                    await s.close();
                }
            },
        },
        relationshipType: {
            async create(input) {
                const id = input.id && input.id.length > 0 ? input.id : (0, crypto_1.randomUUID)();
                const now = new Date().toISOString();
                const props = {
                    id,
                    name: input.name,
                    from: input.from,
                    to: input.to,
                    cardinality: input.cardinality,
                    attribute: input.attribute,
                    current_version: 1,
                    is_seed: false,
                    created_at: now,
                    ...(input.inverse !== undefined ? { inverse: input.inverse } : {}),
                    ...(input.attribute_schema !== undefined
                        ? { attribute_schema: serializeAttributeSchema(input.attribute_schema) }
                        : {}),
                    ...(input.description !== undefined ? { description: input.description } : {}),
                };
                const s = session();
                try {
                    await s.run(cypher_1.CREATE_RELATIONSHIP_TYPE_CYPHER, { props });
                    await s.run(cypher_1.CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER, {
                        relationshipTypeId: id,
                        versionProps: {
                            id: (0, crypto_1.randomUUID)(),
                            relationship_type_id: id,
                            version: 1,
                            attribute_schema: serializeAttributeSchema(input.attribute_schema),
                            created_at: now,
                        },
                    });
                }
                finally {
                    await s.close();
                }
                return { id };
            },
            async get(id) {
                const s = session();
                try {
                    const result = await s.run(cypher_1.GET_RELATIONSHIP_TYPE_CYPHER, { id });
                    if (result.records.length === 0)
                        return null;
                    return relationshipTypeFromNode(result.records[0].get('rt').properties);
                }
                finally {
                    await s.close();
                }
            },
            async list() {
                const s = session();
                try {
                    const result = await s.run(cypher_1.LIST_RELATIONSHIP_TYPES_CYPHER);
                    return result.records.map((rec) => relationshipTypeFromNode(rec.get('rt').properties));
                }
                finally {
                    await s.close();
                }
            },
            async update(id, patch) {
                const s = session();
                try {
                    const current = await s.run(cypher_1.GET_RELATIONSHIP_TYPE_CYPHER, { id });
                    if (current.records.length === 0) {
                        throw new Error(`integration/neo4j: RelationshipType ${id} not found`);
                    }
                    const existing = relationshipTypeFromNode(current.records[0].get('rt').properties);
                    const newVersion = existing.current_version + 1;
                    const nextSchema = patch.attribute_schema ?? existing.attribute_schema ?? [];
                    const updatePatch = {};
                    if (patch.cardinality !== undefined)
                        updatePatch.cardinality = patch.cardinality;
                    if (patch.attribute !== undefined)
                        updatePatch.attribute = patch.attribute;
                    if (patch.inverse !== undefined)
                        updatePatch.inverse = patch.inverse;
                    if (patch.attribute_schema !== undefined) {
                        updatePatch.attribute_schema = serializeAttributeSchema(patch.attribute_schema);
                    }
                    if (patch.description !== undefined)
                        updatePatch.description = patch.description;
                    await s.run(cypher_1.UPDATE_RELATIONSHIP_TYPE_CYPHER, { id, patch: updatePatch, newVersion });
                    await s.run(cypher_1.CREATE_RELATIONSHIP_TYPE_VERSION_CYPHER, {
                        relationshipTypeId: id,
                        versionProps: {
                            id: (0, crypto_1.randomUUID)(),
                            relationship_type_id: id,
                            version: newVersion,
                            attribute_schema: serializeAttributeSchema(nextSchema),
                            created_at: new Date().toISOString(),
                        },
                    });
                }
                finally {
                    await s.close();
                }
            },
            async delete(id, deleteOpts) {
                const s = session();
                try {
                    const current = await s.run(cypher_1.GET_RELATIONSHIP_TYPE_CYPHER, { id });
                    if (current.records.length === 0)
                        return;
                    const existing = relationshipTypeFromNode(current.records[0].get('rt').properties);
                    const countResult = await s.run(cypher_1.COUNT_LINKS_OF_ROLE_CYPHER, { role: existing.name });
                    const inUse = Number(countResult.records[0]?.get('count') ?? 0);
                    if (inUse > 0 && !deleteOpts?.cascade) {
                        throw new dna_core_1.TypeInUseError(existing.name, inUse);
                    }
                    if (inUse > 0 && deleteOpts?.cascade) {
                        await s.run(cypher_1.DELETE_LINKS_OF_ROLE_CYPHER, { role: existing.name });
                    }
                    await s.run(cypher_1.DELETE_RELATIONSHIP_TYPE_CYPHER, { id });
                }
                finally {
                    await s.close();
                }
            },
            async versions(id) {
                const s = session();
                try {
                    const result = await s.run(cypher_1.LIST_RELATIONSHIP_TYPE_VERSIONS_CYPHER, { id });
                    return result.records.map((rec) => relationshipTypeVersionFromNode(rec.get('v').properties));
                }
                finally {
                    await s.close();
                }
            },
        },
        instance: {
            async create(typeName, data) {
                (0, cypher_1.validateLabel)(typeName);
                const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : (0, crypto_1.randomUUID)();
                const now = new Date().toISOString();
                const rt = await getResourceTypeByName(typeName);
                const schemaVersion = rt?.current_version;
                const props = {
                    ...nodePropsFor(id, data, now, schemaVersion),
                    _typeName: typeName,
                };
                const s = session();
                try {
                    await s.run((0, cypher_1.createInstanceCypher)(typeName), { props });
                    return { id };
                }
                catch (err) {
                    const code = err.code;
                    if (code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                        throw new Error(`integration/neo4j: ${typeName} instance with id "${id}" already exists`);
                    }
                    throw err;
                }
                finally {
                    await s.close();
                }
            },
            async get(typeName, id) {
                (0, cypher_1.validateLabel)(typeName);
                const s = session();
                try {
                    const result = await s.run((0, cypher_1.getInstanceCypher)(typeName), { id });
                    if (result.records.length === 0)
                        return null;
                    const node = result.records[0].get('n');
                    return stripReservedAndId(node.properties);
                }
                finally {
                    await s.close();
                }
            },
            async update(typeName, id, patch) {
                (0, cypher_1.validateLabel)(typeName);
                const { id: _id, _schemaVersion: _v, ...rest } = patch;
                void _id;
                void _v;
                const rt = await getResourceTypeByName(typeName);
                const schemaVersion = rt?.current_version;
                const fullPatch = {
                    ...rest,
                    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
                };
                const s = session();
                try {
                    const result = await s.run((0, cypher_1.updateInstanceCypher)(typeName), {
                        id,
                        patch: fullPatch,
                        updatedAt: new Date().toISOString(),
                    });
                    if (result.records.length === 0) {
                        throw new Error(`integration/neo4j: ${typeName} instance with id "${id}" not found`);
                    }
                }
                finally {
                    await s.close();
                }
            },
            async delete(typeName, id) {
                (0, cypher_1.validateLabel)(typeName);
                const s = session();
                try {
                    await s.run((0, cypher_1.deleteInstanceCypher)(typeName), { id });
                }
                finally {
                    await s.close();
                }
            },
            async list(typeName) {
                (0, cypher_1.validateLabel)(typeName);
                const s = session();
                try {
                    const result = await s.run((0, cypher_1.listInstanceCypher)(typeName));
                    return result.records.map((rec) => stripReservedAndId(rec.get('n').properties));
                }
                finally {
                    await s.close();
                }
            },
        },
        link: {
            async create(from, to, linkOpts = {}) {
                (0, cypher_1.validateLabel)(from.typeName);
                (0, cypher_1.validateLabel)(to.typeName);
                const id = typeof linkOpts.id === 'string' && linkOpts.id.length > 0 ? linkOpts.id : (0, crypto_1.randomUUID)();
                const rrt = linkOpts.role !== undefined ? await getRelationshipTypeByName(linkOpts.role) : null;
                const schemaVersion = rrt?.current_version;
                const props = {
                    _id: id,
                    createdAt: new Date().toISOString(),
                    ...(linkOpts.role !== undefined ? { role: linkOpts.role } : {}),
                    ...(linkOpts.attributes !== undefined
                        ? { attributes: JSON.stringify(linkOpts.attributes) }
                        : {}),
                    ...(schemaVersion !== undefined ? { _schemaVersion: schemaVersion } : {}),
                };
                const s = session();
                try {
                    const result = await s.run((0, cypher_1.createLinkCypher)(from.typeName, to.typeName), {
                        fromId: from.id,
                        toId: to.id,
                        props,
                    });
                    if (result.records.length === 0) {
                        throw new Error(`integration/neo4j: cannot create link — ${from.typeName} "${from.id}" or ${to.typeName} "${to.id}" not found`);
                    }
                    return { id };
                }
                catch (err) {
                    const code = err.code;
                    if (code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                        throw new Error(`integration/neo4j: link with id "${id}" already exists`);
                    }
                    throw err;
                }
                finally {
                    await s.close();
                }
            },
            async delete(linkId) {
                const s = session();
                try {
                    await s.run(cypher_1.DELETE_LINK_CYPHER, { linkId });
                }
                finally {
                    await s.close();
                }
            },
            async list(filter = {}) {
                const { cypher, params } = (0, cypher_1.buildLinkListCypher)(filter);
                const s = session();
                try {
                    const result = await s.run(cypher, params);
                    return result.records.map((rec) => {
                        const r = rec.get('r');
                        const fromLabels = rec.get('fromLabels');
                        const toLabels = rec.get('toLabels');
                        const fromId = String(rec.get('fromId'));
                        const toId = String(rec.get('toId'));
                        const props = r.properties;
                        const out = {
                            id: String(props._id),
                            from: { typeName: pickPrimitiveLabel(fromLabels), id: fromId },
                            to: { typeName: pickPrimitiveLabel(toLabels), id: toId },
                        };
                        if (typeof props.role === 'string')
                            out.role = props.role;
                        if (typeof props.attributes === 'string') {
                            try {
                                out.attributes = JSON.parse(props.attributes);
                            }
                            catch {
                                out.attributes = { raw: props.attributes };
                            }
                        }
                        if (typeof props._schemaVersion === 'number') {
                            out._schemaVersion = props._schemaVersion;
                        }
                        else if (typeof props._schemaVersion === 'string') {
                            out._schemaVersion = Number(props._schemaVersion);
                        }
                        return out;
                    });
                }
                finally {
                    await s.close();
                }
            },
        },
        async close() {
            await driver.close();
        },
    };
}
/**
 * Pick the noun-primitive label from a node's label list. Neo4j returns
 * all labels on a node; for Instance nodes there should be exactly one
 * meaningful label (the typeName).
 */
function pickPrimitiveLabel(labels) {
    for (const label of labels) {
        if (label && label !== 'ResourceType' && label !== 'RelationshipType' && label !== 'SeedMarker') {
            return label;
        }
    }
    return labels[0] ?? '';
}
//# sourceMappingURL=client.js.map