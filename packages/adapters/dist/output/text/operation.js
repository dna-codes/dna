"use strict";
/**
 * Render a single Operation as prose, styled three ways:
 *
 *   - user-story   As a / I want / So that + triggers + acceptance criteria
 *   - gherkin      Feature / Scenario / Given / When / Then
 *   - product-dna  Actor / Resource / Action / Trigger / Preconditions / Postconditions
 *
 * Each helper returns the body only; the title is stable across styles and
 * produced by `operationTitle`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationTitle = operationTitle;
exports.renderOperation = renderOperation;
const util_1 = require("./util");
function operationTitle(op) {
    return `${(0, util_1.pascalToWords)(op.action)} ${(0, util_1.pascalToWords)(op.resource)}`.trim();
}
function renderOperation(op, dna, style) {
    if (style === 'gherkin')
        return renderGherkin(op, dna);
    if (style === 'product-dna')
        return renderProductDna(op, dna);
    return renderUserStory(op, dna);
}
// ---------------------------------------------------------------------------
// user-story
// ---------------------------------------------------------------------------
function renderUserStory(op, dna) {
    const { rules, triggers, roles } = collect(op, dna);
    const parts = [];
    if (op.description)
        parts.push(op.description);
    const role = roles[0] ?? 'user';
    const action = (0, util_1.pascalToWords)(op.action).toLowerCase();
    const resource = (0, util_1.pascalToWords)(op.resource).toLowerCase();
    parts.push(`**As a** ${role}\n**I want to** ${action} a ${resource}\n**So that** the business outcome of \`${op.name}\` is achieved.`);
    const triggerList = renderTriggerList(triggers);
    if (triggerList)
        parts.push(`**Triggered by:**\n${triggerList}`);
    const criteria = renderCriteriaList(rules, op.changes ?? []);
    if (criteria)
        parts.push(`**Acceptance criteria:**\n${criteria}`);
    return parts.join('\n\n');
}
// ---------------------------------------------------------------------------
// gherkin
// ---------------------------------------------------------------------------
function renderGherkin(op, dna) {
    const { rules, triggers, roles } = collect(op, dna);
    const actor = roles[0] ?? 'user';
    const action = (0, util_1.pascalToWords)(op.action).toLowerCase();
    const resource = (0, util_1.pascalToWords)(op.resource).toLowerCase();
    const lines = [];
    lines.push(`Feature: ${operationTitle(op)}`);
    if (op.description)
        lines.push(`  ${op.description}`);
    lines.push('');
    lines.push(`  Scenario: ${actor} ${action}s a ${resource}`);
    const conditionRules = rules.filter((r) => r.subtype === 'condition');
    if (triggers.length || conditionRules.length || roles.length) {
        const givens = [];
        if (roles.length)
            givens.push(`an actor with role \`${roles.join('`, `')}\``);
        for (const t of triggers) {
            if (t.source === 'schedule')
                givens.push('a scheduled trigger fires');
            else if (t.source === 'webhook')
                givens.push('an inbound webhook is received');
            else if (t.source === 'operation')
                givens.push(`operation \`${t.after ?? 'previous'}\` has completed`);
        }
        for (const r of conditionRules)
            givens.push(conditionPhrase(r));
        for (let i = 0; i < givens.length; i++) {
            lines.push(`    ${i === 0 ? 'Given' : 'And'} ${givens[i]}`);
        }
    }
    lines.push(`    When they ${action} the ${resource}`);
    const thens = changeLines(op.changes ?? []);
    if (thens.length === 0) {
        lines.push(`    Then the operation \`${op.name}\` succeeds`);
    }
    else {
        for (let i = 0; i < thens.length; i++) {
            lines.push(`    ${i === 0 ? 'Then' : 'And'} ${thens[i]}`);
        }
    }
    return lines.join('\n');
}
// ---------------------------------------------------------------------------
// product-dna
// ---------------------------------------------------------------------------
function renderProductDna(op, dna) {
    const { rules, triggers, roles } = collect(op, dna);
    const parts = [];
    if (op.description)
        parts.push(op.description);
    const kv = [];
    kv.push(`**Resource:** \`${op.resource}\``);
    kv.push(`**Action:** \`${op.action}\``);
    if (roles.length)
        kv.push(`**Actor:** ${roles.map((r) => `\`${r}\``).join(', ')}`);
    if (triggers.length)
        kv.push(`**Trigger:** ${triggers.map((t) => t.source).join(', ')}`);
    parts.push(kv.join('\n'));
    const preconditions = rules
        .filter((r) => r.subtype === 'condition')
        .map((r) => `- ${conditionPhrase(r)}`);
    if (preconditions.length)
        parts.push(`**Preconditions:**\n${preconditions.join('\n')}`);
    const postconditions = changeLines(op.changes ?? []).map((l) => `- ${l}`);
    if (postconditions.length)
        parts.push(`**Postconditions:**\n${postconditions.join('\n')}`);
    return parts.join('\n\n');
}
// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function collect(op, dna) {
    const rules = (0, util_1.groupBy)(dna.rules ?? [], (r) => r.operation).get(op.name) ?? [];
    const triggers = (0, util_1.groupBy)(dna.triggers ?? [], (t) => t.operation ?? '').get(op.name) ?? [];
    const roles = [];
    for (const r of rules) {
        if (r.subtype !== 'access')
            continue;
        for (const a of r.allow ?? [])
            if (a.role && !roles.includes(a.role))
                roles.push(a.role);
    }
    return { rules, triggers, roles };
}
function renderTriggerList(triggers) {
    if (!triggers.length)
        return null;
    return triggers
        .map((t) => {
        const desc = t.description ? ` (${t.description})` : '';
        return `- ${t.source}${desc}`;
    })
        .join('\n');
}
function renderCriteriaList(rules, changes) {
    const lines = [];
    for (const r of rules) {
        if (r.subtype === 'condition')
            lines.push(`- Only when ${conditionPhrase(r)}`);
        else if (r.subtype === 'access') {
            const allowed = renderAllow(r.allow ?? []);
            if (allowed)
                lines.push(`- Restricted to ${allowed}`);
        }
        else if (r.description)
            lines.push(`- ${r.description}`);
    }
    lines.push(...changeLines(changes).map((l) => `- ${l}`));
    return lines.length ? lines.join('\n') : null;
}
function changeLines(changes) {
    const lines = [];
    for (const c of changes) {
        const set = c.set === undefined ? '' : ` to \`${JSON.stringify(c.set)}\``;
        lines.push(`Sets \`${c.attribute}\`${set}`);
    }
    return lines;
}
function conditionPhrase(r) {
    if (r.conditions?.length) {
        return r.conditions
            .map((c) => {
            const v = c.value === undefined ? '' : ` ${JSON.stringify(c.value)}`;
            return `\`${c.attribute}\` ${c.operator}${v}`;
        })
            .join(' AND ');
    }
    return r.description ?? r.name ?? 'a condition is met';
}
function renderAllow(allow) {
    if (!allow.length)
        return '';
    return allow
        .map((a) => {
        const parts = [];
        if (a.role)
            parts.push(`role \`${a.role}\``);
        if (a.ownership)
            parts.push(`ownership`);
        if (a.flags?.length)
            parts.push(`flags \`[${a.flags.join(', ')}]\``);
        return parts.join(' + ');
    })
        .filter(Boolean)
        .join(' or ');
}
//# sourceMappingURL=operation.js.map