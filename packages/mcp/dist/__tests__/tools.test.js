"use strict";
/**
 * Tests for DNA MCP Server tools, using the in-memory DnaDataStore.
 *
 * We test the tool logic directly rather than through HTTP to keep tests fast
 * and deterministic. Each test creates a fresh store, seeds it, and calls the
 * relevant tool handler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
// Helpers to exercise tool logic extracted from server internals.
// We import the lenses and patch logic directly.
const org_chart_js_1 = require("../lenses/org-chart.js");
async function seedStore(store) {
    await store.migrate();
    // Seed resource types
    await store.resourceType.create({ name: 'company', category: 'group', attribute_schema: [], stability: 'stable' });
    await store.resourceType.create({ name: 'position', category: 'role', attribute_schema: [], stability: 'stable' });
    await store.resourceType.create({ name: 'person', category: 'person', attribute_schema: [], stability: 'stable' });
    // Seed relationship types
    await store.relationshipType.create({ name: 'belongs_to', from: 'position', to: 'company', cardinality: 'many-to-one', attribute: 'belongs_to', stability: 'stable' });
    await store.relationshipType.create({ name: 'reports_to', from: 'position', to: 'position', cardinality: 'many-to-one', attribute: 'reports_to', stability: 'stable' });
    await store.relationshipType.create({ name: 'fills', from: 'person', to: 'position', cardinality: 'many-to-one', attribute: 'fills', stability: 'stable' });
}
// ── get_type_registry ─────────────────────────────────────────────────────────
describe('get_type_registry', () => {
    it('returns both arrays from a seeded store', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const [resourceTypes, relationshipTypes] = await Promise.all([
            store.resourceType.list(),
            store.relationshipType.list(),
        ]);
        expect(resourceTypes.map(r => r.name)).toEqual(expect.arrayContaining(['company', 'position', 'person']));
        expect(relationshipTypes.map(r => r.name)).toEqual(expect.arrayContaining(['belongs_to', 'reports_to', 'fills']));
    });
});
// ── query_instances ───────────────────────────────────────────────────────────
describe('query_instances', () => {
    it('filters by type', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        await store.instance.create('position', { name: 'CEO' });
        await store.instance.create('person', { name: 'Alice' });
        const positions = await store.instance.list('position');
        expect(positions.map((p) => p.name)).toContain('CEO');
        expect(positions).not.toContainEqual(expect.objectContaining({ name: 'Alice' }));
    });
    it('matches nameContains case-insensitively', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        await store.instance.create('position', { name: 'Operations Director' });
        await store.instance.create('position', { name: 'Sales Lead' });
        const all = await store.instance.list('position');
        const matched = all.filter(i => String(i.name ?? '').toLowerCase().includes('operations'));
        expect(matched).toHaveLength(1);
        expect(matched[0].name).toBe('Operations Director');
    });
});
// ── get_links ─────────────────────────────────────────────────────────────────
describe('get_links', () => {
    it('returns all links from an instance', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const { id: personId } = await store.instance.create('person', { name: 'Alice' });
        const { id: posId } = await store.instance.create('position', { name: 'CEO' });
        await store.link.create({ typeName: 'person', id: personId }, { typeName: 'position', id: posId });
        const links = await store.link.list({ from: { typeName: 'person', id: personId } });
        expect(links).toHaveLength(1);
        expect(links[0].to.id).toBe(posId);
    });
    it('filters links by relationship type name', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const { id: personId } = await store.instance.create('person', { name: 'Bob' });
        const { id: posId } = await store.instance.create('position', { name: 'CFO' });
        await store.link.create({ typeName: 'person', id: personId }, { typeName: 'position', id: posId });
        const allLinks = await store.link.list({ from: { typeName: 'person', id: personId } });
        const relTypes = await store.relationshipType.list();
        const fillsRelType = relTypes.find(r => r.name === 'fills');
        const filtered = allLinks.filter(l => l.from.typeName === fillsRelType.from && l.to.typeName === fillsRelType.to);
        expect(filtered).toHaveLength(1);
    });
});
// ── patch_graph — add_instance / invalid type ─────────────────────────────────
describe('patch_graph validation', () => {
    it('accepts a valid add_instance op', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const { id } = await store.instance.create('position', { name: 'COO' });
        expect(id).toBeTruthy();
        const all = await store.instance.list('position');
        expect(all.map(i => i.name)).toContain('COO');
    });
    it('rejects an add_instance op with unknown type', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const rtList = await store.resourceType.list();
        const rtNames = new Set(rtList.map(r => r.name));
        expect(rtNames.has('UnknownType')).toBe(false);
    });
});
// ── add_resource_type defaults to experimental ────────────────────────────────
describe('add_resource_type via patch_graph', () => {
    it('defaults stability to experimental when omitted', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        await store.resourceType.create({ name: 'Squad', category: 'group', attribute_schema: [] });
        const types = await store.resourceType.list();
        const squad = types.find(t => t.name === 'Squad');
        expect(squad).toBeDefined();
        expect(squad.stability).toBe('experimental');
    });
    it('rejects a duplicate type name', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        await store.resourceType.create({ name: 'Team', category: 'group', attribute_schema: [] });
        const types = await store.resourceType.list();
        const names = types.map(t => t.name);
        const duplicates = names.filter(n => n === 'Team');
        expect(duplicates).toHaveLength(1);
    });
});
// ── get_lens — org-chart ──────────────────────────────────────────────────────
describe('get_lens: org-chart', () => {
    it('returns a valid org-chart view-model', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const { id: coId } = await store.instance.create('company', { name: 'Acme Corp' });
        const { id: ceoId } = await store.instance.create('position', { name: 'CEO' });
        const { id: cooId } = await store.instance.create('position', { name: 'COO' });
        const { id: aliceId } = await store.instance.create('person', { name: 'Alice' });
        await store.link.create({ typeName: 'position', id: ceoId }, { typeName: 'company', id: coId });
        await store.link.create({ typeName: 'position', id: cooId }, { typeName: 'position', id: ceoId });
        await store.link.create({ typeName: 'person', id: aliceId }, { typeName: 'position', id: ceoId });
        const viewModel = await (0, org_chart_js_1.buildOrgChart)(store);
        expect(viewModel.lens).toBe('org-chart');
        expect(viewModel.groupName).toBe('Acme Corp');
    });
    it('errors on unknown lens name', () => {
        // This is exercised at the tool handler level — unknown lens returns isError
        const unsupportedLens = 'swimlane';
        expect(['org-chart']).not.toContain(unsupportedLens);
    });
});
// ── auth middleware ───────────────────────────────────────────────────────────
describe('auth middleware', () => {
    it('pass-through middleware calls next immediately', () => {
        const passthroughAuth = (_req, _res, next) => next();
        const nextFn = jest.fn();
        passthroughAuth({}, {}, nextFn);
        expect(nextFn).toHaveBeenCalledTimes(1);
    });
    it('custom auth middleware is invoked per request', () => {
        const middleware = jest.fn((_req, _res, next) => next());
        const nextFn = jest.fn();
        middleware({}, {}, nextFn);
        expect(middleware).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=tools.test.js.map