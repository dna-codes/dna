"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayeredConstructor = void 0;
const dna_core_1 = require("@dna-codes/dna-core");
const schema_to_tool_1 = require("../tools/schema-to-tool");
/**
 * Placeholder values for the base-contract fields the LLM tool surface
 * doesn't supply. Builders auto-stamp the real `id`, `type`, `version` on
 * compose; these are only used to satisfy the JSON-Schema validator during
 * the up-front `validatePrimitive` check.
 */
const PLACEHOLDER_UUID = '00000000-0000-4000-8000-000000000000';
const PLACEHOLDER_VERSION = '1';
const ADD_BUILDER = {
    resource: dna_core_1.addResource,
    person: dna_core_1.addPerson,
    role: dna_core_1.addRole,
    group: dna_core_1.addGroup,
    membership: dna_core_1.addMembership,
    operation: dna_core_1.addOperation,
    task: dna_core_1.addTask,
    process: dna_core_1.addProcess,
    trigger: dna_core_1.addTrigger,
    rule: dna_core_1.addRule,
};
class LayeredConstructor {
    constructor(options = {}) {
        this.accumulatedConflicts = [];
        this.validator = new dna_core_1.DnaValidator();
        this.transcript = [];
        this.callCount = 0;
        this.finalizeAttempts = 0;
        this.lastCallSig = null;
        this.finalized = false;
        const domain = options.domain ?? { name: 'domain' };
        this.dna = (0, dna_core_1.createOperationalDna)({
            domain: {
                name: domain.name,
                ...(domain.path ? { path: domain.path } : {}),
                ...(domain.description ? { description: domain.description } : {}),
            },
        });
        this.tools_ = (0, schema_to_tool_1.buildLayeredTools)();
        this.maxToolCalls = options.maxToolCalls ?? 50;
        this.maxFinalizeRetries = options.maxFinalizeRetries ?? 3;
    }
    /** Tool definitions in a provider-neutral shape. */
    tools() {
        return this.tools_.map((t) => ({ ...t, parameters: { ...t.parameters } }));
    }
    /** Pools of declared primitive names — useful for narrowing tool schemas mid-flight. */
    pools() {
        const dom = this.dna.domain;
        return {
            resources: namesOf(dom.resources),
            persons: namesOf(dom.persons),
            roles: namesOf(dom.roles),
            groups: namesOf(dom.groups),
            operations: namesOf(this.dna.operations),
            tasks: namesOf(this.dna.tasks),
            processes: namesOf(this.dna.processes),
            rules: namesOf(this.dna.rules),
        };
    }
    /**
     * The assembled document plus any composed-on-add conflicts. The
     * `document` field matches the shape `cleanDocument()` used to return —
     * it's the merged DNA stripped of empty collections. The `conflicts`
     * field accumulates scalar disagreements across all `add_*` tool calls
     * (an LLM re-emitting the same primitive with conflicting scalars).
     */
    result() {
        return {
            document: cleanDocument(this.dna),
            conflicts: [...this.accumulatedConflicts],
        };
    }
    hasFinalized() {
        return this.finalized;
    }
    toolCallCount() {
        return this.callCount;
    }
    toolCallTranscript() {
        return [...this.transcript];
    }
    /** Process a tool call from the LLM (or any caller). Synchronous and side-effect-free on errors. */
    handle(call) {
        if (this.callCount >= this.maxToolCalls) {
            const result = {
                ok: false,
                error: 'iteration_cap_reached',
                message: `Iteration cap of ${this.maxToolCalls} tool calls reached.`,
            };
            this.recordCall(call, result, /*increment*/ false);
            throw new Error(result.message);
        }
        const sig = signatureFor(call);
        if (sig !== null && sig === this.lastCallSig) {
            const result = {
                ok: false,
                error: 'duplicate_call',
                message: `Duplicate consecutive tool call rejected: ${call.name}.`,
            };
            this.recordCall(call, result, /*increment*/ true);
            this.lastCallSig = sig;
            return result;
        }
        let result;
        if (call.name === 'finalize') {
            result = this.handleFinalize();
        }
        else if (call.name.startsWith('add_')) {
            const kind = call.name.slice(4);
            if (!schema_to_tool_1.PRIMITIVE_KINDS.includes(kind)) {
                result = {
                    ok: false,
                    error: 'unknown_tool',
                    message: `Unknown tool: "${call.name}". Expected one of: ${this.tools_.map((t) => t.name).join(', ')}.`,
                };
            }
            else {
                result = this.handleAdd(kind, call.args);
            }
        }
        else {
            result = {
                ok: false,
                error: 'unknown_tool',
                message: `Unknown tool: "${call.name}". Expected one of: ${this.tools_.map((t) => t.name).join(', ')}.`,
            };
        }
        this.recordCall(call, result, /*increment*/ true);
        this.lastCallSig = sig;
        return result;
    }
    recordCall(call, result, increment) {
        if (increment)
            this.callCount += 1;
        this.transcript.push({ name: call.name, args: call.args, result });
    }
    handleAdd(kind, args) {
        if (!args || typeof args !== 'object') {
            return { ok: false, error: 'invalid_args', message: `add_${kind}: args must be an object.` };
        }
        // Validate up-front so the LLM gets a structured `schema_violation`
        // response. Builders validate by default too, but they throw on failure
        // — we want a soft error here, not an exception.
        const validation = this.validatePrimitive(kind, args);
        if (!validation.valid) {
            return {
                ok: false,
                error: 'schema_violation',
                message: `add_${kind}: schema validation failed.`,
                details: validation.errors,
            };
        }
        const refError = this.checkReferences(kind, args);
        if (refError)
            return refError;
        // Same-name composition: if a primitive with this name+kind already
        // exists in the running DNA, reuse its id so the auto-stamped UUIDs
        // don't surface as a spurious scalar conflict at merge time. (Same-name
        // primitives compose by design; only their user-facing scalars are
        // genuine conflicts.)
        const composeArgs = this.reuseExistingId(kind, args);
        // Compose into the running DNA via the matching builder. We just
        // validated; pass `validate: false` to skip a redundant pass.
        const builder = ADD_BUILDER[kind];
        const composed = builder(this.dna, composeArgs, { validate: false });
        this.dna = composed.dna;
        if (composed.conflicts.length > 0) {
            this.accumulatedConflicts.push(...composed.conflicts);
        }
        const name = typeof args.name === 'string' ? args.name : '<unnamed>';
        return {
            ok: true,
            primitive: kind,
            name,
            message: `Added ${kind} "${name}".`,
            ...(composed.conflicts.length > 0 ? { conflicts: composed.conflicts } : {}),
        };
    }
    /**
     * If a primitive with the given `kind` and `name` already exists in the
     * running DNA, return a copy of `args` with its `id` field set to the
     * existing id. Otherwise return `args` unchanged. Prevents merge() from
     * reporting a spurious id-scalar conflict when the same name is composed
     * twice (a supported pattern; only user-facing scalars should conflict).
     */
    reuseExistingId(kind, args) {
        if (typeof args.id === 'string' && args.id.length > 0)
            return args;
        const name = typeof args.name === 'string' ? args.name : null;
        if (!name)
            return args;
        const existing = this.findPrimitiveByName(kind, name);
        if (!existing)
            return args;
        return { ...args, id: existing.id };
    }
    findPrimitiveByName(kind, name) {
        const collection = this.collectionFor(kind);
        for (const entry of collection) {
            if (entry &&
                typeof entry === 'object' &&
                entry.name === name &&
                typeof entry.id === 'string') {
                return { id: entry.id };
            }
        }
        return null;
    }
    collectionFor(kind) {
        const dom = this.dna.domain;
        switch (kind) {
            case 'resource': return dom.resources ?? [];
            case 'person': return dom.persons ?? [];
            case 'role': return dom.roles ?? [];
            case 'group': return dom.groups ?? [];
            case 'membership': return this.dna.memberships ?? [];
            case 'operation': return this.dna.operations ?? [];
            case 'task': return this.dna.tasks ?? [];
            case 'process': return this.dna.processes ?? [];
            case 'trigger': return this.dna.triggers ?? [];
            case 'rule': return this.dna.rules ?? [];
            default: return [];
        }
    }
    validatePrimitive(kind, args) {
        const schemaId = `operational/${kind}`;
        // The base contract requires `id`, `type`, `version` on every primitive,
        // but builders auto-stamp those downstream — callers (and the LLM tool
        // surface) supply just the primitive-specific args. Augment with safe
        // placeholders for the auto-stamped fields before validating so we get a
        // clean `schema_violation` only for per-primitive shape errors.
        const augmented = {
            id: PLACEHOLDER_UUID,
            type: kind,
            version: PLACEHOLDER_VERSION,
            ...args,
        };
        return this.validator.validate(augmented, schemaId);
    }
    checkReferences(kind, args) {
        const pools = this.pools();
        const string = (k) => typeof args[k] === 'string' ? args[k] : undefined;
        switch (kind) {
            case 'resource': {
                const parent = string('parent');
                if (parent && !(pools.resources ?? []).includes(parent)) {
                    return refError('unknown_resource', 'parent', parent, pools.resources ?? []);
                }
                return null;
            }
            case 'person': {
                const parent = string('parent');
                if (parent && !(pools.persons ?? []).includes(parent)) {
                    return refError('unknown_person', 'parent', parent, pools.persons ?? []);
                }
                const resource = string('resource');
                if (resource && !(pools.resources ?? []).includes(resource)) {
                    return refError('unknown_resource', 'resource', resource, pools.resources ?? []);
                }
                return null;
            }
            case 'role': {
                const parent = string('parent');
                if (parent && !(pools.roles ?? []).includes(parent)) {
                    return refError('unknown_role', 'parent', parent, pools.roles ?? []);
                }
                const resource = string('resource');
                if (resource && !(pools.resources ?? []).includes(resource)) {
                    return refError('unknown_resource', 'resource', resource, pools.resources ?? []);
                }
                const scope = args.scope;
                const scopes = typeof scope === 'string' ? [scope] : Array.isArray(scope) ? scope.filter((s) => typeof s === 'string') : [];
                const scopeable = new Set([...(pools.groups ?? []), ...(pools.persons ?? [])]);
                for (const s of scopes) {
                    if (!scopeable.has(s)) {
                        return refError('unknown_group', 'scope', s, [...scopeable]);
                    }
                }
                return null;
            }
            case 'group': {
                const parent = string('parent');
                if (parent && !(pools.groups ?? []).includes(parent)) {
                    return refError('unknown_group', 'parent', parent, pools.groups ?? []);
                }
                return null;
            }
            case 'membership': {
                const person = string('person');
                if (person && !(pools.persons ?? []).includes(person)) {
                    return refError('unknown_person', 'person', person, pools.persons ?? []);
                }
                const role = string('role');
                if (role && !(pools.roles ?? []).includes(role)) {
                    return refError('unknown_role', 'role', role, pools.roles ?? []);
                }
                const group = string('group');
                const groupable = new Set([...(pools.groups ?? []), ...(pools.persons ?? [])]);
                if (group && !groupable.has(group)) {
                    return refError('unknown_group', 'group', group, [...groupable]);
                }
                return null;
            }
            case 'operation': {
                const target = string('target');
                const targets = new Set([
                    ...(pools.resources ?? []),
                    ...(pools.persons ?? []),
                    ...(pools.roles ?? []),
                    ...(pools.groups ?? []),
                    ...(pools.processes ?? []),
                ]);
                if (target && !targets.has(target)) {
                    return refError('unknown_target', 'target', target, [...targets]);
                }
                return null;
            }
            case 'task': {
                const actor = string('actor');
                const actors = new Set([...(pools.roles ?? []), ...(pools.persons ?? [])]);
                if (actor && !actors.has(actor)) {
                    return refError('unknown_actor', 'actor', actor, [...actors]);
                }
                const operation = string('operation');
                if (operation && !(pools.operations ?? []).includes(operation)) {
                    return refError('unknown_operation', 'operation', operation, pools.operations ?? []);
                }
                return null;
            }
            case 'process': {
                const operator = string('operator');
                const operators = new Set([...(pools.roles ?? []), ...(pools.persons ?? [])]);
                if (operator && !operators.has(operator)) {
                    return refError('unknown_operator', 'operator', operator, [...operators]);
                }
                const taskNames = new Set(pools.tasks ?? []);
                const steps = Array.isArray(args.steps) ? args.steps : [];
                for (const step of steps) {
                    if (!step || typeof step !== 'object')
                        continue;
                    const stepObj = step;
                    const taskRef = stepObj.task;
                    if (typeof taskRef === 'string' && !taskNames.has(taskRef)) {
                        return refError('unknown_task', `steps[].task`, taskRef, [...taskNames]);
                    }
                    const conditions = Array.isArray(stepObj.conditions) ? stepObj.conditions : [];
                    for (const cond of conditions) {
                        if (typeof cond === 'string' && !(pools.rules ?? []).includes(cond)) {
                            return refError('unknown_rule', `steps[].conditions`, cond, pools.rules ?? []);
                        }
                    }
                }
                return null;
            }
            case 'trigger': {
                const operation = string('operation');
                if (operation && !(pools.operations ?? []).includes(operation)) {
                    return refError('unknown_operation', 'operation', operation, pools.operations ?? []);
                }
                const process = string('process');
                if (process && !(pools.processes ?? []).includes(process)) {
                    return refError('unknown_process', 'process', process, pools.processes ?? []);
                }
                const after = string('after');
                if (after && !(pools.operations ?? []).includes(after)) {
                    return refError('unknown_operation', 'after', after, pools.operations ?? []);
                }
                return null;
            }
            case 'rule': {
                const operation = string('operation');
                if (operation && !(pools.operations ?? []).includes(operation)) {
                    return refError('unknown_operation', 'operation', operation, pools.operations ?? []);
                }
                return null;
            }
        }
        return null;
    }
    handleFinalize() {
        this.finalizeAttempts += 1;
        const document = cleanDocument(this.dna);
        const result = this.validator.validate(document, 'operational');
        const cross = this.validator.validateCrossLayer({ operational: document });
        if (result.valid && cross.valid) {
            this.finalized = true;
            return { ok: true, finalized: true, document, conflicts: [...this.accumulatedConflicts] };
        }
        if (this.finalizeAttempts >= this.maxFinalizeRetries) {
            return {
                ok: false,
                error: 'finalize_retries_exhausted',
                message: `Finalize failed ${this.finalizeAttempts} times; giving up.`,
                details: { schemaErrors: result.errors, crossLayerErrors: cross.errors },
            };
        }
        return {
            ok: false,
            error: 'finalize_failed',
            message: `Validation failed (attempt ${this.finalizeAttempts}/${this.maxFinalizeRetries}). Issue corrective add_* calls and call finalize again.`,
            details: { schemaErrors: result.errors, crossLayerErrors: cross.errors },
        };
    }
}
exports.LayeredConstructor = LayeredConstructor;
function refError(code, field, value, available) {
    return {
        ok: false,
        error: code,
        message: `Field "${field}" references "${value}" which is not declared. Available: ${available.length ? available.join(', ') : '(none yet)'}.`,
        available,
    };
}
function signatureFor(call) {
    try {
        return `${call.name}|${stableStringify(call.args ?? {})}`;
    }
    catch {
        return null;
    }
}
function stableStringify(value) {
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(',')}]`;
    const obj = value;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
function cleanDocument(dna) {
    const out = { domain: cleanDomain(dna.domain) };
    const sections = ['memberships', 'operations', 'triggers', 'rules', 'tasks', 'processes'];
    for (const key of sections) {
        const arr = dna[key];
        if (Array.isArray(arr) && arr.length > 0)
            out[key] = arr;
    }
    return out;
}
function cleanDomain(d) {
    const out = { name: d.name };
    if (d.path)
        out.path = d.path;
    if (d.description)
        out.description = d.description;
    if (Array.isArray(d.resources) && d.resources.length)
        out.resources = d.resources;
    if (Array.isArray(d.persons) && d.persons.length)
        out.persons = d.persons;
    if (Array.isArray(d.roles) && d.roles.length)
        out.roles = d.roles;
    if (Array.isArray(d.groups) && d.groups.length)
        out.groups = d.groups;
    return out;
}
function namesOf(items) {
    if (!Array.isArray(items))
        return [];
    return items
        .map((item) => item.name)
        .filter((n) => typeof n === 'string');
}
//# sourceMappingURL=constructor.js.map