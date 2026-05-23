"use strict";
/**
 * Operation-mutation resolver.
 *
 * v1 behavior: forwards to `store.instance.update(target, id, input)` and
 * re-reads the record. Operation `changes[]` semantics (state-machine
 * enforcement) and Rule enforcement are deferred to a follow-on
 * proposal — see design.md D3.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOperationResolver = makeOperationResolver;
function makeOperationResolver({ dataStore, targetType, }) {
    return async (_parent, args) => {
        const { id, input } = args;
        const sid = String(id);
        await dataStore.instance.update(targetType, sid, input ?? {});
        return dataStore.instance.get(targetType, sid);
    };
}
//# sourceMappingURL=operations.js.map