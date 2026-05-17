"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderOperations = renderOperations;
const util_1 = require("../util");
function renderOperations(dna, h) {
    const op = dna.operational;
    if (!op?.operations?.length)
        return null;
    const triggersByOp = (0, util_1.groupBy)(op.triggers ?? [], (t) => t.operation ?? '');
    const rulesByOp = (0, util_1.groupBy)(op.rules ?? [], (r) => r.operation);
    const parts = [(0, util_1.heading)(h, 'Operations')];
    for (const operation of op.operations) {
        const inner = [(0, util_1.heading)(h + 1, (0, util_1.escape)(operation.name))];
        if (operation.description)
            inner.push(`<p>${(0, util_1.escape)(operation.description)}</p>`);
        const triggers = triggersByOp.get(operation.name) ?? [];
        if (triggers.length) {
            const items = triggers
                .map((t) => {
                const desc = t.description ? ` (${(0, util_1.escape)(t.description)})` : '';
                return `<li>${(0, util_1.escape)(t.source)}${desc}</li>`;
            })
                .join('');
            inner.push(`<p><strong>Triggered by:</strong></p><ul>${items}</ul>`);
        }
        const rules = rulesByOp.get(operation.name) ?? [];
        if (rules.length) {
            const items = rules.map((r) => `<li>${renderRule(r)}</li>`).join('');
            inner.push(`<p><strong>Rules:</strong></p><ul>${items}</ul>`);
        }
        const changes = operation.changes ?? [];
        if (changes.length) {
            const lines = changes.map((c) => {
                const set = c.set === undefined ? '' : ` → ${(0, util_1.code)(JSON.stringify(c.set))}`;
                return `<li>Sets ${(0, util_1.code)(c.attribute)}${set}</li>`;
            });
            inner.push(`<p><strong>Changes:</strong></p><ul>${lines.join('')}</ul>`);
        }
        parts.push(`<section>${inner.join('')}</section>`);
    }
    return `<section>${parts.join('')}</section>`;
}
function renderRule(r) {
    if (r.subtype === 'access')
        return `<em>Access:</em> ${renderAllow(r.allow ?? [])}`;
    if (r.subtype === 'condition') {
        const parts = (r.conditions ?? []).map((c) => {
            const v = c.value === undefined ? '' : ` ${(0, util_1.code)(JSON.stringify(c.value))}`;
            return `${(0, util_1.code)(c.attribute)} ${(0, util_1.escape)(c.operator)}${v}`;
        });
        const expr = parts.length ? parts.join(' AND ') : (0, util_1.escape)(r.description ?? '—');
        return `<em>Condition:</em> ${expr}`;
    }
    return (0, util_1.escape)(r.description ?? r.name ?? '—');
}
function renderAllow(allow) {
    if (!allow.length)
        return '—';
    return allow
        .map((a) => {
        const parts = [];
        if (a.role)
            parts.push(`role ${(0, util_1.code)(a.role)}`);
        if (a.ownership)
            parts.push(`ownership`);
        if (a.flags?.length)
            parts.push(`flags ${(0, util_1.code)(`[${a.flags.join(', ')}]`)}`);
        return parts.join(' + ') || '—';
    })
        .join(' OR ');
}
//# sourceMappingURL=operations.js.map