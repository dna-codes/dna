"use strict";
/**
 * Instance-CRUD resolvers. Every factory returns a GraphQL resolver that
 * closes over an injected `DnaDataStore` and (for write methods) a
 * `ValidatorCache` that compiles ajv validators per
 * `(resourceTypeId, current_version)` pair.
 *
 * Validation timing: per design.md D6, write resolvers validate the input
 * `data` against the live `ResourceType.attribute_schema` at its
 * `current_version` before invoking the store. Read resolvers don't
 * validate — they return whatever is in the store.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetResolver = makeGetResolver;
exports.makeListResolver = makeListResolver;
exports.makeCreateResolver = makeCreateResolver;
exports.makeUpdateResolver = makeUpdateResolver;
exports.makeDeleteResolver = makeDeleteResolver;
const graphql_1 = require("graphql");
const validator_cache_1 = require("../validation/validator-cache");
function makeGetResolver({ dataStore, typeName }) {
    return async (_p, args) => {
        const id = String(args.id);
        return dataStore.instance.get(typeName, id);
    };
}
function makeListResolver({ dataStore, typeName }) {
    return async () => dataStore.instance.list(typeName);
}
async function validateOrThrow(dataStore, validatorCache, typeName, input) {
    const rts = await dataStore.resourceType.list();
    const rt = rts.find((r) => r.name === typeName);
    if (!rt) {
        throw new graphql_1.GraphQLError(`No ResourceType named "${typeName}" exists. Create one via createResourceType first.`);
    }
    const validate = validatorCache.getOrCompile(rt.id, rt.current_version, rt.attribute_schema);
    // Strip control fields before validating against the user-facing schema.
    const { id: _id, _schemaVersion: _v, ...payload } = input;
    void _id;
    void _v;
    if (!validate(payload)) {
        throw new graphql_1.GraphQLError(`Validation failed for ${typeName}:\n${(0, validator_cache_1.formatAjvErrors)(validate)}`);
    }
}
function makeCreateResolver({ dataStore, typeName, validatorCache, }) {
    return async (_p, args) => {
        const input = args.input ?? {};
        await validateOrThrow(dataStore, validatorCache, typeName, input);
        const { id } = await dataStore.instance.create(typeName, input);
        return dataStore.instance.get(typeName, id);
    };
}
function makeUpdateResolver({ dataStore, typeName, validatorCache, }) {
    return async (_p, args) => {
        const { id, input } = args;
        const sid = String(id);
        await validateOrThrow(dataStore, validatorCache, typeName, input ?? {});
        await dataStore.instance.update(typeName, sid, input ?? {});
        return dataStore.instance.get(typeName, sid);
    };
}
function makeDeleteResolver({ dataStore, typeName }) {
    return async (_p, args) => {
        const id = String(args.id);
        await dataStore.instance.delete(typeName, id);
        return true;
    };
}
//# sourceMappingURL=instance.js.map