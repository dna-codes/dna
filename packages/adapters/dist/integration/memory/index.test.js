"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("./client");
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REGISTRY_FIXTURE_PATH = (0, path_1.join)(__dirname, '..', '..', '..', '..', '..', 'examples', 'registry', 'operational.json');
function makeLendingDna() {
    return {
        domain: {
            name: 'lending',
            resources: [
                { name: 'Loan', attributes: [{ name: 'amount', type: 'number' }] },
                { name: 'Borrower', attributes: [{ name: 'email', type: 'string' }] },
            ],
            persons: [{ name: 'Customer' }],
            roles: [{ name: 'Underwriter' }],
            groups: [{ name: 'BankDepartment' }],
        },
        relationships: [
            {
                name: 'Loan.borrower',
                from: 'Loan',
                to: 'Borrower',
                cardinality: 'many-to-one',
                attribute: 'borrower_id',
                inverse: 'loans',
            },
        ],
    };
}
describe('integration/memory createClient', () => {
    it('returns a DnaDataStore-shaped client', () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        expect(typeof client.migrate).toBe('function');
        expect(typeof client.instance.create).toBe('function');
        expect(typeof client.link.create).toBe('function');
        expect(typeof client.close).toBe('function');
    });
    it('close() resolves without error', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await expect(client.close()).resolves.toBeUndefined();
    });
});
describe('integration/memory migrate', () => {
    it('is idempotent across repeated calls', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await expect(client.migrate()).resolves.toBeUndefined();
        await expect(client.migrate()).resolves.toBeUndefined();
    });
    it('survives a DNA with no noun primitives', async () => {
        const empty = { domain: { name: 'empty' } };
        const client = (0, client_1.createClient)(empty);
        await expect(client.migrate()).resolves.toBeUndefined();
    });
});
describe('integration/memory Instance CRUD', () => {
    it('round-trips create then get with shallow data', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await client.migrate();
        const { id } = await client.instance.create('Loan', { amount: 1000, status: 'pending' });
        const got = await client.instance.get('Loan', id);
        expect(got).toEqual({ id, amount: 1000, status: 'pending' });
    });
    it('returns null for missing instances', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        expect(await client.instance.get('Loan', 'nonexistent')).toBeNull();
    });
    it('list returns all instances of a type', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await client.instance.create('Loan', { amount: 1 });
        await client.instance.create('Loan', { amount: 2 });
        await client.instance.create('Loan', { amount: 3 });
        const all = await client.instance.list('Loan');
        expect(all).toHaveLength(3);
        expect(all.map((l) => l.amount).sort()).toEqual([1, 2, 3]);
        for (const record of all)
            expect(typeof record.id).toBe('string');
    });
    it('same id across two types does not collide', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await client.instance.create('Loan', { id: 'shared', amount: 1000 });
        await client.instance.create('Borrower', { id: 'shared', email: 'a@b.c' });
        expect(await client.instance.get('Loan', 'shared')).toEqual({ id: 'shared', amount: 1000 });
        expect(await client.instance.get('Borrower', 'shared')).toEqual({ id: 'shared', email: 'a@b.c' });
    });
    it('update applies a shallow merge', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id } = await client.instance.create('Loan', { amount: 1000, status: 'pending' });
        await client.instance.update('Loan', id, { status: 'active' });
        expect(await client.instance.get('Loan', id)).toEqual({ id, amount: 1000, status: 'active' });
    });
    it('update on missing instance throws', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await expect(client.instance.update('Loan', 'no', { x: 1 })).rejects.toThrow(/not found/);
    });
    it('delete removes the instance; subsequent get returns null', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id } = await client.instance.create('Loan', { amount: 1000 });
        await client.instance.delete('Loan', id);
        expect(await client.instance.get('Loan', id)).toBeNull();
    });
    it('delete is idempotent on missing ids', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await expect(client.instance.delete('Loan', 'never-existed')).resolves.toBeUndefined();
    });
    it('caller-provided id is honored and returned', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const result = await client.instance.create('Loan', { id: 'loan-42', amount: 1000 });
        expect(result.id).toBe('loan-42');
        expect(await client.instance.get('Loan', 'loan-42')).toEqual({ id: 'loan-42', amount: 1000 });
    });
    it('collision on caller-provided id throws', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        await client.instance.create('Loan', { id: 'loan-42', amount: 1000 });
        await expect(client.instance.create('Loan', { id: 'loan-42', amount: 2000 })).rejects.toThrow(/already exists/);
    });
    it('adapter-generated id is a UUIDv4', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id } = await client.instance.create('Loan', { amount: 1000 });
        expect(id).toMatch(UUID_V4);
    });
});
describe('integration/memory Link CRUD', () => {
    it('creates a Link between two Instances and lists it', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id: l1 } = await client.instance.create('Loan', { amount: 1000 });
        const { id: b1 } = await client.instance.create('Borrower', { email: 'a@b.c' });
        const { id: linkId } = await client.link.create({ typeName: 'Loan', id: l1 }, { typeName: 'Borrower', id: b1 });
        expect(linkId).toMatch(UUID_V4);
        const links = await client.link.list({ from: { typeName: 'Loan', id: l1 } });
        expect(links).toHaveLength(1);
        expect(links[0]).toMatchObject({
            id: linkId,
            from: { typeName: 'Loan', id: l1 },
            to: { typeName: 'Borrower', id: b1 },
        });
    });
    it('Link carries role and attributes', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id: l1 } = await client.instance.create('Loan', { amount: 1000 });
        const { id: b1 } = await client.instance.create('Borrower', { email: 'a@b.c' });
        await client.link.create({ typeName: 'Loan', id: l1 }, { typeName: 'Borrower', id: b1 }, { role: 'primary_borrower', attributes: { assigned_at: '2026-05-23' } });
        const byRole = await client.link.list({ role: 'primary_borrower' });
        expect(byRole).toHaveLength(1);
        expect(byRole[0].attributes).toEqual({ assigned_at: '2026-05-23' });
    });
    it('delete removes a Link by id', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id: l1 } = await client.instance.create('Loan', { amount: 1000 });
        const { id: b1 } = await client.instance.create('Borrower', { email: 'a@b.c' });
        const { id: linkId } = await client.link.create({ typeName: 'Loan', id: l1 }, { typeName: 'Borrower', id: b1 });
        await client.link.delete(linkId);
        expect(await client.link.list()).toHaveLength(0);
    });
    it('list filters by from + to + role combinations', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id: l1 } = await client.instance.create('Loan', { amount: 1 });
        const { id: l2 } = await client.instance.create('Loan', { amount: 2 });
        const { id: b1 } = await client.instance.create('Borrower', { email: 'a@b.c' });
        const { id: b2 } = await client.instance.create('Borrower', { email: 'd@e.f' });
        await client.link.create({ typeName: 'Loan', id: l1 }, { typeName: 'Borrower', id: b1 }, { role: 'primary' });
        await client.link.create({ typeName: 'Loan', id: l1 }, { typeName: 'Borrower', id: b2 }, { role: 'co_borrower' });
        await client.link.create({ typeName: 'Loan', id: l2 }, { typeName: 'Borrower', id: b1 }, { role: 'primary' });
        const fromL1 = await client.link.list({ from: { typeName: 'Loan', id: l1 } });
        expect(fromL1).toHaveLength(2);
        const toB1 = await client.link.list({ to: { typeName: 'Borrower', id: b1 } });
        expect(toB1).toHaveLength(2);
        const primary = await client.link.list({ role: 'primary' });
        expect(primary).toHaveLength(2);
        const fromL1Primary = await client.link.list({
            from: { typeName: 'Loan', id: l1 },
            role: 'primary',
        });
        expect(fromL1Primary).toHaveLength(1);
        expect(fromL1Primary[0].to.id).toBe(b1);
    });
    it('caller-provided link id is honored; collision throws', async () => {
        const client = (0, client_1.createClient)(makeLendingDna());
        const { id: l1 } = await client.instance.create('Loan', { amount: 1 });
        const { id: b1 } = await client.instance.create('Borrower', { email: 'a@b.c' });
        const ref = { from: { typeName: 'Loan', id: l1 }, to: { typeName: 'Borrower', id: b1 } };
        const created = await client.link.create(ref.from, ref.to, { id: 'link-1' });
        expect(created.id).toBe('link-1');
        await expect(client.link.create(ref.from, ref.to, { id: 'link-1' })).rejects.toThrow(/already exists/);
    });
});
describe('integration/memory registry fixture round-trip', () => {
    it('round-trips Instances and Links drawn from examples/registry/operational.json', async () => {
        const dna = JSON.parse((0, fs_1.readFileSync)(REGISTRY_FIXTURE_PATH, 'utf-8'));
        const client = (0, client_1.createClient)(dna);
        await client.migrate();
        // Create one TypeDefinition Instance (a runtime row of the registry's TypeDefinition Resource).
        const { id: typeId } = await client.instance.create('TypeDefinition', {
            type_name: 'Loan',
            category: 'resource',
            attribute_schema: '{"type":"object"}',
            status: 'published',
        });
        // Create two Instance rows referencing the TypeDefinition by id.
        const { id: i1 } = await client.instance.create('Instance', {
            type_def: typeId,
            data: '{"amount":1000}',
            validation_status: 'valid',
        });
        const { id: i2 } = await client.instance.create('Instance', {
            type_def: typeId,
            data: '{"amount":2000}',
            validation_status: 'valid',
        });
        // Link the two instances via a Link Instance (registry's Link Resource).
        await client.link.create({ typeName: 'Instance', id: i1 }, { typeName: 'Instance', id: i2 }, { role: 'belongs_to' });
        const allInstances = await client.instance.list('Instance');
        expect(allInstances).toHaveLength(2);
        const typeDefs = await client.instance.list('TypeDefinition');
        expect(typeDefs).toHaveLength(1);
        const belongsTo = await client.link.list({ role: 'belongs_to' });
        expect(belongsTo).toHaveLength(1);
        expect(belongsTo[0].from).toEqual({ typeName: 'Instance', id: i1 });
        expect(belongsTo[0].to).toEqual({ typeName: 'Instance', id: i2 });
    });
});
describe('integration/memory stability', () => {
    async function seeded() {
        const client = (0, client_1.createClient)();
        await client.migrate();
        await client.seedFromDna(makeLendingDna());
        return client;
    }
    async function rtByName(client, name) {
        const all = await client.resourceType.list();
        return all.find((rt) => rt.name === name);
    }
    it('seeds the four foundational types as stable', async () => {
        const client = await seeded();
        for (const name of ['Person', 'Role', 'Group', 'Resource']) {
            expect((await rtByName(client, name)).stability).toBe('stable');
        }
    });
    it('defaults tenant resource and relationship types to experimental', async () => {
        const client = await seeded();
        expect((await rtByName(client, 'Loan')).stability).toBe('experimental');
        const rels = await client.relationshipType.list();
        expect(rels.find((r) => r.name === 'Loan.borrower').stability).toBe('experimental');
    });
    it('honors a declared stability at seed time', async () => {
        const client = (0, client_1.createClient)();
        await client.migrate();
        await client.seedFromDna({
            domain: { name: 'd', resources: [{ name: 'Widget', stability: 'beta' }] },
            relationships: [
                { name: 'Widget.maker', from: 'Widget', to: 'Maker', cardinality: 'many-to-one', attribute: 'maker_id', stability: 'stable' },
            ],
        });
        expect((await rtByName(client, 'Widget')).stability).toBe('beta');
        const rels = await client.relationshipType.list();
        expect(rels.find((r) => r.name === 'Widget.maker').stability).toBe('stable');
    });
    it('round-trips stability set at create() and records it on the version', async () => {
        const client = await seeded();
        const { id } = await client.resourceType.create({
            name: 'Invoice',
            category: 'resource',
            attribute_schema: [],
            stability: 'beta',
        });
        expect((await client.resourceType.get(id)).stability).toBe('beta');
        const versions = await client.resourceType.versions(id);
        expect(versions[0].stability).toBe('beta');
    });
    it('setStability transitions without bumping current_version or adding a version', async () => {
        const client = await seeded();
        const loan = await rtByName(client, 'Loan');
        await client.resourceType.setStability(loan.id, 'stable');
        const after = await client.resourceType.get(loan.id);
        expect(after.stability).toBe('stable');
        expect(after.current_version).toBe(loan.current_version);
        expect(await client.resourceType.versions(loan.id)).toHaveLength(1);
    });
    it('a schema-version bump preserves stability and records it on the new version', async () => {
        const client = await seeded();
        const loan = await rtByName(client, 'Loan');
        await client.resourceType.setStability(loan.id, 'beta');
        await client.resourceType.update(loan.id, { attribute_schema: [{ name: 'rate', type: 'number' }] });
        const after = await client.resourceType.get(loan.id);
        expect(after.stability).toBe('beta');
        expect(after.current_version).toBe(loan.current_version + 1);
        const versions = await client.resourceType.versions(loan.id);
        expect(versions[0].version).toBe(loan.current_version + 1);
        expect(versions[0].stability).toBe('beta');
    });
    it('relationshipType.setStability transitions without bumping current_version', async () => {
        const client = await seeded();
        const rel = (await client.relationshipType.list()).find((r) => r.name === 'Loan.borrower');
        await client.relationshipType.setStability(rel.id, 'beta');
        const after = await client.relationshipType.get(rel.id);
        expect(after.stability).toBe('beta');
        expect(after.current_version).toBe(rel.current_version);
    });
});
//# sourceMappingURL=index.test.js.map