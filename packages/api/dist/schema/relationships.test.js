"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const relationships_1 = require("./relationships");
const types_1 = require("./types");
function makeDna(relCardinality) {
    return {
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
                cardinality: relCardinality,
                attribute: 'borrower_id',
            },
        ],
    };
}
describe('schema/relationships — planRelationshipFields', () => {
    it('many-to-one produces a single-valued expansion field', () => {
        const dna = makeDna('many-to-one');
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan).toHaveLength(1);
        expect(plan[0].fieldName).toBe('borrower');
        // Single-valued → not wrapped in a List
        expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'));
    });
    it('one-to-one produces a single-valued expansion field', () => {
        const dna = makeDna('one-to-one');
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan[0].fieldType).toBe(bundle.registry.get('Borrower'));
    });
    it('one-to-many produces a list-valued expansion field', () => {
        const dna = makeDna('one-to-many');
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan[0].fieldType).toBeInstanceOf(graphql_1.GraphQLList);
        const listType = plan[0].fieldType;
        expect(listType.ofType).toBeInstanceOf(graphql_1.GraphQLNonNull);
    });
    it('many-to-many produces a list-valued expansion field', () => {
        const dna = makeDna('many-to-many');
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan[0].fieldType).toBeInstanceOf(graphql_1.GraphQLList);
    });
    it('relationship whose endpoints are missing from the registry is silently skipped', () => {
        const dna = {
            domain: { name: 'ex', resources: [{ name: 'Loan' }] },
            relationships: [
                {
                    name: 'Loan.borrower',
                    from: 'Loan',
                    to: 'MissingType',
                    cardinality: 'many-to-one',
                    attribute: 'borrower_id',
                },
            ],
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan).toHaveLength(0);
    });
    it('FK attribute stays present alongside the expansion field', () => {
        const dna = makeDna('many-to-one');
        const bundle = (0, types_1.buildResourceTypes)(dna);
        // The expansion field is installed by the schema composer; for this
        // unit, we just verify the FK scalar field exists in the base types.
        const Loan = bundle.registry.get('Loan');
        expect(Loan.getFields().borrowerId).toBeDefined();
    });
    it('Resources with a reference attribute but no declared Relationship omit the expansion', () => {
        const dna = {
            domain: {
                name: 'ex',
                resources: [
                    { name: 'Loan', attributes: [{ name: 'borrower_id', type: 'reference', resource: 'Borrower' }] },
                    { name: 'Borrower' },
                ],
            },
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const plan = (0, relationships_1.planRelationshipFields)(dna, bundle);
        expect(plan).toHaveLength(0);
    });
});
//# sourceMappingURL=relationships.test.js.map