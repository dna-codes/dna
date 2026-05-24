"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dna_core_1 = require("@dna-codes/dna-core");
const constructor_1 = require("./constructor");
describe('LayeredConstructor — no-LLM direct usage', () => {
    it('exposes 11 tools (10 add_* + finalize)', () => {
        const ctor = new constructor_1.LayeredConstructor();
        expect(ctor.tools()).toHaveLength(11);
        expect(ctor.tools().find((t) => t.name === 'finalize')).toBeDefined();
    });
    it('builds a valid Operational document end-to-end without an LLM', () => {
        const ctor = new constructor_1.LayeredConstructor({ domain: { name: 'lending', path: 'acme.lending' } });
        expect(ctor.handle({
            name: 'add_resource',
            args: {
                name: 'Loan',
                attributes: [
                    { name: 'amount', type: 'number', required: true },
                    { name: 'status', type: 'enum', values: ['pending', 'active', 'repaid'] },
                ],
                actions: [
                    { name: 'Apply', type: 'write' },
                    { name: 'Approve', type: 'write' },
                ],
            },
        })).toMatchObject({ ok: true, primitive: 'resource', name: 'Loan' });
        expect(ctor.handle({ name: 'add_person', args: { name: 'Borrower' } })).toMatchObject({ ok: true });
        expect(ctor.handle({ name: 'add_person', args: { name: 'Employee' } })).toMatchObject({ ok: true });
        expect(ctor.handle({ name: 'add_group', args: { name: 'BankDepartment' } })).toMatchObject({ ok: true });
        expect(ctor.handle({ name: 'add_role', args: { name: 'Underwriter', scope: 'BankDepartment' } })).toMatchObject({ ok: true });
        expect(ctor.handle({
            name: 'add_membership',
            args: { name: 'EmployeeUnderwriter', person: 'Employee', role: 'Underwriter' },
        })).toMatchObject({ ok: true });
        expect(ctor.handle({
            name: 'add_operation',
            args: { target: 'Loan', action: 'Apply', name: 'Loan.Apply' },
        })).toMatchObject({ ok: true });
        expect(ctor.handle({
            name: 'add_operation',
            args: { target: 'Loan', action: 'Approve', name: 'Loan.Approve' },
        })).toMatchObject({ ok: true });
        expect(ctor.handle({
            name: 'add_rule',
            args: {
                name: 'LoanApplyAccess',
                operation: 'Loan.Apply',
                rule_type: 'access',
                allow: [{ role: 'Borrower' }],
            },
        })).toMatchObject({ ok: true });
        expect(ctor.handle({
            name: 'add_rule',
            args: {
                name: 'LoanApproveAccess',
                operation: 'Loan.Approve',
                rule_type: 'access',
                allow: [{ role: 'Underwriter' }],
            },
        })).toMatchObject({ ok: true });
        const final = ctor.handle({ name: 'finalize', args: {} });
        if (!final.ok) {
            throw new Error(`finalize unexpectedly failed: ${JSON.stringify(final.details, null, 2)}`);
        }
        expect(final).toMatchObject({ ok: true, finalized: true });
        if (!('document' in final))
            throw new Error('expected document on finalized result');
        const validator = new dna_core_1.DnaValidator();
        const validation = validator.validate(final.document, 'operational');
        expect(validation.valid).toBe(true);
        const cross = validator.validateCrossLayer({ operational: final.document });
        expect(cross.valid).toBe(true);
    });
    it('rejects add_membership when the role has not been declared, then accepts after declaring', () => {
        const ctor = new constructor_1.LayeredConstructor();
        ctor.handle({ name: 'add_person', args: { name: 'Employee' } });
        const bad = ctor.handle({
            name: 'add_membership',
            args: { name: 'EmployeeUnderwriter', person: 'Employee', role: 'Underwriter' },
        });
        expect(bad.ok).toBe(false);
        if (bad.ok)
            throw new Error('expected failure');
        expect(bad.error).toBe('unknown_role');
        expect(bad.available).toEqual([]);
        ctor.handle({ name: 'add_group', args: { name: 'BankDepartment' } });
        ctor.handle({ name: 'add_role', args: { name: 'Underwriter', scope: 'BankDepartment' } });
        const good = ctor.handle({
            name: 'add_membership',
            args: { name: 'EmployeeUnderwriter', person: 'Employee', role: 'Underwriter' },
        });
        expect(good).toMatchObject({ ok: true, primitive: 'membership' });
    });
    it('rejects schema-invalid args without mutating the draft', () => {
        const ctor = new constructor_1.LayeredConstructor();
        const result = ctor.handle({
            name: 'add_resource',
            args: { name: 'Loan', attributes: [{ name: 'status', type: 'invalid_type' }] },
        });
        expect(result.ok).toBe(false);
        if (result.ok)
            throw new Error('expected failure');
        expect(result.error).toBe('schema_violation');
        const snapshot = ctor.result().document;
        expect(snapshot.domain.resources ?? []).toEqual([]);
    });
    it('composes a second add_resource with the same name into the existing one', () => {
        // Behavior change in 0.5.0: same-named primitives compose via the merge
        // engine instead of producing a `duplicate_name` error. List-shaped
        // children union by name; scalar disagreements surface as conflicts.
        const ctor = new constructor_1.LayeredConstructor();
        expect(ctor.handle({
            name: 'add_resource',
            args: { name: 'Claimant', attributes: [{ name: 'email', type: 'string' }] },
        })).toMatchObject({ ok: true });
        const second = ctor.handle({
            name: 'add_resource',
            args: { name: 'Claimant', attributes: [{ name: 'phone', type: 'string' }] },
        });
        expect(second.ok).toBe(true);
        const { document, conflicts } = ctor.result();
        expect(conflicts).toEqual([]);
        const resources = document.domain.resources;
        expect(resources).toHaveLength(1);
        expect(resources[0].attributes.map((a) => a.name).sort()).toEqual(['email', 'phone']);
    });
    it('surfaces composed-on-add scalar conflicts in result().conflicts', () => {
        const ctor = new constructor_1.LayeredConstructor();
        ctor.handle({
            name: 'add_resource',
            args: { name: 'Loan', description: 'Consumer loan' },
        });
        // Different intermediate call so the consecutive-signature check doesn't fire.
        ctor.handle({ name: 'add_person', args: { name: 'Borrower' } });
        const second = ctor.handle({
            name: 'add_resource',
            args: { name: 'Loan', description: 'Mortgage product' },
        });
        expect(second.ok).toBe(true);
        const { conflicts } = ctor.result();
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].path).toBe('resources.Loan.description');
    });
    it('detects duplicate consecutive calls (same name + same args)', () => {
        const ctor = new constructor_1.LayeredConstructor();
        const first = ctor.handle({ name: 'add_person', args: { name: 'Employee' } });
        expect(first.ok).toBe(true);
        const dup = ctor.handle({ name: 'add_person', args: { name: 'Employee' } });
        expect(dup.ok).toBe(false);
        if (dup.ok)
            throw new Error('expected failure');
        // duplicate_call still fires for back-to-back identical tool calls;
        // duplicate_name was removed in 0.5.0 (same-named primitives now compose).
        expect(dup.error).toBe('duplicate_call');
    });
    it('throws when the iteration cap is exceeded', () => {
        const ctor = new constructor_1.LayeredConstructor({ maxToolCalls: 2 });
        ctor.handle({ name: 'add_person', args: { name: 'P1' } });
        ctor.handle({ name: 'add_person', args: { name: 'P2' } });
        expect(() => ctor.handle({ name: 'add_person', args: { name: 'P3' } })).toThrow(/Iteration cap of 2/);
    });
    it('finalize succeeds on a minimal valid draft (no primitives required besides the domain)', () => {
        const ctor = new constructor_1.LayeredConstructor();
        const result = ctor.handle({ name: 'finalize', args: {} });
        expect(result.ok).toBe(true);
        expect(ctor.hasFinalized()).toBe(true);
    });
});
//# sourceMappingURL=constructor.test.js.map