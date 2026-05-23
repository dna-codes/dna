"use strict";
/**
 * Neo4j-backed `DnaDataStore` implementation.
 *
 * Storage shape: Instances are labeled nodes (label = Resource/Person/
 * Role/Group name). Links are `[:LINK]` edges with `_id`, optional `role`,
 * optional `attributes` (serialized JSON) properties. TypeDefinition and
 * RelationshipDef metadata are seeded by `migrate()` as `:TypeDefinition`
 * and `:RelationshipDef` nodes.
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
const cypher_1 = require("./cypher");
const NOUN_KEYS = [
    { key: 'resources', category: 'resource' },
    { key: 'persons', category: 'person' },
    { key: 'roles', category: 'role' },
    { key: 'groups', category: 'group' },
];
const RESERVED_PROPS = new Set(['_id', '_typeName', '_createdAt', '_updatedAt']);
function nounLabels(dna) {
    const labels = [];
    const domain = dna.domain ?? {};
    for (const { key } of NOUN_KEYS) {
        const list = Array.isArray(domain[key]) ? domain[key] : [];
        for (const entry of list) {
            if (typeof entry?.name === 'string')
                labels.push(entry.name);
        }
    }
    // De-dupe while preserving order; future-proof against the DNA listing
    // the same name twice in different categories (which is itself invalid
    // but should not crash this loop).
    return [...new Set(labels)];
}
function stripReservedAndId(node) {
    const id = String(node._id);
    const out = {};
    for (const [k, v] of Object.entries(node)) {
        if (!RESERVED_PROPS.has(k))
            out[k] = v;
    }
    return { id, ...out };
}
function nodePropsFor(id, data, now) {
    // Strip `id` from caller-payload; we set it as `_id` separately.
    const { id: _stripped, ...rest } = data;
    void _stripped;
    const props = {
        _id: id,
        _createdAt: now,
        _updatedAt: now,
        ...rest,
    };
    return props;
}
function createClient(opts, dna) {
    const driver = neo4j_driver_1.default.driver(opts.uri, neo4j_driver_1.default.auth.basic(opts.username, opts.password), { disableLosslessIntegers: true });
    function session() {
        return opts.database ? driver.session({ database: opts.database }) : driver.session();
    }
    return {
        async migrate() {
            const labels = nounLabels(dna);
            const s = session();
            try {
                for (const stmt of cypher_1.METADATA_SCHEMA_CYPHER) {
                    await s.run(stmt);
                }
                for (const label of labels) {
                    for (const stmt of (0, cypher_1.labelSchemaCypher)(label)) {
                        await s.run(stmt);
                    }
                }
                // Seed TypeDefinition nodes.
                const now = new Date().toISOString();
                const domain = dna.domain ?? {};
                for (const { key, category } of NOUN_KEYS) {
                    const list = Array.isArray(domain[key]) ? domain[key] : [];
                    for (const entry of list) {
                        if (typeof entry?.name !== 'string')
                            continue;
                        const attributes = Array.isArray(entry.attributes) ? entry.attributes : [];
                        await s.run(cypher_1.MERGE_TYPEDEF_CYPHER, {
                            name: entry.name,
                            props: {
                                name: entry.name,
                                category,
                                attributes: JSON.stringify(attributes),
                                createdAt: now,
                            },
                        });
                    }
                }
                // Seed RelationshipDef nodes.
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
                    const props = {
                        name: rel.name,
                        from: rel.from,
                        to: rel.to,
                        cardinality: rel.cardinality,
                        attribute: rel.attribute,
                        createdAt: now,
                    };
                    if (typeof rel.inverse === 'string')
                        props.inverse = rel.inverse;
                    await s.run(cypher_1.MERGE_RELDEF_CYPHER, { name: rel.name, props });
                }
            }
            finally {
                await s.close();
            }
        },
        instance: {
            async create(typeName, data) {
                (0, cypher_1.validateLabel)(typeName);
                const id = typeof data.id === 'string' && data.id.length > 0 ? data.id : (0, crypto_1.randomUUID)();
                const now = new Date().toISOString();
                const props = { ...nodePropsFor(id, data, now), _typeName: typeName };
                const s = session();
                try {
                    await s.run((0, cypher_1.createInstanceCypher)(typeName), { props });
                    return { id };
                }
                catch (err) {
                    // Neo4j unique-constraint violation surfaces as a code we can match.
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
                // Strip `id` from patch — IDs are immutable.
                const { id: _stripped, ...rest } = patch;
                void _stripped;
                const s = session();
                try {
                    const result = await s.run((0, cypher_1.updateInstanceCypher)(typeName), {
                        id,
                        patch: rest,
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
                const props = {
                    _id: id,
                    createdAt: new Date().toISOString(),
                };
                if (linkOpts.role !== undefined)
                    props.role = linkOpts.role;
                if (linkOpts.attributes !== undefined)
                    props.attributes = JSON.stringify(linkOpts.attributes);
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
                                // If a caller stored a non-JSON string as attributes via raw
                                // Cypher, surface it as-is rather than throwing.
                                out.attributes = { raw: props.attributes };
                            }
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
 * meaningful label (the typeName). If multiple, pick the first non-empty.
 */
function pickPrimitiveLabel(labels) {
    for (const label of labels) {
        if (label && label !== 'TypeDefinition' && label !== 'RelationshipDef')
            return label;
    }
    return labels[0] ?? '';
}
//# sourceMappingURL=client.js.map