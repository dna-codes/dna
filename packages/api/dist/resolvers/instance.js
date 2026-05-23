"use strict";
/**
 * Instance-CRUD resolvers. Every function returns a GraphQL resolver
 * that closes over an injected `DnaDataStore`. No store imports outside
 * this module's factory functions — the schema composer wires the
 * dependency in one place.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetResolver = makeGetResolver;
exports.makeListResolver = makeListResolver;
exports.makeCreateResolver = makeCreateResolver;
exports.makeUpdateResolver = makeUpdateResolver;
exports.makeDeleteResolver = makeDeleteResolver;
function makeGetResolver({ dataStore, typeName }) {
    return async (_parent, args) => {
        const id = String(args.id);
        return dataStore.instance.get(typeName, id);
    };
}
function makeListResolver({ dataStore, typeName }) {
    return async () => {
        return dataStore.instance.list(typeName);
    };
}
function makeCreateResolver({ dataStore, typeName }) {
    return async (_parent, args) => {
        const input = args.input ?? {};
        const { id } = await dataStore.instance.create(typeName, input);
        return dataStore.instance.get(typeName, id);
    };
}
function makeUpdateResolver({ dataStore, typeName }) {
    return async (_parent, args) => {
        const { id, input } = args;
        const sid = String(id);
        await dataStore.instance.update(typeName, sid, input ?? {});
        return dataStore.instance.get(typeName, sid);
    };
}
function makeDeleteResolver({ dataStore, typeName }) {
    return async (_parent, args) => {
        const id = String(args.id);
        await dataStore.instance.delete(typeName, id);
        return true;
    };
}
//# sourceMappingURL=instance.js.map