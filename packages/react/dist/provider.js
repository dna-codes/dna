"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDnaContext = useDnaContext;
exports.DnaProvider = DnaProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const DnaContext = (0, react_1.createContext)(null);
function useDnaContext() {
    const ctx = (0, react_1.useContext)(DnaContext);
    if (!ctx)
        throw new Error('useOperation must be called inside a <DnaProvider>');
    return ctx;
}
// Inlined to avoid importing @dna-codes/dna-core's Node.js entry point (fs/path)
// in the browser bundle. The logic mirrors getRulesForOperation + the access check.
function checkPermitted(dna, opName, roles) {
    const allRules = dna.rules ?? [];
    const accessRules = allRules.filter(r => r['operation'] === opName && r['rule_type'] === 'access' && Array.isArray(r['allow']));
    if (accessRules.length === 0)
        return true;
    return accessRules.some(rule => rule['allow'].some(entry => entry.role && roles.includes(entry.role)));
}
function DnaProvider({ dna, userId, children, roles: rolesProp, resolveRoles, store, onAudit, flags, }) {
    const [resolvedRoles, setResolvedRoles] = (0, react_1.useState)(rolesProp !== undefined ? rolesProp : null);
    const [loading, setLoading] = (0, react_1.useState)(rolesProp === undefined);
    // Keep onAudit stable in a ref so perform() always uses the latest without re-memoising
    const onAuditRef = (0, react_1.useRef)(onAudit);
    onAuditRef.current = onAudit;
    (0, react_1.useEffect)(() => {
        if (rolesProp !== undefined) {
            setResolvedRoles(rolesProp);
            setLoading(false);
            return;
        }
        let cancelled = false;
        async function resolve() {
            let roles = [];
            if (resolveRoles) {
                roles = await resolveRoles(userId);
            }
            else if (store) {
                const links = await store.link.list({ from: { typeName: 'User', id: userId } });
                roles = links.map(l => l.to.typeName);
            }
            if (!cancelled) {
                setResolvedRoles(roles);
                setLoading(false);
            }
        }
        resolve();
        return () => { cancelled = true; };
    }, [userId, rolesProp, resolveRoles, store]);
    // Per-operation flag cache; lives for the provider's lifetime
    const flagCache = (0, react_1.useRef)(new Map());
    function resolveFlag(opName) {
        if (!flags)
            return true;
        const cached = flagCache.current.get(opName);
        if (cached !== undefined)
            return cached;
        const result = flags(opName);
        if (typeof result === 'boolean') {
            flagCache.current.set(opName, result);
            return result;
        }
        return result.then(v => {
            flagCache.current.set(opName, v);
            return v;
        });
    }
    const permitted = (0, react_1.useMemo)(() => (opName) => {
        if (loading || resolvedRoles === null)
            return false;
        return checkPermitted(dna, opName, resolvedRoles);
    }, [dna, resolvedRoles, loading]);
    async function perform(opName, payload) {
        const roles = resolvedRoles ?? [];
        const isPermitted = checkPermitted(dna, opName, roles);
        const dotIdx = opName.lastIndexOf('.');
        const resource = dotIdx >= 0 ? opName.slice(0, dotIdx) : opName;
        const action = dotIdx >= 0 ? opName.slice(dotIdx + 1) : '';
        const event = {
            operation: opName,
            resource,
            action,
            userId,
            timestamp: new Date().toISOString(),
            permitted: isPermitted,
            payload,
        };
        if (onAuditRef.current) {
            try {
                await onAuditRef.current(event);
            }
            catch { /* fire-and-forget */ }
        }
        return { permitted: isPermitted };
    }
    const value = (0, react_1.useMemo)(() => ({ permitted, perform, loading, resolveFlag }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permitted, loading]);
    return (0, jsx_runtime_1.jsx)(DnaContext.Provider, { value: value, children: children });
}
//# sourceMappingURL=provider.js.map