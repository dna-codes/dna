"use strict";
/**
 * Tests for Build/Operate mode gating in patch validation.
 *
 * Locking is derived from session mode: Build is open (type-schema ops allowed),
 * Operate is locked (type-schema ops rejected). Instance ops are allowed in both.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const server_js_1 = require("../server.js");
async function seedStore(store) {
    await store.migrate();
    await store.resourceType.create({ name: 'company', category: 'group', attribute_schema: [], stability: 'stable' });
    await store.resourceType.create({ name: 'position', category: 'role', attribute_schema: [], stability: 'stable' });
}
const addResourceType = { op: 'add_resource_type', name: 'Squad', category: 'group' };
const addRelationshipType = { op: 'add_relationship_type', name: 'pairs_with', from_type: 'position', to_type: 'position' };
const addInstance = { op: 'add_instance', type: 'position', name: 'CEO' };
describe('mode gating in validatePatchOps', () => {
    it('Build mode allows add_resource_type and add_relationship_type', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addResourceType, addRelationshipType], store, 'build');
        expect(violations).toEqual([]);
    });
    it('Operate mode rejects add_resource_type with the lock message', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addResourceType], store, 'operate');
        expect(violations).toHaveLength(1);
        expect(violations[0]).toContain('locked in Operate mode');
        expect(violations[0]).toContain('switch to Build mode');
    });
    it('Operate mode rejects add_relationship_type', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addRelationshipType], store, 'operate');
        expect(violations).toHaveLength(1);
        expect(violations[0]).toContain('locked in Operate mode');
    });
    it('Operate mode allows add_instance', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addInstance], store, 'operate');
        expect(violations).toEqual([]);
    });
    it('Build mode allows add_instance', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addInstance], store, 'build');
        expect(violations).toEqual([]);
    });
    it('defaults to Build (open) when mode is omitted', async () => {
        const store = (0, memory_1.createClient)();
        await seedStore(store);
        const violations = await (0, server_js_1.validatePatchOps)([addResourceType], store);
        expect(violations).toEqual([]);
    });
});
//# sourceMappingURL=mode.test.js.map