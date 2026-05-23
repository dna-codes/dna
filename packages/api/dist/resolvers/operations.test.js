"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const operations_1 = require("./operations");
const NO_INFO = {};
describe('resolvers/operations', () => {
    it('v1 behavior: update + re-read', async () => {
        const store = (0, memory_1.createClient)({
            domain: { name: 'ex', resources: [{ name: 'Loan' }] },
        });
        const { id } = await store.instance.create('Loan', { status: 'pending', amount: 1000 });
        const resolve = (0, operations_1.makeOperationResolver)({ dataStore: store, targetType: 'Loan' });
        const out = (await resolve({}, { id, input: { status: 'active' } }, {}, NO_INFO));
        expect(out.status).toBe('active');
        expect(out.amount).toBe(1000);
    });
});
//# sourceMappingURL=operations.test.js.map