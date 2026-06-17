"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = Surface;
const jsx_runtime_1 = require("react/jsx-runtime");
const provider_1 = require("./provider");
/**
 * The **coarse** product-UI gate. `<Surface>` renders its children only when
 * the current user can `can_access` the structural surface `id` (resolved
 * against the `access` snapshot on `<DnaProvider>`, cascading down `contains`).
 * An unreachable surface is not rendered at all — distinct from `<Operation>`,
 * the **fine** gate that disables individual controls *within* a rendered
 * surface. Both grains compose: nest `<Operation>` inside `<Surface>`.
 */
function Surface({ id, children, fallback = null, loading: loadingNode = null }) {
    const ctx = (0, provider_1.useDnaContext)();
    // Still resolving roles/access.
    if (ctx.loading)
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: loadingNode });
    if (!ctx.reachable(id))
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fallback });
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}
//# sourceMappingURL=surface.js.map