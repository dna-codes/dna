"use strict";
/**
 * Schema-composition smoke tests for the registry-native build path.
 * Builds a schema from a populated in-memory data store and asserts the
 * expected GraphQL types / queries / mutations are present.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const validator_cache_1 = require("../validation/validator-cache");
const index_1 = require("./index");
const schema_manager_1 = require("./schema-manager");
async function makeSeededStore() {
    const store = (0, memory_1.createClient)();
    await store.resourceType.create({
        name: 'Loan',
        category: 'resource',
        attribute_schema: [
            { name: 'amount', type: 'number', required: true },
            { name: 'status', type: 'enum', values: ['pending', 'active'] },
        ],
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
describe('schema/index — buildRegistrySchema', () => {
    it('builds a complete schema from the data store', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        expect(schema.getQueryType()).toBeDefined();
        expect(schema.getMutationType()).toBeDefined();
    });
    it('includes ResourceType and RelationshipType top-level CRUD', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        const queries = schema.getQueryType().getFields();
        const mutations = schema.getMutationType().getFields();
        expect(queries.resourceType).toBeDefined();
        expect(queries.resourceTypes).toBeDefined();
        expect(queries.relationshipType).toBeDefined();
        expect(queries.relationshipTypes).toBeDefined();
        expect(mutations.createResourceType).toBeDefined();
        expect(mutations.updateResourceType).toBeDefined();
        expect(mutations.deleteResourceType).toBeDefined();
        expect(mutations.createRelationshipType).toBeDefined();
    });
    it('exposes per-Type CRUD for each ResourceType in the store', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        const queries = schema.getQueryType().getFields();
        const mutations = schema.getMutationType().getFields();
        expect(queries.loan).toBeDefined();
        expect(queries.loans).toBeDefined();
        expect(mutations.createLoan).toBeDefined();
        expect(mutations.updateLoan).toBeDefined();
        expect(mutations.deleteLoan).toBeDefined();
        // Borrower's plural is 'borrowers' (naive 's')
        expect(queries.borrowers).toBeDefined();
    });
    it('schema does NOT include DNA Operation-derived mutations (removed)', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        const mutations = schema.getMutationType().getFields();
        expect(mutations.loanApply).toBeUndefined();
        expect(mutations.loanApprove).toBeUndefined();
    });
    it('introspection succeeds against the generated schema', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        const result = await (0, graphql_1.graphql)({ schema, source: (0, graphql_1.getIntrospectionQuery)() });
        expect(result.errors).toBeUndefined();
        const data = result.data;
        expect(data?.__schema.queryType.name).toBe('Query');
    });
    it('round-trips a Loan via the generated CRUD mutations', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        const create = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { createLoan(input: { amount: 1000, status: PENDING }) { id amount status _schemaVersion } }`,
        });
        expect(create.errors).toBeUndefined();
        const created = create.data.createLoan;
        expect(typeof created.id).toBe('string');
        expect(created.amount).toBe(1000);
        expect(created._schemaVersion).toBe(1);
        const read = await (0, graphql_1.graphql)({
            schema,
            source: `{ loan(id: "${created.id}") { amount status _schemaVersion } }`,
        });
        expect(read.errors).toBeUndefined();
        const loan = read.data.loan;
        expect(loan.amount).toBe(1000);
        expect(loan._schemaVersion).toBe(1);
        const list = await (0, graphql_1.graphql)({ schema, source: `{ loans { id } }` });
        expect(list.data.loans).toHaveLength(1);
        const del = await (0, graphql_1.graphql)({ schema, source: `mutation { deleteLoan(id: "${created.id}") }` });
        expect(del.data.deleteLoan).toBe(true);
        const afterDelete = await (0, graphql_1.graphql)({ schema, source: `{ loan(id: "${created.id}") { id } }` });
        expect(afterDelete.data.loan).toBeNull();
    });
    it('rejects an invalid createLoan input', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        const schema = await schemaManager.rebuild();
        // Missing required `amount` field — rejected by GraphQL's own non-null
        // checking before our ajv layer runs. (Defense-in-depth: GraphQL types
        // catch required-field omissions; ajv catches per-attribute schema
        // violations the type system can't express.)
        const create = await (0, graphql_1.graphql)({
            schema,
            source: `mutation { createLoan(input: { status: PENDING }) { id } }`,
        });
        expect(create.errors).toBeDefined();
        expect(create.errors.length).toBeGreaterThan(0);
    });
    it('schema rebuilds reflect a new ResourceType', async () => {
        const store = await makeSeededStore();
        const validatorCache = new validator_cache_1.ValidatorCache();
        let schemaManager;
        schemaManager = new schema_manager_1.SchemaManager(() => (0, index_1.buildRegistrySchema)({ dataStore: store, validatorCache, schemaManager }));
        await schemaManager.rebuild();
        await store.resourceType.create({
            name: 'Account',
            category: 'resource',
            attribute_schema: [{ name: 'balance', type: 'number' }],
        });
        const schema = await schemaManager.rebuild();
        const queries = schema.getQueryType().getFields();
        expect(queries.account).toBeDefined();
        expect(queries.accounts).toBeDefined();
    });
});
//# sourceMappingURL=index.test.js.map