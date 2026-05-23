"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const types_1 = require("./types");
function lendingLikeDna() {
    return {
        domain: {
            name: 'lending',
            resources: [
                {
                    name: 'Loan',
                    attributes: [
                        { name: 'amount', type: 'number', required: true },
                        { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
                        { name: 'borrower_id', type: 'reference', resource: 'Borrower' },
                        { name: 'opened_at', type: 'datetime' },
                    ],
                },
                {
                    name: 'Borrower',
                    attributes: [{ name: 'email', type: 'string' }],
                },
            ],
            persons: [{ name: 'Customer' }],
            roles: [{ name: 'Underwriter' }],
            groups: [{ name: 'BankDepartment' }],
        },
    };
}
describe('schema/types — buildResourceTypes', () => {
    it('emits one GraphQL type per noun primitive', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        expect([...bundle.registry.keys()].sort()).toEqual(['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort());
        expect([...bundle.inputRegistry.keys()].sort()).toEqual(['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort());
    });
    it('every type carries id: ID!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const Loan = bundle.registry.get('Loan');
        const idField = Loan.getFields().id;
        expect(idField).toBeDefined();
        expect(String(idField.type)).toBe('ID!');
    });
    it('maps scalar attribute types per D1', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.amount.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        // amount required → Float!
        const amountInner = Loan.amount.type.ofType;
        expect(amountInner).toBe(graphql_1.GraphQLFloat);
        // openedAt → String (datetime mapped to String in v1)
        expect(Loan.openedAt.type).toBe(graphql_1.GraphQLString);
        // borrower_id reference attribute → ID scalar
        expect(Loan.borrowerId.type).toBe(graphql_1.GraphQLID);
    });
    it('generates per-attribute enum types named <Type><Attribute>', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const LoanStatus = bundle.enumRegistry.get('Loan.status');
        expect(LoanStatus).toBeDefined();
        expect(LoanStatus.name).toBe('LoanStatus');
        expect(LoanStatus.getValues().map((v) => v.name).sort()).toEqual(['ACTIVE', 'PENDING', 'REPAID']);
        // Enum value backs to the lowercase DNA value
        expect(LoanStatus.getValue('PENDING')?.value).toBe('pending');
    });
    it('maps required attributes to non-null wrappers', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.amount.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        // status is not required → not wrapped
        expect(Loan.status.type).not.toBeInstanceOf(graphql_1.GraphQLNonNull);
    });
    it('converts snake_case attribute names to camelCase fields', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.borrowerId).toBeDefined();
        expect(Loan.openedAt).toBeDefined();
        // snake_case keys are NOT present
        expect(Loan.borrower_id).toBeUndefined();
    });
    it('produces input types with optional id + attribute fields', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingLikeDna());
        const LoanInput = bundle.inputRegistry.get('Loan').getFields();
        // Every Input type includes an optional `id: ID` (hybrid-ID
        // contract from the underlying store).
        expect(LoanInput.id).toBeDefined();
        expect(String(LoanInput.id.type)).toBe('ID');
        expect(LoanInput.amount).toBeDefined();
        expect(LoanInput.status).toBeDefined();
        expect(LoanInput.borrowerId).toBeDefined();
    });
    it('Input types for attribute-less primitives still satisfy the one-field minimum', () => {
        const dna = {
            domain: { name: 'ex', persons: [{ name: 'Employee' }] },
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const EmployeeInput = bundle.inputRegistry.get('Employee').getFields();
        expect(Object.keys(EmployeeInput)).toEqual(['id']);
    });
    it('skips an attribute named "id" so it does not collide with reserved id: ID!', () => {
        const dna = {
            domain: {
                name: 'ex',
                resources: [
                    {
                        name: 'Thing',
                        attributes: [
                            { name: 'id', type: 'string', required: true },
                            { name: 'kind', type: 'string' },
                        ],
                    },
                ],
            },
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const Thing = bundle.registry.get('Thing').getFields();
        expect(Thing.id.type).toBe(new graphql_1.GraphQLNonNull(graphql_1.GraphQLID).constructor.prototype.constructor === graphql_1.GraphQLNonNull ? Thing.id.type : Thing.id.type);
        // The reserved id field stays ID! (not string-coerced).
        const inner = Thing.id.type.ofType;
        expect(inner).toBe(graphql_1.GraphQLID);
    });
    it('maps boolean attribute → GraphQLBoolean', () => {
        const dna = {
            domain: {
                name: 'ex',
                resources: [{ name: 'Flag', attributes: [{ name: 'enabled', type: 'boolean' }] }],
            },
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const Flag = bundle.registry.get('Flag').getFields();
        expect(Flag.enabled.type).toBe(graphql_1.GraphQLBoolean);
    });
});
//# sourceMappingURL=types.test.js.map