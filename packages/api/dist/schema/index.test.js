"use strict";
/**
 * Schema-composition smoke tests. Validates that the codegen runs end to
 * end against real example DNAs (`examples/lending`) and produces the
 * expected types/queries/mutations after composition.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const graphql_1 = require("graphql");
const path_1 = require("path");
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const index_1 = require("./index");
const LENDING_FIXTURE = (0, path_1.join)(__dirname, '..', '..', '..', '..', 'examples', 'lending', 'operational.json');
function loadLending() {
    return JSON.parse((0, fs_1.readFileSync)(LENDING_FIXTURE, 'utf-8'));
}
describe('schema/index — buildSchema', () => {
    it('builds a complete schema from the lending example', () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        expect(schema.getQueryType()).toBeDefined();
        expect(schema.getMutationType()).toBeDefined();
    });
    it('includes the expected types from the lending example', () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        expect(schema.getType('Loan')).toBeDefined();
        expect(schema.getType('Borrower')).toBeDefined();
        expect(schema.getType('LoanInput')).toBeDefined();
    });
    it('exposes CRUD queries + mutations for each Resource', () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        const queries = schema.getQueryType().getFields();
        const mutations = schema.getMutationType().getFields();
        expect(queries.loan).toBeDefined();
        expect(queries.loans).toBeDefined();
        expect(mutations.createLoan).toBeDefined();
        expect(mutations.updateLoan).toBeDefined();
        expect(mutations.deleteLoan).toBeDefined();
    });
    it('exposes DNA Operations as mutations (e.g. loanApply)', () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        const mutations = schema.getMutationType().getFields();
        // The lending example has Operation `Loan.Apply` and `Loan.Approve`.
        expect(mutations.loanApply).toBeDefined();
        expect(mutations.loanApprove).toBeDefined();
    });
    it('throws on invalid DNA', () => {
        const bad = { domain: 'not-an-object' };
        const store = (0, memory_1.createClient)({ domain: { name: 'x' } });
        expect(() => (0, index_1.buildSchema)({ dna: bad, dataStore: store })).toThrow(/failed validation/i);
    });
    it('introspection succeeds against the generated schema', async () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        const result = await (0, graphql_1.graphql)({ schema, source: (0, graphql_1.getIntrospectionQuery)() });
        expect(result.errors).toBeUndefined();
        const data = result.data;
        expect(data?.__schema.queryType.name).toBe('Query');
    });
    it('round-trips a Loan via the generated CRUD mutations', async () => {
        const dna = loadLending();
        const store = (0, memory_1.createClient)(dna);
        const schema = (0, index_1.buildSchema)({ dna, dataStore: store });
        await store.migrate();
        const create = await (0, graphql_1.graphql)({
            schema,
            source: `mutation {
        createLoan(input: {
          amount: 1000,
          interestRate: 0.05,
          borrowerId: "b1",
          status: PENDING
        }) { id amount status }
      }`,
        });
        expect(create.errors).toBeUndefined();
        const created = create.data.createLoan;
        expect(typeof created.id).toBe('string');
        expect(created.amount).toBe(1000);
        const read = await (0, graphql_1.graphql)({
            schema,
            source: `{ loan(id: "${created.id}") { amount status } }`,
        });
        expect(read.errors).toBeUndefined();
        expect(read.data.loan.amount).toBe(1000);
        const list = await (0, graphql_1.graphql)({ schema, source: `{ loans { id } }` });
        expect(list.data.loans).toHaveLength(1);
        const del = await (0, graphql_1.graphql)({ schema, source: `mutation { deleteLoan(id: "${created.id}") }` });
        expect(del.data.deleteLoan).toBe(true);
        const afterDelete = await (0, graphql_1.graphql)({ schema, source: `{ loan(id: "${created.id}") { id } }` });
        expect(afterDelete.data.loan).toBeNull();
    });
});
//# sourceMappingURL=index.test.js.map