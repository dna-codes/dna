"use strict";
/**
 * Pure operational→product **Permission** projection (governance).
 *
 * Derives reified product Permissions (and `grants` edges) from operational
 * Memberships + access Rules — the org→app authorization causal chain:
 *
 *   Membership(person → position → group)  --grants-->  Permission{principal, role, scope}
 *
 * Derivation rule (the "Atlas rule"): a Membership yields a Permission when its
 * Position is named by an access Rule (i.e. the Position can actually do
 * something in the app). The Permission's `principal` projects the Person, its
 * `role` projects the Position, and its `scope` is a namespaced entity reference
 * resolving to the Group. When the scope cannot be resolved (a multi-scope
 * Position with no disambiguating Group) the Permission is emitted `planned`
 * with no `grants` edge — never invented.
 *
 * Derive-first / author-fallback: this function derives only. Reconciliation of
 * a derived Permission onto a hand-authored one of the same `{principal, role,
 * scope}` identity happens at apply time (`applyPermissions`).
 *
 * Pure — writes nothing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionKey = permissionKey;
exports.projectPermissions = projectPermissions;
const GLOBAL_SCOPE = '*';
function permissionKey(principal, role, scope) {
    return `${principal}::${role}::${scope}`;
}
function projectPermissions(op) {
    const positions = new Map((op.positions ?? []).map((p) => [p.name, p]));
    // Positions that an access Rule actually empowers (named in allow[].role).
    const empowered = new Set();
    for (const rule of op.rules ?? []) {
        if ((rule.rule_type ?? rule.type) !== 'access')
            continue;
        for (const entry of rule.allow ?? []) {
            if (entry.role)
                empowered.add(entry.role);
        }
    }
    const byKey = new Map();
    const grants = [];
    for (const m of op.memberships ?? []) {
        // Only Memberships whose Position can do something in the app yield a Permission.
        if (!empowered.has(m.position))
            continue;
        const { scope, resolved } = resolveScope(m, positions.get(m.position));
        const key = permissionKey(m.person, m.position, scope);
        if (!byKey.has(key)) {
            byKey.set(key, {
                key,
                principal: m.person,
                role: m.position,
                scope,
                planned: !resolved,
                backingMembership: m.name,
            });
        }
        // A resolvable Membership grants its Permission; a planned one does not.
        if (resolved)
            grants.push({ from: m.name, to: key, via: 'grants' });
    }
    return { permissions: [...byKey.values()], grants };
}
/** Resolve a Membership's scope to a namespaced entity reference, or mark it unresolved. */
function resolveScope(m, position) {
    if (m.group)
        return { scope: m.group, resolved: true };
    const s = position?.scope;
    if (typeof s === 'string')
        return { scope: s, resolved: true };
    if (Array.isArray(s)) {
        if (s.length === 1)
            return { scope: s[0], resolved: true };
        // Multi-scope Position with no disambiguating Group → under-determined.
        return { scope: '', resolved: false };
    }
    // No scope declared → a global Position.
    return { scope: GLOBAL_SCOPE, resolved: true };
}
//# sourceMappingURL=permissions.js.map