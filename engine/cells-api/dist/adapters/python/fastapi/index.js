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
exports.generate = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("../../../utils");
const naming_1 = require("./generators/naming");
const models_1 = require("./generators/models");
const schemas_1 = require("./generators/schemas");
const router_1 = require("./generators/router");
const auth_1 = require("./generators/auth");
const database_1 = require("./generators/database");
const main_1 = require("./generators/main");
const seed_1 = require("./generators/seed");
const openapi_1 = require("./generators/openapi");
const docker_1 = require("./generators/docker");
const scaffold_1 = require("./generators/scaffold");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
function endpointsForResource(resourceName, endpoints) {
    return endpoints.filter(ep => ep.operation.split('.')[0] === resourceName);
}
const generate = (api, core, outputDir, authConfig) => {
    const resources = api.resources ?? [];
    const operations = api.operations ?? [];
    const rules = core.rules ?? [];
    const coreOperations = core.operations ?? [];
    const nouns = (0, utils_1.collectNouns)(core);
    // ── Database ──────────────────────────────────────────────────────────────
    write(outputDir, 'app/database.py', (0, database_1.generateDatabase)());
    // ── Models (one per Noun) ─────────────────────────────────────────────────
    for (const noun of nouns) {
        write(outputDir, `app/models/${(0, naming_1.toModelFileName)(noun.name)}`, (0, models_1.generateModel)(noun));
    }
    write(outputDir, 'app/models/__init__.py', (0, models_1.generateModelsInit)(nouns));
    // ── Pydantic schemas (one per Resource) ───────────────────────────────────
    for (const resource of resources) {
        const endpoints = endpointsForResource(resource.name, api.endpoints);
        write(outputDir, `app/schemas/${(0, naming_1.toSchemaFileName)(resource.name)}`, (0, schemas_1.generateResourceSchemas)(resource, endpoints));
    }
    write(outputDir, 'app/schemas/__init__.py', (0, schemas_1.generateSchemasInit)(resources));
    // ── Auth ──────────────────────────────────────────────────────────────────
    write(outputDir, 'app/flags.py', (0, auth_1.generateFlags)());
    write(outputDir, 'app/auth.py', (0, auth_1.generateAuth)(authConfig));
    // ── Routers (one per Resource) ────────────────────────────────────────────
    for (const resource of resources) {
        const endpoints = endpointsForResource(resource.name, api.endpoints);
        // The signals/Outcome plumbing was removed with the operational rewrite —
        // emit_signal helpers are intentionally absent now.
        write(outputDir, `app/routers/${(0, naming_1.toRouterFileName)(resource.name)}`, (0, router_1.generateRouter)(resource, endpoints, operations, rules, coreOperations, api.namespace));
    }
    write(outputDir, 'app/routers/__init__.py', (0, router_1.generateRoutersInit)(resources, api.namespace));
    // ── App entrypoint ────────────────────────────────────────────────────────
    write(outputDir, 'app/main.py', (0, main_1.generateMain)(api.namespace));
    write(outputDir, 'app/__init__.py', (0, scaffold_1.generateAppInit)());
    // ── Seed ──────────────────────────────────────────────────────────────────
    write(outputDir, 'seed.py', (0, seed_1.generateSeed)(nouns));
    // ── Static OpenAPI spec ───────────────────────────────────────────────────
    write(outputDir, 'openapi.json', (0, openapi_1.generateOpenApiSpec)(api));
    // ── Scaffold ──────────────────────────────────────────────────────────────
    write(outputDir, 'requirements.txt', (0, scaffold_1.generateRequirements)());
    write(outputDir, 'pyproject.toml', (0, scaffold_1.generatePyprojectToml)(api.namespace));
    write(outputDir, '.env', (0, scaffold_1.generateEnv)());
    // ── Alembic ───────────────────────────────────────────────────────────────
    write(outputDir, 'alembic.ini', (0, scaffold_1.generateAlembicIni)());
    write(outputDir, 'alembic/env.py', (0, scaffold_1.generateAlembicEnvPy)());
    write(outputDir, 'alembic/script.py.mako', (0, scaffold_1.generateAlembicScriptMako)());
    write(outputDir, 'alembic/versions/.gitkeep', '');
    // ── Copy DNA into output for reference ────────────────────────────────────
    write(outputDir, 'dna/api.json', JSON.stringify(api, null, 2) + '\n');
    write(outputDir, 'dna/product.core.json', JSON.stringify(core, null, 2) + '\n');
    // ── Containerization ──────────────────────────────────────────────────────
    write(outputDir, 'Dockerfile', (0, docker_1.generateDockerfile)());
    write(outputDir, '.dockerignore', (0, docker_1.generateDockerIgnore)());
};
exports.generate = generate;
//# sourceMappingURL=index.js.map