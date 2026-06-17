"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnaValidator = void 0;
const _2020_1 = __importDefault(require("ajv/dist/2020"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const index_1 = require("./index");
const CHARACTERISTICS = {
    resource: new Set(['targetable']),
    // Person is scopeable so Positions can be exercised per-individual (e.g.
    // AttendingPhysician.scope = Patient); not in the canonical 5×5 table.
    person: new Set(['targetable', 'actorable', 'scopeable']),
    group: new Set(['targetable', 'scopeable']),
    position: new Set(['targetable', 'actorable', 'memberable']),
    process: new Set(['targetable', 'executable']),
};
const KIND_LABEL = {
    resource: 'Resource',
    person: 'Person',
    group: 'Group',
    position: 'Position',
    process: 'Process',
};
function kindsWith(characteristic) {
    return Object.keys(CHARACTERISTICS).filter(k => CHARACTERISTICS[k].has(characteristic));
}
function kindLabelsFor(characteristic, joiner) {
    const labels = kindsWith(characteristic).map(k => KIND_LABEL[k]);
    if (labels.length <= 1)
        return labels.join('');
    if (labels.length === 2)
        return `${labels[0]} ${joiner} ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, ${joiner} ${labels[labels.length - 1]}`;
}
function quoteList(names) {
    return [...names].sort().map(n => `"${n}"`).join(', ');
}
function availability(label, names) {
    const list = [...names];
    if (list.length === 0)
        return `no ${label} declared`;
    return `available ${label}: ${list.sort().map(n => `"${n}"`).join(', ')}`;
}
function findCycle(start, byName) {
    const order = [];
    const seen = new Set();
    let cur = start;
    while (cur && byName.has(cur)) {
        if (seen.has(cur)) {
            return order.slice(order.indexOf(cur));
        }
        seen.add(cur);
        order.push(cur);
        cur = byName.get(cur).parent;
    }
    return null;
}
function isNarrowerOrEqual(childEntry, parentScope, primitives) {
    const childKind = primitives.byName.get(childEntry)?.kind;
    for (const parentEntry of parentScope) {
        if (childEntry === parentEntry)
            return true;
        if (childKind === 'person')
            continue;
        const parentKind = primitives.byName.get(parentEntry)?.kind;
        if (parentKind === 'person')
            continue;
        if (childKind === 'group' && parentKind === 'group') {
            let cur = childEntry;
            const visited = new Set();
            while (cur && !visited.has(cur)) {
                if (cur === parentEntry)
                    return true;
                visited.add(cur);
                cur = primitives.groups.find(g => g.name === cur)?.parent;
            }
        }
    }
    return false;
}
function narrowingHint(childEntry, parentScope, primitives) {
    const childKind = primitives.byName.get(childEntry)?.kind;
    const parentKinds = new Set(parentScope.map(p => primitives.byName.get(p)?.kind));
    if (childKind === 'person' && parentKinds.size === 1 && parentKinds.has('group')) {
        return ' (a Person scope is narrower only than itself; it cannot narrow under a Group scope)';
    }
    return '';
}
class DnaValidator {
    constructor() {
        this.validators = new Map();
        this.ajv = new _2020_1.default({ strict: false, allErrors: true });
        (0, ajv_formats_1.default)(this.ajv);
        this.registerSchemas();
    }
    registerSchemas() {
        const schemas = (0, index_1.allSchemas)();
        for (const schema of schemas) {
            this.ajv.addSchema(schema);
        }
        for (const schema of schemas) {
            const id = schema.$id;
            this.validators.set(id, this.ajv.getSchema(id));
            // Also register by short ID (e.g. "operational/resource") for convenience
            const shortId = id.replace('https://dna.codes/schemas/', '');
            this.validators.set(shortId, this.ajv.getSchema(id));
        }
    }
    validate(doc, schemaId) {
        const validateFn = this.validators.get(schemaId);
        if (!validateFn) {
            throw new Error(`Unknown schema: "${schemaId}". Available: ${[...this.validators.keys()].join(', ')}`);
        }
        const valid = validateFn(doc);
        return { valid, errors: validateFn.errors ?? [] };
    }
    availableSchemas() {
        return [...this.validators.keys()];
    }
    // ── Cross-layer validation ─────────────────────────────────────────────────
    collectPrimitives(op) {
        // Nouns now live in top-level collections (home-edge model); the domain
        // tree is no longer a container, so there is nothing to walk.
        const resources = op.resources ?? [];
        const persons = op.persons ?? [];
        const positions = op.positions ?? [];
        const groups = op.groups ?? [];
        const processes = op.processes ?? [];
        const byName = new Map();
        for (const r of resources)
            byName.set(r.name, { kind: 'resource', noun: r });
        for (const p of persons)
            byName.set(p.name, { kind: 'person', noun: p });
        for (const r of positions)
            byName.set(r.name, { kind: 'position', noun: r });
        for (const g of groups)
            byName.set(g.name, { kind: 'group', noun: g });
        for (const p of processes)
            byName.set(p.name, { kind: 'process', noun: p });
        const resourceNames = new Set(resources.map(r => r.name));
        const personNames = new Set(persons.map(p => p.name));
        const positionNames = new Set(positions.map(r => r.name));
        const groupNames = new Set(groups.map(g => g.name));
        const processNames = new Set(processes.map(p => p.name));
        const namesByKind = {
            resource: resourceNames,
            person: personNames,
            position: positionNames,
            group: groupNames,
            process: processNames,
        };
        return {
            resources,
            persons,
            positions,
            groups,
            processes,
            byName,
            resourceNames,
            personNames,
            positionNames,
            groupNames,
            processNames,
            allNounNames: new Set([
                ...resourceNames,
                ...personNames,
                ...positionNames,
                ...groupNames,
            ]),
            pool(characteristic) {
                const out = new Set();
                for (const kind of kindsWith(characteristic)) {
                    for (const n of namesByKind[kind])
                        out.add(n);
                }
                return out;
            },
            hasCharacteristic(name, characteristic) {
                const entry = byName.get(name);
                return !!entry && CHARACTERISTICS[entry.kind].has(characteristic);
            },
        };
    }
    validateCrossLayer(layers) {
        const errors = [];
        const op = layers.operational;
        const core = layers.productCore;
        const api = layers.productApi;
        const ui = layers.productUi;
        const tech = layers.technical;
        // ── Operational ──────────────────────────────────────────────────────
        if (op) {
            const primitives = this.collectPrimitives(op);
            const operationNames = new Set((op.operations ?? []).map(o => o.name));
            const taskNames = new Set((op.tasks ?? []).map(t => t.name));
            const ruleNames = new Set((op.rules ?? []).filter(r => !!r.name).map(r => r.name));
            const processNames = primitives.processNames;
            const membershipNames = new Set((op.memberships ?? []).map(m => m.name));
            const targetablePool = primitives.pool('targetable');
            const actorablePool = primitives.pool('actorable');
            const scopeablePool = primitives.pool('scopeable');
            const targetableKinds = kindLabelsFor('targetable', 'or');
            const actorableKinds = kindLabelsFor('actorable', 'or');
            const scopeableKinds = kindLabelsFor('scopeable', 'or');
            // Operation.target must reference a targetable primitive.
            // Operation.action must match an action name in the target's actions[] catalog.
            // Operation.changes[].attribute must resolve on the target's attributes[]
            // catalog when given as an unqualified identifier.
            for (const operation of op.operations ?? []) {
                let targetNoun;
                if (!targetablePool.has(operation.target)) {
                    errors.push({
                        layer: 'operational',
                        path: `operations/${operation.name}/target`,
                        message: `Operation "${operation.name}" target "${operation.target}" is not a declared ${targetableKinds}; ${availability('targets', targetablePool)}`,
                    });
                }
                else {
                    const entry = primitives.byName.get(operation.target);
                    targetNoun = entry.noun;
                    const actionNames = new Set((targetNoun.actions ?? []).map(a => a.name));
                    if (actionNames.size > 0 && !actionNames.has(operation.action)) {
                        errors.push({
                            layer: 'operational',
                            path: `operations/${operation.name}/action`,
                            message: `Operation "${operation.name}" action "${operation.action}" is not declared on ${KIND_LABEL[entry.kind]} "${operation.target}"; available actions: ${quoteList(actionNames)}`,
                        });
                    }
                }
                if (targetNoun) {
                    const attrNames = new Set((targetNoun.attributes ?? []).map(a => a.name));
                    if (attrNames.size > 0) {
                        for (const [i, change] of (operation.changes ?? []).entries()) {
                            // Allow legacy qualified form "<resource>.<attribute>"; only check unqualified.
                            if (change.attribute.includes('.'))
                                continue;
                            if (!attrNames.has(change.attribute)) {
                                errors.push({
                                    layer: 'operational',
                                    path: `operations/${operation.name}/changes/${i}/attribute`,
                                    message: `Operation "${operation.name}" change attribute "${change.attribute}" is not declared on ${KIND_LABEL[primitives.byName.get(operation.target).kind]} "${operation.target}"; ${availability('attributes', attrNames)}`,
                                });
                            }
                        }
                    }
                }
            }
            // Trigger references (operation/process/after)
            for (const trigger of op.triggers ?? []) {
                const target = trigger.operation ? `operation:${trigger.operation}` : trigger.process ? `process:${trigger.process}` : '<missing>';
                if (!trigger.operation && !trigger.process) {
                    errors.push({
                        layer: 'operational',
                        path: `triggers/${target}`,
                        message: `Trigger must target either an Operation or a Process; both are missing`,
                    });
                }
                if (trigger.operation && trigger.process) {
                    errors.push({
                        layer: 'operational',
                        path: `triggers/${target}`,
                        message: `Trigger must target either an Operation or a Process, not both`,
                    });
                }
                if (trigger.operation && !operationNames.has(trigger.operation)) {
                    errors.push({
                        layer: 'operational',
                        path: `triggers/${target}/operation`,
                        message: `Trigger fires Operation "${trigger.operation}" which is not declared; ${availability('operations', operationNames)}`,
                    });
                }
                if (trigger.process && !processNames.has(trigger.process)) {
                    errors.push({
                        layer: 'operational',
                        path: `triggers/${target}/process`,
                        message: `Trigger starts Process "${trigger.process}" which is not declared; ${availability('processes', processNames)}`,
                    });
                }
                if (trigger.source === 'operation' && trigger.after && !operationNames.has(trigger.after)) {
                    errors.push({
                        layer: 'operational',
                        path: `triggers/${target}/after`,
                        message: `Trigger waits on upstream Operation "${trigger.after}" which is not declared; ${availability('operations', operationNames)}`,
                    });
                }
            }
            // Rule.operation must reference a declared Operation
            // Rule.allow[].role must reference an actorable primitive (Position or Person)
            for (const rule of op.rules ?? []) {
                const ruleId = rule.name ?? rule.operation;
                if (!operationNames.has(rule.operation)) {
                    errors.push({
                        layer: 'operational',
                        path: `rules/${ruleId}/operation`,
                        message: `Rule "${ruleId}" governs Operation "${rule.operation}" which is not declared; ${availability('operations', operationNames)}`,
                    });
                }
                if (rule.rule_type === 'access') {
                    if (actorablePool.size > 0) {
                        for (const entry of rule.allow ?? []) {
                            if (entry.role && !actorablePool.has(entry.role)) {
                                errors.push({
                                    layer: 'operational',
                                    path: `rules/${ruleId}/allow/role/${entry.role}`,
                                    message: `Rule "${ruleId}" allows actor "${entry.role}" which is not a declared ${actorableKinds}; ${availability('actors', actorablePool)}`,
                                });
                            }
                        }
                    }
                }
            }
            // Noun-level integrity: parent must reference a noun of the same kind
            for (const r of primitives.resources) {
                if (r.parent && !primitives.resourceNames.has(r.parent)) {
                    errors.push({
                        layer: 'operational',
                        path: `resources/${r.name}/parent`,
                        message: `Resource "${r.name}" parent "${r.parent}" is not a declared Resource; ${availability('resources', primitives.resourceNames)}`,
                    });
                }
            }
            for (const p of primitives.persons) {
                if (p.parent && !primitives.personNames.has(p.parent)) {
                    errors.push({
                        layer: 'operational',
                        path: `persons/${p.name}/parent`,
                        message: `Person "${p.name}" parent "${p.parent}" is not a declared Person; ${availability('persons', primitives.personNames)}`,
                    });
                }
                if (p.resource && !primitives.resourceNames.has(p.resource)) {
                    errors.push({
                        layer: 'operational',
                        path: `persons/${p.name}/resource`,
                        message: `Person "${p.name}" resource "${p.resource}" is not a declared Resource; ${availability('resources', primitives.resourceNames)}`,
                    });
                }
            }
            for (const g of primitives.groups) {
                if (g.parent && !primitives.groupNames.has(g.parent)) {
                    errors.push({
                        layer: 'operational',
                        path: `groups/${g.name}/parent`,
                        message: `Group "${g.name}" parent "${g.parent}" is not a declared Group; ${availability('groups', primitives.groupNames)}`,
                    });
                }
            }
            // Position-specific integrity:
            // - scope (string | string[]) → must resolve to a scopeable primitive.
            // - parent → another Position; chain must be acyclic.
            // - resource → a Resource (when system Position is backed by a Resource template).
            // - if both parent and own scope, child scope must be narrower-or-equal to parent's effective scope.
            const positionByName = new Map(primitives.positions.map(r => [r.name, r]));
            const cyclesEmitted = new Set();
            const cycleMembers = new Set();
            for (const role of primitives.positions) {
                const cycle = findCycle(role.name, positionByName);
                if (!cycle)
                    continue;
                for (const m of cycle)
                    cycleMembers.add(m);
                const key = [...cycle].sort().join('|');
                if (cyclesEmitted.has(key))
                    continue;
                cyclesEmitted.add(key);
                errors.push({
                    layer: 'operational',
                    path: `positions/${cycle[0]}/parent`,
                    message: `Position parent chain forms a cycle: ${quoteList(cycle)} (in walk order: ${cycle.map(n => `"${n}"`).join(' → ')})`,
                });
            }
            const effectiveScopeCache = new Map();
            const effectiveScope = (name) => {
                if (cycleMembers.has(name))
                    return null;
                if (effectiveScopeCache.has(name))
                    return effectiveScopeCache.get(name);
                const r = positionByName.get(name);
                if (!r) {
                    effectiveScopeCache.set(name, null);
                    return null;
                }
                if (r.scope !== undefined) {
                    const own = Array.isArray(r.scope) ? r.scope : [r.scope];
                    effectiveScopeCache.set(name, own);
                    return own;
                }
                if (r.parent) {
                    const parentScope = effectiveScope(r.parent);
                    effectiveScopeCache.set(name, parentScope);
                    return parentScope;
                }
                effectiveScopeCache.set(name, []);
                return [];
            };
            for (const role of primitives.positions) {
                if (role.parent && !primitives.positionNames.has(role.parent)) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/parent`,
                        message: `Position "${role.name}" parent "${role.parent}" is not a declared Position; ${availability('positions', primitives.positionNames)}`,
                    });
                }
                const scopes = role.scope === undefined ? [] : Array.isArray(role.scope) ? role.scope : [role.scope];
                for (const s of scopes) {
                    if (!scopeablePool.has(s)) {
                        errors.push({
                            layer: 'operational',
                            path: `positions/${role.name}/scope`,
                            message: `Position "${role.name}" scope "${s}" is not a declared ${scopeableKinds}; ${availability('scopes', scopeablePool)}`,
                        });
                    }
                }
                if (role.resource && !primitives.resourceNames.has(role.resource)) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/resource`,
                        message: `Position "${role.name}" resource "${role.resource}" is not a declared Resource; ${availability('resources', primitives.resourceNames)}`,
                    });
                }
                // Subset check: if both parent (resolved) and own scope present, every entry in the
                // child's scope must be narrower-or-equal to some entry in the parent's effective scope.
                if (role.parent &&
                    primitives.positionNames.has(role.parent) &&
                    !cycleMembers.has(role.name) &&
                    role.scope !== undefined) {
                    const parentScope = effectiveScope(role.parent);
                    if (parentScope !== null && parentScope.length > 0) {
                        for (const childEntry of scopes) {
                            if (!isNarrowerOrEqual(childEntry, parentScope, primitives)) {
                                errors.push({
                                    layer: 'operational',
                                    path: `positions/${role.name}/scope`,
                                    message: `Position "${role.name}" scope "${childEntry}" is not narrower-or-equal to parent Position "${role.parent}" scope ${quoteList(parentScope)}${narrowingHint(childEntry, parentScope, primitives)}`,
                                });
                            }
                        }
                    }
                }
                // Cardinality / required / excludes: modeling-layer constraints on per-scope-instance
                // assignment. The validator checks well-formedness only; runtime systems enforce counts.
                const roleScope = effectiveScope(role.name);
                const roleHasScope = (roleScope ?? []).length > 0;
                if (role.cardinality === 'one' && !roleHasScope) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/cardinality`,
                        message: `Position "${role.name}" declares cardinality "one" but has no declared or inherited scope; per-scope-instance constraints require a scope`,
                    });
                }
                if (role.cardinality !== undefined && role.system === true) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/cardinality`,
                        message: `Position "${role.name}" is a system Position; cardinality does not apply (system Positions are not filled by Persons)`,
                    });
                }
                if (role.required === true && !roleHasScope) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/required`,
                        message: `Position "${role.name}" declares required: true but has no declared or inherited scope; per-scope-instance constraints require a scope`,
                    });
                }
                if (role.required === true && role.system === true) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/required`,
                        message: `Position "${role.name}" is a system Position; required does not apply (system Positions are not filled by Persons)`,
                    });
                }
                for (const e of role.excludes ?? []) {
                    if (e === role.name) {
                        errors.push({
                            layer: 'operational',
                            path: `positions/${role.name}/excludes`,
                            message: `Position "${role.name}" cannot exclude itself`,
                        });
                    }
                    else if (!primitives.positionNames.has(e)) {
                        errors.push({
                            layer: 'operational',
                            path: `positions/${role.name}/excludes`,
                            message: `Position "${role.name}" excludes "${e}" which is not a declared Position; ${availability('positions', primitives.positionNames)}`,
                        });
                    }
                }
                if (role.excludes && role.excludes.length > 0 && role.system === true) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${role.name}/excludes`,
                        message: `Position "${role.name}" is a system Position; excludes does not apply (system Positions are not filled by Persons)`,
                    });
                }
            }
            // Cross-Position exclusion: same-scope check, symmetric, deduped by unordered pair.
            const exclusionPairs = new Set();
            for (const role of primitives.positions) {
                if (role.system === true)
                    continue;
                for (const e of role.excludes ?? []) {
                    if (e === role.name)
                        continue;
                    if (!primitives.positionNames.has(e))
                        continue;
                    const other = positionByName.get(e);
                    if (other.system === true)
                        continue;
                    const [a, b] = [role.name, e].sort();
                    exclusionPairs.add(`${a}|${b}`);
                }
            }
            for (const pairKey of exclusionPairs) {
                const [a, b] = pairKey.split('|');
                const scopeA = effectiveScope(a) ?? [];
                const scopeB = effectiveScope(b) ?? [];
                if (scopeA.length === 0 || scopeB.length === 0)
                    continue;
                const intersect = scopeA.filter(s => scopeB.includes(s));
                if (intersect.length === 0) {
                    errors.push({
                        layer: 'operational',
                        path: `positions/${a}/excludes`,
                        message: `Position "${a}" excludes "${b}" but their effective scopes are disjoint (${a}: ${quoteList(scopeA)}; ${b}: ${quoteList(scopeB)}); exclusion requires a shared scope`,
                    });
                }
            }
            // Membership integrity: person/position/group references; group must match Position.scope when both present
            for (const m of op.memberships ?? []) {
                if (!primitives.personNames.has(m.person)) {
                    errors.push({
                        layer: 'operational',
                        path: `memberships/${m.name}/person`,
                        message: `Membership "${m.name}" pins Person "${m.person}" which is not declared; ${availability('persons', primitives.personNames)}`,
                    });
                }
                if (!primitives.hasCharacteristic(m.position, 'memberable')) {
                    errors.push({
                        layer: 'operational',
                        path: `memberships/${m.name}/position`,
                        message: `Membership "${m.name}" pins Position "${m.position}" which is not declared; ${availability('positions', primitives.positionNames)}`,
                    });
                }
                if (m.group && !scopeablePool.has(m.group)) {
                    errors.push({
                        layer: 'operational',
                        path: `memberships/${m.name}/group`,
                        message: `Membership "${m.name}" group "${m.group}" is not a declared ${scopeableKinds}; ${availability('scopes', scopeablePool)}`,
                    });
                }
                if (m.group && primitives.positionNames.has(m.position)) {
                    const role = primitives.positions.find(r => r.name === m.position);
                    const scopes = role.scope === undefined ? [] : Array.isArray(role.scope) ? role.scope : [role.scope];
                    if (scopes.length > 0 && !scopes.includes(m.group)) {
                        errors.push({
                            layer: 'operational',
                            path: `memberships/${m.name}/group`,
                            message: `Membership "${m.name}" pins Position "${m.position}" in group "${m.group}", but Position "${m.position}" declares scope ${quoteList(scopes)}`,
                        });
                    }
                }
                // Multi-scope ambiguity: Position with array scope requires Membership.group
                if (!m.group && primitives.positionNames.has(m.position)) {
                    const role = primitives.positions.find(r => r.name === m.position);
                    if (Array.isArray(role.scope) && role.scope.length > 1) {
                        errors.push({
                            layer: 'operational',
                            path: `memberships/${m.name}/group`,
                            message: `Membership "${m.name}" pins multi-scope Position "${m.position}" (scopes: ${quoteList(role.scope)}) without a group; specify Membership.group to disambiguate`,
                        });
                    }
                }
            }
            void membershipNames;
            // Relationship validation: from/to must reference any noun, attribute must exist on "from"
            for (const rel of op.relationships ?? []) {
                if (!primitives.allNounNames.has(rel.from)) {
                    errors.push({
                        layer: 'operational',
                        path: `relationships/${rel.name}/from`,
                        message: `Relationship "${rel.name}" (from) "${rel.from}" is not a declared noun; ${availability('nouns', primitives.allNounNames)}`,
                    });
                }
                if (!primitives.allNounNames.has(rel.to)) {
                    errors.push({
                        layer: 'operational',
                        path: `relationships/${rel.name}/to`,
                        message: `Relationship "${rel.name}" (to) "${rel.to}" is not a declared noun; ${availability('nouns', primitives.allNounNames)}`,
                    });
                }
                if (primitives.allNounNames.has(rel.from)) {
                    const fromNoun = primitives.byName.get(rel.from).noun;
                    const attrNames = new Set((fromNoun.attributes ?? []).map(a => a.name));
                    if (!attrNames.has(rel.attribute)) {
                        errors.push({
                            layer: 'operational',
                            path: `relationships/${rel.name}/attribute`,
                            message: `Relationship "${rel.name}" Attribute "${rel.attribute}" is not declared on "${rel.from}"; ${availability('attributes', attrNames)}`,
                        });
                    }
                }
            }
            // Task.actor must reference an actorable primitive (Role or Person).
            // Task.operation must reference a declared Operation.
            for (const task of op.tasks ?? []) {
                if (actorablePool.size > 0 && !actorablePool.has(task.actor)) {
                    errors.push({
                        layer: 'operational',
                        path: `tasks/${task.name}/actor`,
                        message: `Task "${task.name}" actor "${task.actor}" is not a declared ${actorableKinds}; ${availability('actors', actorablePool)}`,
                    });
                }
                if (!operationNames.has(task.operation)) {
                    errors.push({
                        layer: 'operational',
                        path: `tasks/${task.name}/operation`,
                        message: `Task "${task.name}" operation "${task.operation}" is not declared; ${availability('operations', operationNames)}`,
                    });
                }
            }
            // Process.operator must reference an actorable primitive.
            // Process.startStep must be a defined Step id.
            // Process.steps[].task must reference a declared Task.
            for (const proc of op.processes ?? []) {
                if (actorablePool.size > 0 && !actorablePool.has(proc.operator)) {
                    errors.push({
                        layer: 'operational',
                        path: `processes/${proc.name}/operator`,
                        message: `Process "${proc.name}" operator "${proc.operator}" is not a declared ${actorableKinds}; ${availability('actors', actorablePool)}`,
                    });
                }
                const stepIds = new Set((proc.steps ?? []).map(s => s.id));
                if (!stepIds.has(proc.startStep)) {
                    errors.push({
                        layer: 'operational',
                        path: `processes/${proc.name}/startStep`,
                        message: `Process "${proc.name}" startStep "${proc.startStep}" is not a defined Step; ${availability('steps', stepIds)}`,
                    });
                }
                for (const step of proc.steps ?? []) {
                    if (!taskNames.has(step.task)) {
                        errors.push({
                            layer: 'operational',
                            path: `processes/${proc.name}/steps/${step.id}/task`,
                            message: `Process "${proc.name}" Step "${step.id}" task "${step.task}" is not a declared Task; ${availability('tasks', taskNames)}`,
                        });
                    }
                    for (const dep of step.depends_on ?? []) {
                        if (!stepIds.has(dep)) {
                            errors.push({
                                layer: 'operational',
                                path: `processes/${proc.name}/steps/${step.id}/depends_on/${dep}`,
                                message: `Process "${proc.name}" Step "${step.id}" depends_on "${dep}" which is not a sibling Step; ${availability('steps', stepIds)}`,
                            });
                        }
                    }
                    for (const cond of step.conditions ?? []) {
                        if (ruleNames.size > 0 && !ruleNames.has(cond)) {
                            errors.push({
                                layer: 'operational',
                                path: `processes/${proc.name}/steps/${step.id}/conditions/${cond}`,
                                message: `Process "${proc.name}" Step "${step.id}" condition "${cond}" is not a named Rule; ${availability('rules', ruleNames)}`,
                            });
                        }
                    }
                    if (step.else && step.else !== 'abort' && !stepIds.has(step.else)) {
                        errors.push({
                            layer: 'operational',
                            path: `processes/${proc.name}/steps/${step.id}/else`,
                            message: `Process "${proc.name}" Step "${step.id}" else "${step.else}" must be "abort" or a sibling Step; ${availability('steps', stepIds)}`,
                        });
                    }
                }
            }
        }
        // ── Operational → Product Core (materializer consistency) ──────────────
        // If both are present, every Resource/Operation in product.core must also
        // exist in operational — product core is a projection, never invents.
        if (op && core) {
            const opPrimitives = this.collectPrimitives(op);
            const opOperationNames = new Set((op.operations ?? []).map(o => o.name));
            for (const resource of core.resources ?? []) {
                if (!opPrimitives.resourceNames.has(resource.name)) {
                    errors.push({
                        layer: 'product/core',
                        path: `resources/${resource.name}`,
                        message: `Product Core Resource "${resource.name}" is not present in Operational DNA; re-run the materializer`,
                    });
                }
            }
            for (const op2 of core.operations ?? []) {
                if (!opOperationNames.has(op2.name)) {
                    errors.push({
                        layer: 'product/core',
                        path: `operations/${op2.name}`,
                        message: `Product Core Operation "${op2.name}" is not present in Operational DNA; re-run the materializer`,
                    });
                }
            }
        }
        // ── Product API → Product Core (preferred) or Operational (fallback) ───
        if ((core || op) && api) {
            const resources = core
                ? (core.resources ?? [])
                : this.collectPrimitives(op).resources;
            const resourceNames = new Set(resources.map(r => r.name));
            const operations = core ? core.operations : op.operations;
            const operationNames = new Set((operations ?? []).map(o => o.name));
            const referenceLayer = core ? 'product/core' : 'operational';
            const upstreamLabel = referenceLayer === 'product/core' ? 'Product Core' : 'Operational';
            // Resource → Operational Resource cross-layer reference
            for (const resource of api.resources ?? []) {
                if (resource.resource && !resourceNames.has(resource.resource)) {
                    errors.push({
                        layer: 'product/api',
                        path: `resources/${resource.name}/resource`,
                        message: `API Resource "${resource.name}" references Resource "${resource.resource}" which is not declared in ${upstreamLabel} DNA; ${availability('resources', resourceNames)}`,
                    });
                }
                // Action → Operational Action cross-layer reference
                if (resource.resource && resourceNames.has(resource.resource)) {
                    const opResource = resources.find(r => r.name === resource.resource);
                    const actionNames = new Set((opResource?.actions ?? []).map(a => a.name));
                    for (const action of resource.actions ?? []) {
                        if (action.action && !actionNames.has(action.action)) {
                            errors.push({
                                layer: 'product/api',
                                path: `resources/${resource.name}/actions/${action.name}/action`,
                                message: `API Action "${action.name}" on Resource "${resource.name}" maps to Action "${action.action}" which is not declared on Resource "${resource.resource}"; ${availability('actions', actionNames)}`,
                            });
                        }
                    }
                }
            }
            // Operation cross-layer reference (the API operation's name must match an upstream Operation)
            for (const operation of api.operations ?? []) {
                if (operation.name && !operationNames.has(operation.name)) {
                    errors.push({
                        layer: 'product/api',
                        path: `operations/${operation.name}`,
                        message: `API Operation "${operation.name}" is not present in ${upstreamLabel} DNA; ${availability('operations', operationNames)}`,
                    });
                }
            }
            // Endpoint operation references
            const apiOperationNames = new Set((api.operations ?? []).map(o => o.name));
            for (const endpoint of api.endpoints ?? []) {
                if (endpoint.operation && !apiOperationNames.has(endpoint.operation)) {
                    errors.push({
                        layer: 'product/api',
                        path: `endpoints/${endpoint.operation}/operation`,
                        message: `Endpoint serves Operation "${endpoint.operation}" which is not defined in API operations; ${availability('operations', apiOperationNames)}`,
                    });
                }
            }
        }
        // ── Product UI → Product API ───────────────────────────────────────────
        if (api && ui) {
            const resourceNames = new Set((api.resources ?? []).map(r => r.name));
            const operationNames = new Set((api.operations ?? []).map(o => o.name));
            // Page resource references
            for (const page of ui.pages ?? []) {
                if (page.resource && !resourceNames.has(page.resource)) {
                    errors.push({
                        layer: 'product/ui',
                        path: `pages/${page.name}/resource`,
                        message: `Page "${page.name}" binds Resource "${page.resource}" which is not declared in Product API DNA; ${availability('resources', resourceNames)}`,
                    });
                }
                // Block operation references
                for (const block of page.blocks ?? []) {
                    if (block.operation && !operationNames.has(block.operation)) {
                        errors.push({
                            layer: 'product/ui',
                            path: `pages/${page.name}/blocks/${block.name}/operation`,
                            message: `Page "${page.name}" Block "${block.name}" calls Operation "${block.operation}" which is not declared in Product API DNA; ${availability('operations', operationNames)}`,
                        });
                    }
                }
            }
            // Route page references
            const pageNames = new Set((ui.pages ?? []).map(p => p.name));
            for (const route of ui.routes ?? []) {
                if (route.page && !pageNames.has(route.page)) {
                    errors.push({
                        layer: 'product/ui',
                        path: `routes/${route.page}/page`,
                        message: `Route serves Page "${route.page}" which is not defined; ${availability('pages', pageNames)}`,
                    });
                }
            }
        }
        // ── Technical → Product/Operational ────────────────────────────────────
        if (tech) {
            const providerNames = new Set((tech.providers ?? []).map(p => p.name));
            const constructNames = new Set((tech.constructs ?? []).map(c => c.name));
            // Construct provider references
            for (const construct of tech.constructs ?? []) {
                if (construct.provider && !providerNames.has(construct.provider)) {
                    errors.push({
                        layer: 'technical',
                        path: `constructs/${construct.name}/provider`,
                        message: `Construct "${construct.name}" runs on Provider "${construct.provider}" which is not declared; ${availability('providers', providerNames)}`,
                    });
                }
            }
            // Cell construct references
            for (const cell of tech.cells ?? []) {
                for (const constructRef of cell.constructs ?? []) {
                    if (!constructNames.has(constructRef)) {
                        errors.push({
                            layer: 'technical',
                            path: `cells/${cell.name}/constructs/${constructRef}`,
                            message: `Cell "${cell.name}" uses Construct "${constructRef}" which is not declared; ${availability('constructs', constructNames)}`,
                        });
                    }
                }
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
exports.DnaValidator = DnaValidator;
//# sourceMappingURL=validator.js.map