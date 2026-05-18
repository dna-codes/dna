"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOperations = renderOperations;
const util_1 = require("../util");
function renderOperations(dna, h) {
    const op = dna.operational;
    if (!op?.operations?.length)
        return null;
    const triggersByOp = groupBy(op.triggers ?? [], (t) => t.operation ?? '');
    const rulesByOp = groupBy(op.rules ?? [], (r) => r.operation);
    const lines = [`${(0, util_1.hashes)(h)} Operations`];
    for (const operation of op.operations) {
        lines.push('', `${(0, util_1.hashes)(h + 1)} ${operation.name}`);
        if (operation.description)
            lines.push('', operation.description);
        const triggers = triggersByOp.get(operation.name) ?? [];
        if (triggers.length) {
            lines.push('', '**Triggered by:**');
            for (const t of triggers) {
                const desc = t.description ? ` (${t.description})` : '';
                lines.push(`- ${t.source}${desc}`);
            }
        }
        const rules = rulesByOp.get(operation.name) ?? [];
        if (rules.length) {
            lines.push('', '**Rules:**');
            for (const r of rules)
                lines.push(`- ${renderRule(r)}`);
        }
        const changes = operation.changes ?? [];
        if (changes.length) {
            lines.push('', '**Changes:**');
            for (const c of changes) {
                const set = c.set === undefined ? '' : ` → \`${JSON.stringify(c.set)}\``;
                lines.push(`- Sets \`${c.attribute}\`${set}`);
            }
        }
    }
    return lines.join('\n');
}
function renderRule(r) {
    if (r.rule_type === 'access')
        return `*Access:* ${renderAllow(r.allow ?? [])}`;
    if (r.rule_type === 'condition') {
        const parts = (r.conditions ?? []).map((c) => {
            const v = c.value === undefined ? '' : ` ${JSON.stringify(c.value)}`;
            return `\`${c.attribute}\` ${c.operator}${v}`;
        });
        const expr = parts.length ? parts.join(' AND ') : (r.description ?? '—');
        return `*Condition:* ${expr}`;
    }
    return r.description ?? r.name ?? '—';
}
function renderAllow(allow) {
    if (!allow.length)
        return '—';
    return allow
        .map((a) => {
        const parts = [];
        if (a.role)
            parts.push(`role \`${a.role}\``);
        if (a.ownership)
            parts.push(`ownership`);
        if (a.flags?.length)
            parts.push(`flags \`[${a.flags.join(', ')}]\``);
        return parts.join(' + ') || '—';
    })
        .join(' OR ');
}
function groupBy(arr, key) {
    const out = new Map();
    for (const x of arr) {
        const k = key(x);
        if (!out.has(k))
            out.set(k, []);
        out.get(k).push(x);
    }
    return out;
}
//# sourceMappingURL=operations.js.map