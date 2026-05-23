"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const relationships_1 = require("./relationships");
function makeStore() {
    return (0, memory_1.createClient)({
        domain: {
            name: 'ex',
            resources: [
                { name: 'Loan', attributes: [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }] },
                { name: 'Borrower', attributes: [{ name: 'email', type: 'string' }] },
            ],
        },
        relationships: [
            {
                name: 'Loan.borrower',
                from: 'Loan',
                to: 'Borrower',
                cardinality: 'many-to-one',
                attribute: 'borrower_id',
            },
        ],
    });
}
const NO_INFO = {};
describe('resolvers/relationships', () => {
    const baseInfo = {
        fromType: 'Loan',
        toType: 'Borrower',
        fieldName: 'borrower',
        relationshipName: 'Loan.borrower',
        cardinality: 'many-to-one',
        isList: false,
    };
    it('single-valued: resolves the first linked Instance', async () => {
        const store = makeStore();
        const { id: loanId } = await store.instance.create('Loan', { amount: 1000 });
        const { id: borrowerId } = await store.instance.create('Borrower', { email: 'a@b.c' });
        await store.link.create({ typeName: 'Loan', id: loanId }, { typeName: 'Borrower', id: borrowerId }, { role: 'Loan.borrower' });
        const resolve = (0, relationships_1.makeRelationshipResolver)({ dataStore: store, info: baseInfo });
        const out = await resolve({ id: loanId }, {}, {}, NO_INFO);
        expect(out).toMatchObject({ id: borrowerId, email: 'a@b.c' });
    });
    it('single-valued: no link returns null', async () => {
        const store = makeStore();
        const { id: loanId } = await store.instance.create('Loan', { amount: 1000 });
        const resolve = (0, relationships_1.makeRelationshipResolver)({ dataStore: store, info: baseInfo });
        expect(await resolve({ id: loanId }, {}, {}, NO_INFO)).toBeNull();
    });
    it('list-valued: returns every linked Instance', async () => {
        const store = makeStore();
        const { id: loanId } = await store.instance.create('Loan', { amount: 1 });
        const { id: b1 } = await store.instance.create('Borrower', { email: 'a@b.c' });
        const { id: b2 } = await store.instance.create('Borrower', { email: 'd@e.f' });
        await store.link.create({ typeName: 'Loan', id: loanId }, { typeName: 'Borrower', id: b1 }, { role: 'Loan.borrower' });
        await store.link.create({ typeName: 'Loan', id: loanId }, { typeName: 'Borrower', id: b2 }, { role: 'Loan.borrower' });
        const resolve = (0, relationships_1.makeRelationshipResolver)({
            dataStore: store,
            info: { ...baseInfo, isList: true, cardinality: 'one-to-many' },
        });
        const out = (await resolve({ id: loanId }, {}, {}, NO_INFO));
        expect(out).toHaveLength(2);
        expect(out.map((r) => r.id).sort()).toEqual([b1, b2].sort());
    });
    it('parent without id returns null or empty', async () => {
        const store = makeStore();
        const resolveSingle = (0, relationships_1.makeRelationshipResolver)({ dataStore: store, info: baseInfo });
        expect(await resolveSingle({ id: undefined }, {}, {}, NO_INFO)).toBeNull();
        const resolveList = (0, relationships_1.makeRelationshipResolver)({
            dataStore: store,
            info: { ...baseInfo, isList: true, cardinality: 'one-to-many' },
        });
        expect(await resolveList({ id: undefined }, {}, {}, NO_INFO)).toEqual([]);
    });
});
//# sourceMappingURL=relationships.test.js.map