"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const schema_manager_1 = require("./schema-manager");
function makeSchema(rootFieldName) {
    return new graphql_1.GraphQLSchema({
        query: new graphql_1.GraphQLObjectType({
            name: 'Query',
            fields: { [rootFieldName]: { type: graphql_1.GraphQLString } },
        }),
    });
}
describe('SchemaManager', () => {
    it('rebuild() returns the freshly-built schema', async () => {
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema('foo'));
        const schema = await manager.rebuild();
        expect(schema.getQueryType()?.getFields().foo).toBeDefined();
    });
    it('getSchema() returns the last-built schema', async () => {
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema('bar'));
        await manager.rebuild();
        expect(manager.getSchema().getQueryType()?.getFields().bar).toBeDefined();
    });
    it('getSchema() throws before any rebuild', () => {
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema('x'));
        expect(() => manager.getSchema()).toThrow(/rebuild/);
    });
    it('rebuild() notifies onChange listeners with the new schema', async () => {
        let calls = 0;
        let last = null;
        let counter = 0;
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema(`v${++counter}`));
        manager.onChange((schema) => {
            calls += 1;
            last = schema;
        });
        await manager.rebuild();
        await manager.rebuild();
        expect(calls).toBe(2);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(last.getQueryType()?.getFields().v2).toBeDefined();
    });
    it('onChange() returns an unsubscribe handle', async () => {
        let calls = 0;
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema('x'));
        const unsub = manager.onChange(() => {
            calls += 1;
        });
        await manager.rebuild();
        unsub();
        await manager.rebuild();
        expect(calls).toBe(1);
    });
    it('multiple sequential rebuilds reflect successive builder outputs', async () => {
        let counter = 0;
        const manager = new schema_manager_1.SchemaManager(async () => makeSchema(`fld${++counter}`));
        await manager.rebuild();
        expect(manager.getSchema().getQueryType()?.getFields().fld1).toBeDefined();
        await manager.rebuild();
        expect(manager.getSchema().getQueryType()?.getFields().fld2).toBeDefined();
        expect(manager.getSchema().getQueryType()?.getFields().fld1).toBeUndefined();
    });
});
//# sourceMappingURL=schema-manager.test.js.map