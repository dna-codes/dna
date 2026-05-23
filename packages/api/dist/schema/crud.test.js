"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const crud_1 = require("./crud");
const types_1 = require("./types");
function lendingDna() {
    return {
        domain: {
            name: 'lending',
            resources: [
                { name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] },
                { name: 'Borrower', attributes: [{ name: 'email', type: 'string' }] },
            ],
            persons: [{ name: 'Customer' }],
        },
    };
}
const stubResolvers = {
    get: () => () => null,
    list: () => () => [],
    create: () => () => null,
    update: () => () => null,
    delete: () => () => true,
};
describe('schema/crud — buildCrudFields', () => {
    it('registers the five CRUD operations per noun primitive', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingDna());
        const { queries, mutations } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        for (const type of ['Loan', 'Borrower', 'Customer']) {
            const single = type.charAt(0).toLowerCase() + type.slice(1);
            const plural = type === 'Person'
                ? 'persons'
                : `${type.charAt(0).toLowerCase() + type.slice(1)}s`;
            expect(queries[single]).toBeDefined();
            expect(queries[plural]).toBeDefined();
            expect(mutations[`create${type}`]).toBeDefined();
            expect(mutations[`update${type}`]).toBeDefined();
            expect(mutations[`delete${type}`]).toBeDefined();
        }
    });
    it('uses persons override for Person plural (not peoples)', () => {
        const dna = {
            domain: { name: 'ex', persons: [{ name: 'Person' }] },
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const { queries } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        expect(queries.persons).toBeDefined();
        expect(queries.peoples).toBeUndefined();
    });
    it('list query returns a non-null list of non-null elements', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingDna());
        const { queries } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        const loans = queries.loans;
        expect(loans.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const inner = loans.type.ofType;
        expect(inner).toBeInstanceOf(graphql_1.GraphQLList);
    });
    it('delete mutation returns Boolean!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingDna());
        const { mutations } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        const del = mutations.deleteLoan;
        expect(del.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const inner = del.type.ofType;
        expect(inner).toBe(graphql_1.GraphQLBoolean);
    });
    it('update mutation takes id: ID! and input: <Type>Input!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingDna());
        const { mutations } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        const update = mutations.updateLoan;
        expect(update.args).toBeDefined();
        const idArg = update.args.id;
        expect(idArg.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const idInner = idArg.type.ofType;
        expect(idInner).toBe(graphql_1.GraphQLID);
        const inputArg = update.args.input;
        expect(inputArg.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
    });
    it('emits crudMutationNames for collision detection downstream', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingDna());
        const { crudMutationNames } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        expect(crudMutationNames.has('createLoan')).toBe(true);
        expect(crudMutationNames.has('updateLoan')).toBe(true);
        expect(crudMutationNames.has('deleteLoan')).toBe(true);
    });
});
//# sourceMappingURL=crud.test.js.map