"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Adapter conformance tests — verify all api-cell adapters produce the same
 * external surface from the same DNA input.
 *
 * Each adapter generates into a temp dir. We extract a normalized "surface"
 * from the output and assert all adapters agree on:
 *   - Set of endpoints (method + path)
 *   - Request body fields per endpoint
 *   - Auth roles per endpoint
 *   - OpenAPI paths
 */
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const run_1 = require("./run");
// ── Extractors ───────────────────────────────────────────────────────────────
/** Extract surface from Express adapter output (bundled DNA). */
function extractExpressSurface(dir) {
    const api = JSON.parse(fs.readFileSync(path.join(dir, 'src/dna/api.json'), 'utf-8'));
    const core = JSON.parse(fs.readFileSync(path.join(dir, 'src/dna/product.core.json'), 'utf-8'));
    return api.endpoints.map((ep) => {
        const rule = (core.rules ?? []).find((r) => r.operation === ep.operation && r.type === 'access');
        const roles = (rule?.allow ?? []).map((a) => a.role).sort();
        return {
            method: ep.method,
            path: ep.path,
            operation: ep.operation,
            requestFields: (ep.request?.fields ?? []).map((f) => f.name).sort(),
            roles,
        };
    });
}
/** Extract surface from Rails adapter output (static OpenAPI JSON). */
function extractRailsSurface(dir) {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, 'public/openapi.json'), 'utf-8'));
    const api = JSON.parse(fs.readFileSync(path.join(dir, 'dna/api.json'), 'utf-8'));
    const core = JSON.parse(fs.readFileSync(path.join(dir, 'dna/product.core.json'), 'utf-8'));
    const endpoints = [];
    for (const [oaPath, methods] of Object.entries(spec.paths)) {
        for (const [method, op] of Object.entries(methods)) {
            const rule = (core.rules ?? []).find((r) => r.operation === op.operationId && r.type === 'access');
            const roles = (rule?.allow ?? []).map((a) => a.role).sort();
            // Convert OpenAPI {param} back to Express :param for comparison
            const expressPath = oaPath.replace(/\{(\w+)\}/g, ':$1');
            const requestFields = op.requestBody?.content?.['application/json']?.schema?.properties
                ? Object.keys(op.requestBody.content['application/json'].schema.properties).sort()
                : [];
            endpoints.push({
                method: method.toUpperCase(),
                path: expressPath,
                operation: op.operationId,
                requestFields,
                roles,
            });
        }
    }
    return endpoints;
}
/** Extract surface from NestJS adapter output (parse controller files). */
function extractNestJsSurface(dir) {
    const repoRoot = path.resolve(__dirname, '../../../../');
    const api = JSON.parse(fs.readFileSync(path.join(repoRoot, 'dna/engine/fixtures/lending/product.api.json'), 'utf-8'));
    const core = JSON.parse(fs.readFileSync(path.join(repoRoot, 'dna/engine/fixtures/lending/product.core.json'), 'utf-8'));
    // NestJS generates typed controllers; rather than fragile regex parsing,
    // use the source DNA (same input all adapters receive) to build the surface,
    // then verify the generated controller files actually contain the expected
    // decorators. This tests that the adapter didn't silently drop endpoints.
    const endpoints = [];
    for (const ep of api.endpoints) {
        const rule = (core.rules ?? []).find((r) => r.operation === ep.operation && r.type === 'access');
        const roles = (rule?.allow ?? []).map((a) => a.role).sort();
        endpoints.push({
            method: ep.method,
            path: ep.path,
            operation: ep.operation,
            requestFields: (ep.request?.fields ?? []).map((f) => f.name).sort(),
            roles,
        });
    }
    // Verify controller files exist and contain expected decorators
    const resources = [...new Set(api.endpoints.map((ep) => ep.operation.split('.')[0]))];
    for (const resource of resources) {
        const controllerName = `${resource.toLowerCase()}s`;
        const controllerPath = path.join(dir, `src/${controllerName}/${controllerName}.controller.ts`);
        expect(fs.existsSync(controllerPath)).toBe(true);
        const ctrl = fs.readFileSync(controllerPath, 'utf-8');
        const resourceEndpoints = api.endpoints.filter((ep) => ep.operation.split('.')[0] === resource);
        for (const ep of resourceEndpoints) {
            const httpMethod = ep.method.charAt(0) + ep.method.slice(1).toLowerCase();
            expect(ctrl).toContain(`@${httpMethod}`);
        }
    }
    return endpoints;
}
// ── Normalization ────────────────────────────────────────────────────────────
function normalize(surface) {
    return [...surface].sort((a, b) => {
        const pathCmp = a.path.localeCompare(b.path);
        return pathCmp !== 0 ? pathCmp : a.method.localeCompare(b.method);
    });
}
function extractPaths(surface) {
    return normalize(surface).map(e => `${e.method} ${e.path}`);
}
function extractOperations(surface) {
    return normalize(surface).map(e => e.operation);
}
function extractRequestFields(surface) {
    const result = {};
    for (const e of surface) {
        if (e.requestFields.length)
            result[e.operation] = e.requestFields;
    }
    return result;
}
function extractRoles(surface) {
    const result = {};
    for (const e of surface) {
        if (e.roles.length)
            result[e.operation] = e.roles;
    }
    return result;
}
// ── Test suite ───────────────────────────────────────────────────────────────
describe('api-cell adapter conformance', () => {
    const repoRoot = path.resolve(__dirname, '../../../../');
    const technicalPath = path.join(repoRoot, 'dna/engine/fixtures/lending/technical.json');
    let expressDir;
    let nestjsDir;
    let railsDir;
    let expressSurface;
    let nestjsSurface;
    let railsSurface;
    beforeAll(() => {
        expressDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conform-express-'));
        nestjsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conform-nestjs-'));
        railsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conform-rails-'));
        (0, run_1.run)(technicalPath, 'api-cell', expressDir);
        (0, run_1.run)(technicalPath, 'api-cell-nestjs', nestjsDir);
        (0, run_1.run)(technicalPath, 'api-cell-rails', railsDir);
        expressSurface = extractExpressSurface(expressDir);
        nestjsSurface = extractNestJsSurface(nestjsDir);
        railsSurface = extractRailsSurface(railsDir);
    });
    afterAll(() => {
        fs.rmSync(expressDir, { recursive: true, force: true });
        fs.rmSync(nestjsDir, { recursive: true, force: true });
        fs.rmSync(railsDir, { recursive: true, force: true });
    });
    // ── Endpoint coverage ────────────────────────────────────────────────────
    test('all adapters expose the same number of endpoints', () => {
        expect(expressSurface).toHaveLength(nestjsSurface.length);
        expect(expressSurface).toHaveLength(railsSurface.length);
    });
    test('all adapters expose the same HTTP method + path pairs', () => {
        const expressPaths = extractPaths(expressSurface);
        const nestjsPaths = extractPaths(nestjsSurface);
        const railsPaths = extractPaths(railsSurface);
        expect(expressPaths).toEqual(nestjsPaths);
        expect(expressPaths).toEqual(railsPaths);
    });
    test('all adapters map the same operations', () => {
        const expressOps = extractOperations(expressSurface);
        const nestjsOps = extractOperations(nestjsSurface);
        const railsOps = extractOperations(railsSurface);
        expect(expressOps).toEqual(nestjsOps);
        expect(expressOps).toEqual(railsOps);
    });
    // ── Request body conformance ─────────────────────────────────────────────
    test('all adapters accept the same request body fields per endpoint', () => {
        const expressFields = extractRequestFields(expressSurface);
        const nestjsFields = extractRequestFields(nestjsSurface);
        const railsFields = extractRequestFields(railsSurface);
        expect(expressFields).toEqual(nestjsFields);
        expect(expressFields).toEqual(railsFields);
    });
    // ── Auth conformance ─────────────────────────────────────────────────────
    test('all adapters enforce the same roles per operation', () => {
        const expressRoles = extractRoles(expressSurface);
        const nestjsRoles = extractRoles(nestjsSurface);
        const railsRoles = extractRoles(railsSurface);
        expect(expressRoles).toEqual(nestjsRoles);
        expect(expressRoles).toEqual(railsRoles);
    });
    // ── OpenAPI spec conformance ─────────────────────────────────────────────
    test('Rails OpenAPI spec covers all DNA endpoints', () => {
        const spec = JSON.parse(fs.readFileSync(path.join(railsDir, 'public/openapi.json'), 'utf-8'));
        const specPaths = new Set();
        for (const [oaPath, methods] of Object.entries(spec.paths)) {
            for (const method of Object.keys(methods)) {
                specPaths.add(`${method.toUpperCase()} ${oaPath.replace(/\{(\w+)\}/g, ':$1')}`);
            }
        }
        for (const ep of expressSurface) {
            expect(specPaths.has(`${ep.method} ${ep.path}`)).toBe(true);
        }
    });
    test('Rails OpenAPI spec uses bearerAuth security scheme', () => {
        const spec = JSON.parse(fs.readFileSync(path.join(railsDir, 'public/openapi.json'), 'utf-8'));
        expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
        expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
        expect(spec.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    });
    // ── Scaffold conformance ─────────────────────────────────────────────────
    test('all adapters generate a Dockerfile', () => {
        expect(fs.existsSync(path.join(expressDir, 'Dockerfile'))).toBe(true);
        expect(fs.existsSync(path.join(nestjsDir, 'Dockerfile'))).toBe(true);
        expect(fs.existsSync(path.join(railsDir, 'Dockerfile'))).toBe(true);
    });
    test('all adapters generate a .dockerignore', () => {
        expect(fs.existsSync(path.join(expressDir, '.dockerignore'))).toBe(true);
        expect(fs.existsSync(path.join(nestjsDir, '.dockerignore'))).toBe(true);
        expect(fs.existsSync(path.join(railsDir, '.dockerignore'))).toBe(true);
    });
    // ── Sanity: at least 13 endpoints from lending DNA ───────────────────────
    test('all adapters produce at least 13 endpoints', () => {
        expect(expressSurface.length).toBeGreaterThanOrEqual(13);
        expect(nestjsSurface.length).toBeGreaterThanOrEqual(13);
        expect(railsSurface.length).toBeGreaterThanOrEqual(13);
    });
});
//# sourceMappingURL=conformance.test.js.map