"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINALIZE_TOOL = exports.PRIMITIVE_KINDS = void 0;
exports.inlineSchema = inlineSchema;
exports.buildPrimitiveTool = buildPrimitiveTool;
exports.buildLayeredTools = buildLayeredTools;
exports.injectEnums = injectEnums;
const dna_core_1 = require("@dna-codes/dna-core");
exports.PRIMITIVE_KINDS = [
    'resource',
    'person',
    'role',
    'group',
    'membership',
    'operation',
    'task',
    'process',
    'trigger',
    'rule',
];
const SHARED_DEFS = {
    'https://dna.codes/schemas/operational/attribute': dna_core_1.schemas.operational.attribute,
    'https://dna.codes/schemas/operational/action': dna_core_1.schemas.operational.action,
    'https://dna.codes/schemas/operational/base': dna_core_1.schemas.operational.base,
};
function inlineSchema(schema) {
    return walk(schema);
}
function walk(node) {
    if (Array.isArray(node))
        return node.map(walk);
    if (!node || typeof node !== 'object')
        return node;
    const obj = node;
    if (typeof obj.$ref === 'string' && SHARED_DEFS[obj.$ref]) {
        return walk(SHARED_DEFS[obj.$ref]);
    }
    // Pre-flatten allOf compositions: when a per-primitive schema extends
    // the base contract via `allOf: [{$ref: '.../base'}]`, the inlined tool
    // schema should merge the base's properties into the parent so the
    // resulting JSON-Schema has no `$ref` and no `allOf`. (The LLM tool
    // surface needs flat properties; LayeredConstructor handles auto-stamped
    // fields with placeholders.)
    if (Array.isArray(obj.allOf)) {
        const flattened = flattenAllOf(obj);
        return walkFlattened(flattened);
    }
    return walkFlattened(obj);
}
function walkFlattened(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k === '$id' || k === '$schema' || k === 'examples')
            continue;
        out[k] = walk(v);
    }
    return out;
}
/**
 * Merge every `allOf` member's `properties`, `required`, and `type` into
 * the parent object, then drop `allOf`. Each member is `$ref`-resolved via
 * `SHARED_DEFS` first. The result has the same observable shape minus the
 * composition keyword.
 */
function flattenAllOf(parent) {
    const members = parent.allOf.map((m) => {
        if (m && typeof m === 'object' && typeof m.$ref === 'string') {
            const ref = m.$ref;
            const target = SHARED_DEFS[ref];
            if (target)
                return target;
        }
        return m;
    });
    const mergedProperties = {
        ...(parent.properties ?? {}),
    };
    const requiredSet = new Set(Array.isArray(parent.required) ? parent.required : []);
    for (const member of members) {
        if (!member || typeof member !== 'object')
            continue;
        const memberProps = member.properties;
        if (memberProps && typeof memberProps === 'object') {
            for (const [key, value] of Object.entries(memberProps)) {
                if (!(key in mergedProperties))
                    mergedProperties[key] = value;
            }
        }
        if (Array.isArray(member.required)) {
            for (const r of member.required)
                requiredSet.add(r);
        }
    }
    const { allOf: _drop, ...rest } = parent;
    void _drop;
    return {
        ...rest,
        properties: mergedProperties,
        required: [...requiredSet],
    };
}
const PRIMITIVE_SCHEMA = {
    resource: dna_core_1.schemas.operational.resource,
    person: dna_core_1.schemas.operational.person,
    role: dna_core_1.schemas.operational.role,
    group: dna_core_1.schemas.operational.group,
    membership: dna_core_1.schemas.operational.membership,
    operation: dna_core_1.schemas.operational.operation,
    task: dna_core_1.schemas.operational.task,
    process: dna_core_1.schemas.operational.process,
    trigger: dna_core_1.schemas.operational.trigger,
    rule: dna_core_1.schemas.operational.rule,
};
const PRIMITIVE_PURPOSE = {
    resource: 'Add a Resource (structure the org tracks: Loan, Invoice, Document).',
    person: 'Add a Person template (kind of human: Customer, Employee, Patient).',
    role: 'Add a Role template (position: Underwriter, Doctor, LeadCounsel).',
    group: 'Add a Group template (work-unit / container that scopes Roles: BankDepartment, Case).',
    membership: 'Add a Membership: a Person template is eligible to hold a Role template (optionally within a Group).',
    operation: 'Add an Operation: a Target.Action atomic unit of business activity (e.g. Loan.Approve).',
    task: 'Add a Task: an Actor (Role) performing exactly one Operation.',
    process: 'Add a Process: a named DAG of Steps (an SOP / workflow).',
    trigger: 'Add a Trigger: what initiates an Operation or Process (user, schedule, webhook, prior operation).',
    rule: 'Add a Rule: an access constraint or condition gating an Operation.',
};
function buildPrimitiveTool(kind) {
    const schema = PRIMITIVE_SCHEMA[kind];
    const inlined = inlineSchema(schema);
    const description = `${PRIMITIVE_PURPOSE[kind]} ${schema.title ?? ''}`.trim();
    return {
        name: `add_${kind}`,
        description,
        parameters: { ...inlined, additionalProperties: false },
    };
}
exports.FINALIZE_TOOL = {
    name: 'finalize',
    description: 'Signal that the Operational DNA is complete and run full schema validation. Call this exactly once after every Operational primitive named in the input has been added. Returns { ok: true } on success or { ok: false, errors } if validation fails (you may then issue corrective add_* calls and call finalize again).',
    parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {},
    },
};
function buildLayeredTools() {
    return [...exports.PRIMITIVE_KINDS.map(buildPrimitiveTool), exports.FINALIZE_TOOL];
}
const REFERENCE_FIELDS = {
    resource: { parent: 'resources' },
    person: { parent: 'persons', resource: 'resources' },
    role: { parent: 'roles', resource: 'resources' },
    group: { parent: 'groups' },
    membership: { person: 'persons', role: 'roles', group: 'groups' },
    operation: { target: 'resources' },
    task: { actor: 'roles' },
    process: { operator: 'roles' },
    trigger: {},
    rule: {},
};
/**
 * Returns a copy of `tools` with cross-primitive string fields narrowed to enum
 * lists drawn from the in-progress draft. Use this between tool-call rounds when
 * a provider supports per-round tool re-registration; otherwise the runtime
 * `LayeredConstructor.handle()` enforces the same checks via structured errors.
 */
function injectEnums(tools, pools) {
    return tools.map((tool) => {
        const kind = toolToKind(tool.name);
        if (!kind)
            return tool;
        const refs = REFERENCE_FIELDS[kind];
        if (!refs)
            return tool;
        const params = JSON.parse(JSON.stringify(tool.parameters));
        const props = (params.properties ?? {});
        for (const [field, poolKey] of Object.entries(refs)) {
            if (!poolKey)
                continue;
            const pool = pools[poolKey] ?? [];
            if (pool.length === 0)
                continue;
            if (props[field]) {
                props[field] = { ...props[field], enum: [...pool] };
            }
        }
        params.properties = props;
        return { ...tool, parameters: params };
    });
}
function toolToKind(name) {
    if (!name.startsWith('add_'))
        return null;
    const k = name.slice(4);
    return exports.PRIMITIVE_KINDS.includes(k) ? k : null;
}
//# sourceMappingURL=schema-to-tool.js.map