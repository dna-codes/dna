"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operations_1 = require("./operations");
const types_1 = require("./types");
function lendingDna() {
    return {
        domain: {
            name: 'lending',
            resources: [{ name: 'Loan', attributes: [{ name: 'status', type: 'string' }] }],
        },
        operations: [
            { name: 'Loan.Apply', target: 'Loan', action: 'Apply' },
            { name: 'Loan.Approve', target: 'Loan', action: 'Approve' },
        ],
    };
}
const stubResolvers = { forTarget: () => () => null };
describe('schema/operations — buildOperationMutations', () => {
    it('emits one mutation per DNA Operation with camelCased name', () => {
        const dna = lendingDna();
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const { mutations } = (0, operations_1.buildOperationMutations)(dna, bundle, stubResolvers, new Set());
        expect(mutations.loanApply).toBeDefined();
        expect(mutations.loanApprove).toBeDefined();
    });
    it('signature is (id: ID!, input: <Target>Input!): <Target>!', () => {
        const dna = lendingDna();
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const { mutations } = (0, operations_1.buildOperationMutations)(dna, bundle, stubResolvers, new Set());
        const loanApply = mutations.loanApply;
        expect(loanApply.args?.id).toBeDefined();
        expect(loanApply.args?.input).toBeDefined();
    });
    it('Operation-CRUD name collisions are reported via crudMutationsToOmit', () => {
        const dna = {
            domain: { name: 'ex', resources: [{ name: 'Loan' }] },
            operations: [{ name: 'Loan.Create', target: 'Loan', action: 'Create' }],
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        // The Operation mutation name would be `loanCreate`. Provide a
        // synthetic CRUD set that *includes* that name to simulate a
        // contrived collision (the realistic generator does not produce
        // `loanCreate`, but the omission policy must still be honored).
        const fakeCrud = new Set(['loanCreate']);
        const { mutations, crudMutationsToOmit } = (0, operations_1.buildOperationMutations)(dna, bundle, stubResolvers, fakeCrud);
        expect(mutations.loanCreate).toBeDefined();
        expect(crudMutationsToOmit.has('loanCreate')).toBe(true);
    });
    it('silently skips Operations whose target is missing from the registry', () => {
        const dna = {
            domain: { name: 'ex' },
            operations: [{ name: 'Phantom.Do', target: 'Phantom', action: 'Do' }],
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const { mutations } = (0, operations_1.buildOperationMutations)(dna, bundle, stubResolvers, new Set());
        expect(Object.keys(mutations)).toHaveLength(0);
    });
    it('de-duplicates same-named Operations (first wins)', () => {
        const dna = {
            domain: { name: 'ex', resources: [{ name: 'Loan' }] },
            operations: [
                { name: 'Loan.Apply', target: 'Loan', action: 'Apply' },
                { name: 'Loan.Apply.Duplicate', target: 'Loan', action: 'Apply' },
            ],
        };
        const bundle = (0, types_1.buildResourceTypes)(dna);
        const { mutations } = (0, operations_1.buildOperationMutations)(dna, bundle, stubResolvers, new Set());
        expect(Object.keys(mutations)).toEqual(['loanApply']);
    });
});
//# sourceMappingURL=operations.test.js.map