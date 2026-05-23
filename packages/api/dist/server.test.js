"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const supertest_1 = __importDefault(require("supertest"));
const memory_1 = require("@dna-codes/dna-adapters/integration/memory");
const server_1 = require("./server");
const LENDING_FIXTURE = (0, path_1.join)(__dirname, '..', '..', '..', 'examples', 'lending', 'operational.json');
function lendingDna() {
    return JSON.parse((0, fs_1.readFileSync)(LENDING_FIXTURE, 'utf-8'));
}
describe('server', () => {
    it('GET /healthz returns 200', async () => {
        const dna = lendingDna();
        const store = (0, memory_1.createClient)(dna);
        const server = await (0, server_1.createServer)({ dna, dataStore: store });
        const res = await (0, supertest_1.default)(server.expressApp).get('/healthz');
        expect(res.status).toBe(200);
        expect(res.text).toBe('ok');
        await server.apolloServer.stop();
        await store.close();
    });
    it('POST /graphql introspection succeeds', async () => {
        const dna = lendingDna();
        const store = (0, memory_1.createClient)(dna);
        const server = await (0, server_1.createServer)({ dna, dataStore: store });
        const res = await (0, supertest_1.default)(server.expressApp)
            .post('/graphql')
            .send({ query: '{ __schema { queryType { name } } }' })
            .set('Content-Type', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.data.__schema.queryType.name).toBe('Query');
        await server.apolloServer.stop();
        await store.close();
    });
    it('full create → read → delete cycle over HTTP', async () => {
        const dna = lendingDna();
        const store = (0, memory_1.createClient)(dna);
        const server = await (0, server_1.createServer)({ dna, dataStore: store });
        const create = await (0, supertest_1.default)(server.expressApp)
            .post('/graphql')
            .send({
            query: 'mutation { createLoan(input: { amount: 1000, interestRate: 0.05, borrowerId: "b1", status: PENDING }) { id amount status } }',
        })
            .set('Content-Type', 'application/json');
        expect(create.status).toBe(200);
        const created = create.body.data.createLoan;
        expect(created.amount).toBe(1000);
        const read = await (0, supertest_1.default)(server.expressApp)
            .post('/graphql')
            .send({ query: `{ loan(id: "${created.id}") { amount status } }` })
            .set('Content-Type', 'application/json');
        expect(read.body.data.loan.amount).toBe(1000);
        const del = await (0, supertest_1.default)(server.expressApp)
            .post('/graphql')
            .send({ query: `mutation { deleteLoan(id: "${created.id}") }` })
            .set('Content-Type', 'application/json');
        expect(del.body.data.deleteLoan).toBe(true);
        await server.apolloServer.stop();
        await store.close();
    });
    it('listen binds to a port and close releases it', async () => {
        const dna = lendingDna();
        const store = (0, memory_1.createClient)(dna);
        const server = await (0, server_1.createServer)({ dna, dataStore: store });
        // Use port 0 to let the OS pick an ephemeral free port.
        const handle = await server.listen(0);
        await handle.close();
        await store.close();
    });
    it('calls dataStore.migrate() during createServer', async () => {
        const dna = lendingDna();
        const store = (0, memory_1.createClient)(dna);
        const migrateSpy = jest.spyOn(store, 'migrate');
        const server = await (0, server_1.createServer)({ dna, dataStore: store });
        expect(migrateSpy).toHaveBeenCalledTimes(1);
        await server.apolloServer.stop();
        await store.close();
    });
});
//# sourceMappingURL=server.test.js.map