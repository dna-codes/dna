"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const types_1 = require("./types");
function makeResourceType(name, partial) {
    return {
        id: `rt-${name}`,
        name,
        category: partial?.category ?? 'resource',
        attribute_schema: partial?.attribute_schema ?? [],
        current_version: partial?.current_version ?? 1,
        stability: partial?.stability ?? 'experimental',
        is_seed: partial?.is_seed ?? false,
        ...(partial?.description ? { description: partial.description } : {}),
    };
}
function lendingTypes() {
    return [
        makeResourceType('Loan', {
            attribute_schema: [
                { name: 'amount', type: 'number', required: true },
                { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
                { name: 'borrower_id', type: 'reference', resource: 'Borrower' },
                { name: 'opened_at', type: 'datetime' },
            ],
        }),
        makeResourceType('Borrower', { attribute_schema: [{ name: 'email', type: 'string' }] }),
        makeResourceType('Customer', { category: 'person' }),
        makeResourceType('Underwriter', { category: 'role' }),
        makeResourceType('BankDepartment', { category: 'group' }),
    ];
}
describe('schema/types — buildResourceTypes', () => {
    it('emits one GraphQL type per ResourceType', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        expect([...bundle.registry.keys()].sort()).toEqual(['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort());
        expect([...bundle.inputRegistry.keys()].sort()).toEqual(['BankDepartment', 'Borrower', 'Customer', 'Loan', 'Underwriter'].sort());
    });
    it('every type carries id: ID! and _schemaVersion: Int!', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(String(Loan.id.type)).toBe('ID!');
        expect(String(Loan._schemaVersion.type)).toBe('Int!');
    });
    it('maps scalar attribute types per the design table', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.amount.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        const amountInner = Loan.amount.type.ofType;
        expect(amountInner).toBe(graphql_1.GraphQLFloat);
        expect(Loan.openedAt.type).toBe(graphql_1.GraphQLString);
        expect(Loan.borrowerId.type).toBe(graphql_1.GraphQLID);
    });
    it('generates per-attribute enum types named <Type><Attribute>', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const LoanStatus = bundle.enumRegistry.get('Loan.status');
        expect(LoanStatus).toBeDefined();
        expect(LoanStatus.name).toBe('LoanStatus');
        expect(LoanStatus.getValues().map((v) => v.name).sort()).toEqual(['ACTIVE', 'PENDING', 'REPAID']);
        expect(LoanStatus.getValue('PENDING')?.value).toBe('pending');
    });
    it('maps required attributes to non-null wrappers', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.amount.type).toBeInstanceOf(graphql_1.GraphQLNonNull);
        expect(Loan.status.type).not.toBeInstanceOf(graphql_1.GraphQLNonNull);
    });
    it('converts snake_case attribute names to camelCase fields', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const Loan = bundle.registry.get('Loan').getFields();
        expect(Loan.borrowerId).toBeDefined();
        expect(Loan.openedAt).toBeDefined();
        expect(Loan.borrower_id).toBeUndefined();
    });
    it('produces input types with optional id + attribute fields', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const LoanInput = bundle.inputRegistry.get('Loan').getFields();
        expect(LoanInput.id).toBeDefined();
        expect(String(LoanInput.id.type)).toBe('ID');
        expect(LoanInput.amount).toBeDefined();
        expect(LoanInput.status).toBeDefined();
        expect(LoanInput.borrowerId).toBeDefined();
    });
    it('Input types for attribute-less ResourceTypes still satisfy one-field minimum', () => {
        const bundle = (0, types_1.buildResourceTypes)([makeResourceType('Employee', { category: 'person' })]);
        const EmployeeInput = bundle.inputRegistry.get('Employee').getFields();
        expect(Object.keys(EmployeeInput)).toEqual(['id']);
    });
    it('maps boolean attribute → GraphQLBoolean', () => {
        const bundle = (0, types_1.buildResourceTypes)([
            makeResourceType('Flag', { attribute_schema: [{ name: 'enabled', type: 'boolean' }] }),
        ]);
        const Flag = bundle.registry.get('Flag').getFields();
        expect(Flag.enabled.type).toBe(graphql_1.GraphQLBoolean);
    });
    it('_schemaVersion field returns the parent record _schemaVersion when present', () => {
        const bundle = (0, types_1.buildResourceTypes)(lendingTypes());
        const Loan = bundle.registry.get('Loan').getFields();
        const fieldResolve = Loan._schemaVersion.resolve;
        expect(fieldResolve({ _schemaVersion: 5 }, {}, {}, {})).toBe(5);
    });
    it('_schemaVersion field falls back to ResourceType.current_version when missing', () => {
        const types = lendingTypes();
        const bundle = (0, types_1.buildResourceTypes)(types);
        const Loan = bundle.registry.get('Loan').getFields();
        const fieldResolve = Loan._schemaVersion.resolve;
        expect(fieldResolve({}, {}, {}, {})).toBe(1);
        void graphql_1.GraphQLInt;
    });
});
//# sourceMappingURL=types.test.js.map