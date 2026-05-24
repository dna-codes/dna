"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const crud_1 = require("./crud");
const types_1 = require("./types");
function makeResourceType(name, category = 'resource') {
    return {
        id: `rt-${name}`,
        name,
        category,
        attribute_schema: [{ name: 'foo', type: 'string' }],
        current_version: 1,
        is_seed: false,
    };
}
function lendingTypes() {
    return [
        makeResourceType('Loan'),
        makeResourceType('Borrower'),
        makeResourceType('Customer', 'person'),
    ];
}
const stubResolvers = {
    get: () => () => null,
    list: () => () => [],
    create: () => () => null,
    update: () => () => null,
    delete: () => () => true,
};
describe('schema/crud — buildCrudFields', () => {
    it('registers the five CRUD operations per ResourceType', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const { queries, mutations } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        for (const type of ['Loan', 'Borrower', 'Customer']) {
            const single = type.charAt(0).toLowerCase() + type.slice(1);
            const plural = `${type.charAt(0).toLowerCase() + type.slice(1)}s`;
            expect(queries[single]).toBeDefined();
            expect(queries[plural]).toBeDefined();
            expect(mutations[`create${type}`]).toBeDefined();
            expect(mutations[`update${type}`]).toBeDefined();
            expect(mutations[`delete${type}`]).toBeDefined();
        }
    });
    it('uses persons override for Person plural (not peoples)', () => {
        const bundle = (0, types_1.buildResourceTypes)([makeResourceType('Person', 'person')]);
        const { queries } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        expect(queries.persons).toBeDefined();
        expect(queries.peoples).toBeUndefined();
    });
    it('list query returns a non-null list of non-null elements', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const { queries } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        const loans = queries.loans;
        expect(loans.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const inner = loans.type.ofType;
        expect(inner).toBeInstanceOf(graphql_1.GraphQLList);
    });
    it('delete mutation returns Boolean!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const { mutations } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        const del = mutations.deleteLoan;
        expect(del.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const inner = del.type.ofType;
        expect(inner).toBe(graphql_1.GraphQLBoolean);
    });
    it('update mutation takes id: ID! and input: <Type>Input!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
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
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const { crudMutationNames } = (0, crud_1.buildCrudFields)(bundle, stubResolvers);
        expect(crudMutationNames.has('createLoan')).toBe(true);
        expect(crudMutationNames.has('updateLoan')).toBe(true);
        expect(crudMutationNames.has('deleteLoan')).toBe(true);
    });
});
//# sourceMappingURL=crud.test.js.map