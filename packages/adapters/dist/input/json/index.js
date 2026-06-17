"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const dna_core_1 = require("@dna-codes/dna-core");
/**
 * Walk a JSON sample and infer DNA Resources + Relationships from it.
 *
 * The walker no longer maintains its own `Map<name, Resource>` or per-attribute
 * `seen` set — it composes a single OperationalDNA via the `addResource` /
 * `addRelationship` builders from `@dna-codes/dna-core`. Same-named primitives
 * compose by name; same-keyed attributes within a Resource union via the
 * builder's underlying merge rules. The walker's only correctness concern is
 * deciding whether each JSON key becomes a scalar Attribute, a reference
 * Attribute + child Resource recursion, or is dropped (arrays of scalars).
 */
function parse(data, options) {
    if (!isRecord(data) && !Array.isArray(data)) {
        throw new Error('input-json.parse: input must be a JSON object or array of objects.');
    }
    const domainName = options.domain ?? options.name.toLowerCase();
    let dna = (0, dna_core_1.createOperationalDna)({ domain: { name: domainName } });
    const rootSample = Array.isArray(data) ? mergeRecords(data) : data;
    dna = walk(rootSample, options.name, dna, options);
    const resources = (dna.resources ?? []);
    const relationships = (dna.relationships ?? []);
    return {
        operational: {
            domain: { name: domainName },
            resources,
            ...(relationships.length ? { relationships } : {}),
        },
    };
}
function walk(data, resourceName, dna, options) {
    for (const [key, value] of Object.entries(data)) {
        if (isRecord(value)) {
            const childName = deriveResourceName(key, options);
            dna = (0, dna_core_1.addResource)(dna, {
                name: resourceName,
                attributes: [{ name: key, type: 'reference', resource: childName }],
            }).dna;
            dna = (0, dna_core_1.addRelationship)(dna, buildRelationship(resourceName, childName, key, 'one-to-one')).dna;
            dna = walk(value, childName, dna, options);
            continue;
        }
        if (Array.isArray(value)) {
            if (value.length > 0 && isRecord(value[0])) {
                const childName = deriveResourceName(key, options);
                dna = (0, dna_core_1.addResource)(dna, {
                    name: resourceName,
                    attributes: [{ name: key, type: 'reference', resource: childName }],
                }).dna;
                dna = (0, dna_core_1.addRelationship)(dna, buildRelationship(resourceName, childName, key, 'one-to-many')).dna;
                const merged = mergeRecords(value);
                dna = walk(merged, childName, dna, options);
            }
            // Arrays of scalars (e.g. `tags: ["fantasy", "classic"]`) have no faithful
            // representation as a single DNA Attribute — the canonical schema's
            // type enum is string | text | number | boolean | date | datetime | enum
            // | reference. The DNA way to model scalar collections is a child Resource
            // plus a relationship, which requires more context than a JSON sample
            // provides. Rather than emit invalid DNA, drop these keys.
            continue;
        }
        const attr = { name: key, type: inferScalarType(value) };
        dna = (0, dna_core_1.addResource)(dna, { name: resourceName, attributes: [attr] }).dna;
    }
    // Ensure the resource exists even if it had no recognizable keys.
    const targetResources = (dna.resources ?? []);
    if (!targetResources.some((r) => r.name === resourceName)) {
        dna = (0, dna_core_1.addResource)(dna, { name: resourceName }).dna;
    }
    return dna;
}
function buildRelationship(from, to, attribute, cardinality) {
    return {
        name: `${from}.${attribute}`,
        from,
        to,
        attribute,
        cardinality,
    };
}
function deriveResourceName(key, options) {
    if (options.resourceNameFromKey)
        return options.resourceNameFromKey(key);
    return pascalCase(singularize(key));
}
/**
 * Shallow-merge an array of record-shaped values into a single record by
 * picking the first non-null sample for each key. Handles schemas that drift
 * across array items (partial/optional fields).
 */
function mergeRecords(items) {
    const out = {};
    for (const item of items) {
        if (!isRecord(item))
            continue;
        for (const [k, v] of Object.entries(item)) {
            if (!(k in out) || out[k] == null)
                out[k] = v;
        }
    }
    return out;
}
function inferScalarType(value) {
    if (value == null)
        return 'string';
    if (typeof value === 'boolean')
        return 'boolean';
    if (typeof value === 'number')
        return 'number';
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T/.test(value))
            return 'datetime';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value))
            return 'date';
        return 'string';
    }
    return 'string';
}
function isRecord(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function pascalCase(s) {
    return s
        .split(/[\s\-_./]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
}
function singularize(s) {
    if (s.endsWith('ies') && s.length > 3)
        return s.slice(0, -3) + 'y';
    if (s.endsWith('sses'))
        return s.slice(0, -2);
    if (s.endsWith('s') && !s.endsWith('ss'))
        return s.slice(0, -1);
    return s;
}
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map