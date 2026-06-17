"use strict";
/**
 * Derive a Domain's `path` cache from the authoritative `parent` chain.
 *
 * Per the home-edge model (`grouping-model` doctrine), `path` is a derived
 * cache of the parent chain, never an authoritative field. This helper
 * regenerates it: it walks from the named domain up through `parent` links to
 * the rootless tenant, then joins the names root→leaf with `.`.
 *
 * - Any authored `path` on the domains is ignored — the chain governs.
 * - A cycle (or a `parent` that names a missing domain) is treated as the end
 *   of the chain, so the function always terminates and returns a best-effort
 *   path rather than throwing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.derivePath = derivePath;
/**
 * Compute the dot-separated path for `name` from the `parent` chain across
 * `domains`. Returns `name` alone when it has no parent (the tenant root), and
 * `''` when `name` is not among `domains`.
 */
function derivePath(name, domains) {
    const byName = new Map();
    for (const d of domains)
        if (d && typeof d.name === 'string')
            byName.set(d.name, d);
    if (!byName.has(name))
        return '';
    const segments = [];
    const seen = new Set();
    let current = name;
    while (current && byName.has(current) && !seen.has(current)) {
        seen.add(current);
        segments.unshift(current);
        current = byName.get(current).parent;
    }
    return segments.join('.');
}
//# sourceMappingURL=path.js.map