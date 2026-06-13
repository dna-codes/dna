"use strict";
/**
 * Tests for the type-registry view-model — the type-level lens source consumed
 * by Build-mode lenses. It must list every registered type with no instances
 * present (Build mode has types but no data).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const type_registry_js_1 = require("../lenses/type-registry.js");
async function seedTypes(store) {
    await store.migrate();
    await store.resourceType.create({ name: 'company', category: 'group', attribute_schema: [], stability: 'stable' });
    await store.resourceType.create({
        name: 'position', category: 'role',
        attribute_schema: [{ name: 'title', type: 'string', required: true }],
        stability: 'experimental', description: 'A role in the org',
    });
    await store.relationshipType.create({ name: 'reports_to', from: 'position', to: 'position', cardinality: 'many-to-one', attribute: 'reports_to', stability: 'beta' });
    await store.relationshipType.create({ name: 'belongs_to', from: 'position', to: 'company', cardinality: 'many-to-one', attribute: 'belongs_to', stability: 'stable' });
}
describe('buildTypeRegistryGraph', () => {
    it('lists every resource and relationship type with no instances present', async () => {
        const store = (0, memory_1.createClient)();
        await seedTypes(store);
        const vm = await (0, type_registry_js_1.buildTypeRegistryGraph)(store);
        expect(vm.lens).toBe('type-registry');
        expect(vm.resourceTypes.map(r => r.name)).toEqual(expect.arrayContaining(['company', 'position']));
        expect(vm.relationshipTypes.map(r => r.name)).toEqual(expect.arrayContaining(['reports_to', 'belongs_to']));
    });
    it('carries stability and attribute metadata on resource-type nodes', async () => {
        const store = (0, memory_1.createClient)();
        await seedTypes(store);
        const vm = await (0, type_registry_js_1.buildTypeRegistryGraph)(store);
        const position = vm.resourceTypes.find(r => r.name === 'position');
        expect(position.category).toBe('role');
        expect(position.stability).toBe('experimental');
        expect(position.description).toBe('A role in the org');
        expect(position.attributes).toEqual([{ name: 'title', type: 'string', required: true }]);
    });
    it('emits relationship types as directed edges with from/to and cardinality', async () => {
        const store = (0, memory_1.createClient)();
        await seedTypes(store);
        const vm = await (0, type_registry_js_1.buildTypeRegistryGraph)(store);
        const reportsTo = vm.relationshipTypes.find(r => r.name === 'reports_to');
        expect(reportsTo.from).toBe('position');
        expect(reportsTo.to).toBe('position'); // self-edge preserved
        expect(reportsTo.cardinality).toBe('many-to-one');
        expect(reportsTo.stability).toBe('beta');
    });
    it('does not require any instances to be populated', async () => {
        const store = (0, memory_1.createClient)();
        await store.migrate();
        await store.resourceType.create({ name: 'thing', category: 'resource', attribute_schema: [], stability: 'experimental' });
        const vm = await (0, type_registry_js_1.buildTypeRegistryGraph)(store);
        expect(vm.resourceTypes).toHaveLength(1);
        expect(vm.relationshipTypes).toHaveLength(0);
    });
});
//# sourceMappingURL=type-registry.test.js.map