"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const relationships_1 = require("./relationships");
const types_1 = require("./types");
function makeRT(name, attrs = []) {
    return {
        id: `rt-${name}`,
        name,
        category: 'resource',
        attribute_schema: attrs,
        current_version: 1,
        stability: 'experimental',
        is_seed: false,
    };
}
function makeRRT(cardinality) {
    return {
        id: 'rrt-1',
        name: 'Loan.borrower',
        from: 'Loan',
        to: 'Borrower',
        cardinality,
        attribute: 'borrower_id',
        current_version: 1,
        stability: 'experimental',
        is_seed: false,
    };
}
describe('schema/relationships — planRelationshipFields', () => {
    it('many-to-one produces a single-valued expansion field', () => {
        const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const plan = (0, relationships_1.planRelationshipFields)([makeRRT('many-to-one')], bundle);
        expect(plan).toHaveLength(1);
        expect(plan[0].fieldName).toBe('borrower');
        expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'));
    });
    it('one-to-one produces a single-valued expansion field', () => {
        const types = [makeRT('Loan'), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const plan = (0, relationships_1.planRelationshipFields)([makeRRT('one-to-one')], bundle);
        expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'));
    });
    it('one-to-many produces a list-valued expansion field', () => {
        const types = [makeRT('Loan'), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const plan = (0, relationships_1.planRelationshipFields)([makeRRT('one-to-many')], bundle);
        expect(plan[0].fieldType).toBeInstanceOf(graphql_1.GraphQLList);
        const listType = plan[0].fieldType;
        expect(listType.ofType).toBeInstanceOf(graphql_1.GraphQLNonNull);
    });
    it('many-to-many produces a list-valued expansion field', () => {
        const types = [makeRT('Loan'), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const plan = (0, relationships_1.planRelationshipFields)([makeRRT('many-to-many')], bundle);
        expect(plan[0].fieldType).toBeInstanceOf(graphql_1.GraphQLList);
    });
    it('RelationshipType with missing endpoints is silently skipped', () => {
        const bundle = (0, types_1.buildResourceTypes)([makeRT('Loan')]);
        const plan = (0, relationships_1.planRelationshipFields)([makeRRT('many-to-one')], bundle);
        expect(plan).toHaveLength(0);
    });
    it('FK attribute stays on the from-type alongside the expansion plan', () => {
        const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const Loan = bundle.registry.get('Loan');
        expect(Loan.getFields().borrowerId).toBeDefined();
    });
    it('no RelationshipType means no expansion plan even with reference attribute', () => {
        const types = [makeRT('Loan', [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }]), makeRT('Borrower')];
        const bundle = (0, types_1.buildResourceTypes)(types);
        const plan = (0, relationships_1.planRelationshipFields)([], bundle);
        expect(plan).toHaveLength(0);
    });
});
//# sourceMappingURL=relationships.test.js.map