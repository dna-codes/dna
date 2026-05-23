"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const instance_1 = require("./instance");
function makeStore() {
    return (0, memory_1.createClient)({
        domain: {
            name: 'lending',
            resources: [{ name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] }],
        },
    });
}
const NO_INFO = {};
describe('resolvers/instance', () => {
    it('makeGetResolver calls store.instance.get', async () => {
        const store = makeStore();
        await store.instance.create('Loan', { id: 'l1', amount: 1000 });
        const get = (0, instance_1.makeGetResolver)({ dataStore: store, typeName: 'Loan' });
        const out = await get({}, { id: 'l1' }, {}, NO_INFO);
        expect(out).toMatchObject({ id: 'l1', amount: 1000 });
    });
    it('makeListResolver calls store.instance.list', async () => {
        const store = makeStore();
        await store.instance.create('Loan', { amount: 1 });
        await store.instance.create('Loan', { amount: 2 });
        const list = (0, instance_1.makeListResolver)({ dataStore: store, typeName: 'Loan' });
        const out = (await list({}, {}, {}, NO_INFO));
        expect(out).toHaveLength(2);
    });
    it('makeCreateResolver creates and returns the new record', async () => {
        const store = makeStore();
        const create = (0, instance_1.makeCreateResolver)({ dataStore: store, typeName: 'Loan' });
        const out = (await create({}, { input: { amount: 7 } }, {}, NO_INFO));
        expect(out.amount).toBe(7);
        expect(typeof out.id).toBe('string');
    });
    it('makeUpdateResolver patches the record', async () => {
        const store = makeStore();
        const { id } = await store.instance.create('Loan', { amount: 1, status: 'pending' });
        const update = (0, instance_1.makeUpdateResolver)({ dataStore: store, typeName: 'Loan' });
        const out = (await update({}, { id, input: { status: 'active' } }, {}, NO_INFO));
        expect(out.status).toBe('active');
        expect(out.amount).toBe(1);
    });
    it('makeDeleteResolver returns true and removes the record', async () => {
        const store = makeStore();
        const { id } = await store.instance.create('Loan', { amount: 9 });
        const del = (0, instance_1.makeDeleteResolver)({ dataStore: store, typeName: 'Loan' });
        const out = await del({}, { id }, {}, NO_INFO);
        expect(out).toBe(true);
        expect(await store.instance.get('Loan', id)).toBeNull();
    });
    it('makeGetResolver returns null for missing records', async () => {
        const store = makeStore();
        const get = (0, instance_1.makeGetResolver)({ dataStore: store, typeName: 'Loan' });
        expect(await get({}, { id: 'nope' }, {}, NO_INFO)).toBeNull();
    });
});
//# sourceMappingURL=instance.test.js.map