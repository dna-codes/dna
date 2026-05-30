"use strict";
/**
 * GraphQL-surface tests for resource/relationship-type stability:
 *   - `stability` is queryable on both type kinds
 *   - the transition mutations change stability WITHOUT bumping currentVersion
 *   - an out-of-range enum value is rejected
 *   - the GraphQL `Stability` enum stays in sync with the core union
 */
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const dna_core_1 = require("@dna-codes/dna-core");
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const validator_cache_1 = require("../validation/validator-cache");
const index_1 = require("./index");
const schema_manager_1 = require("./schema-manager");
const registry_types_1 = require("./registry-types");
async function makeStore() {
    const store = (0, memory_1.createClient)();
    await store.resourceType.create({
        name: 'Loan',
        category: 'resource',
        attribute_schema: [{ name: 'amount', type: 'number' }],
    });
    await store.resourceType.create({
        name: 'Borrower',
        category: 'person',
        attribute_schema: [{ name: 'email', type: 'string' }],
    });
    await store.relationshipType.create({
        name: 'Loan.borrower',
        from: 'Loan',
        to: 'Borrower',
        cardinality: 'many-to-one',
        attribute: 'borrower_id',
    });
    return store;
}
async function buildSchema(store) {
    const validatorCache = new validator_cache_1.ValidatorCache();
    let schemaManager;
    schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
    return schemaManager.rebuild();
}
describe('schema/stability — GraphQL surface', () => {
    it('exposes stability on resource types (defaults to experimental for tenant types)', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const { id } = (await store.resourceType.list()).find((rt) => rt.name === 'Loan');
        const res = await (0, graphql_1.graphql)({ schema, source: `{ resourceType(id: "${id}") { stability currentVersion } }` });
        expect(res.errors).toBeUndefined();
        expect(res.data.resourceType.stability).toBe('EXPERIMENTAL');
    });
    it('exposes stability on relationship types', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const { id } = (await store.relationshipType.list())[0];
        const res = await (0, graphql_1.graphql)({ schema, source: `{ relationshipType(id: "${id}") { stability } }` });
        expect(res.errors).toBeUndefined();
        expect(res.data.relationshipType.stability).toBe('EXPERIMENTAL');
    });
    it('setResourceTypeStability transitions stability without bumping currentVersion', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const before = (await store.resourceType.list()).find((rt) => rt.name === 'Loan');
        const res = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { setResourceTypeStability(id: "${before.id}", stability: STABLE) { stability currentVersion } }`,
        });
        expect(res.errors).toBeUndefined();
        expect(res.data.setResourceTypeStability.stability).toBe('STABLE');
        expect(res.data.setResourceTypeStability.currentVersion).toBe(before.current_version);
    });
    it('setRelationshipTypeStability transitions stability without bumping currentVersion', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const before = (await store.relationshipType.list())[0];
        const res = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { setRelationshipTypeStability(id: "${before.id}", stability: BETA) { stability currentVersion } }`,
        });
        expect(res.errors).toBeUndefined();
        expect(res.data.setRelationshipTypeStability.stability).toBe('BETA');
        expect(res.data.setRelationshipTypeStability.currentVersion).toBe(before.current_version);
    });
    it('honors stability supplied on create', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const res = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { createResourceType(input: { name: "Invoice", category: RESOURCE, attributeSchema: [], stability: BETA }) { stability } }`,
        });
        expect(res.errors).toBeUndefined();
        expect(res.data.createResourceType.stability).toBe('BETA');
    });
    it('rejects an out-of-range stability enum value', async () => {
        const store = await makeStore();
        const schema = await buildSchema(store);
        const { id } = (await store.resourceType.list()).find((rt) => rt.name === 'Loan');
        const res = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { setResourceTypeStability(id: "${id}", stability: GA) { stability } }`,
        });
        expect(res.errors).toBeDefined();
        expect(res.errors.length).toBeGreaterThan(0);
    });
});
describe('schema/stability — enum/core sync', () => {
    it('the GraphQL Stability enum mirrors the core STABILITIES union', () => {
        const enumValues = registry_types_1.StabilityEnum.getValues()
            .map((v) => v.value)
            .sort();
        expect(enumValues).toEqual([...dna_core_1.STABILITIES].sort());
        // Member names are the upper-cased values.
        for (const v of registry_types_1.StabilityEnum.getValues()) {
            expect(v.name).toBe(v.value.toUpperCase());
        }
    });
});
//# sourceMappingURL=stability.test.js.map