"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = Operation;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const provider_1 = require("./provider");
function Operation({ name, children, fallback = null, loading: loadingNode = null }) {
    const ctx = (0, provider_1.useDnaContext)();
    const [flagEnabled, setFlagEnabled] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const result = ctx.resolveFlag(name);
        if (typeof result === 'boolean') {
            setFlagEnabled(result);
        }
        else {
            result.then(setFlagEnabled);
        }
    }, [name, ctx]);
    // Still resolving roles or flags
    if (ctx.loading || flagEnabled === null)
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: loadingNode });
    const permitted = ctx.permitted(name);
    if (!permitted || !flagEnabled)
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: fallback });
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}
//# sourceMappingURL=operation.js.map