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
const docker_1 = require("../docker");
const schema_1 = require("./generators/schema");
const dto_1 = require("./generators/dto");
const controller_1 = require("./generators/controller");
const service_1 = require("./generators/service");
const module_1 = require("./generators/module");
const auth_1 = require("./generators/auth");
const app_1 = require("./generators/app");
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
    // ── Per-resource files ──────────────────────────────────────────────────────
    for (const resource of resources) {
        const endpoints = endpointsForResource(resource.name, api.endpoints);
        const fileName = (0, utils_1.toFileName)(resource.name);
        const dir = `src/${fileName}`;
        // Controller
        write(outputDir, `${dir}/${fileName}.controller.ts`, (0, controller_1.generateController)(resource, endpoints, operations, rules, api.namespace));
        // Service — passes core operations so the generator can consult `changes[]`.
        // (Signal/Outcome plumbing was removed with the operational rewrite.)
        write(outputDir, `${dir}/${fileName}.service.ts`, (0, service_1.generateService)(resource, endpoints, coreOperations, rules));
        // Module
        write(outputDir, `${dir}/${fileName}.module.ts`, (0, module_1.generateModule)(resource));
        // DTOs — one file per endpoint with a request body
        for (const ep of endpoints) {
            if (!ep.request?.fields?.length)
                continue;
            const action = ep.operation.split('.')[1];
            const dtoContent = (0, dto_1.generateDto)(ep, resource.name);
            if (dtoContent) {
                write(outputDir, `${dir}/dto/${(0, dto_1.dtoFileName)(action, resource.name)}.ts`, dtoContent);
            }
        }
    }
    // ── Drizzle schema ──────────────────────────────────────────────────────────
    write(outputDir, 'src/db/schema.ts', (0, schema_1.generateDrizzleSchema)(nouns));
    write(outputDir, 'src/db/index.ts', (0, schema_1.generateDbIndex)());
    // ── Auth ────────────────────────────────────────────────────────────────────
    write(outputDir, 'src/auth/auth.guard.ts', (0, auth_1.generateAuthGuard)(authConfig));
    write(outputDir, 'src/auth/roles.decorator.ts', (0, auth_1.generateRolesDecorator)());
    write(outputDir, 'src/auth/flags.ts', (0, auth_1.generateFlags)());
    // ── App shell ───────────────────────────────────────────────────────────────
    write(outputDir, 'src/app.module.ts', (0, app_1.generateAppModule)(resources));
    write(outputDir, 'src/main.ts', (0, app_1.generateMain)(api.namespace));
    // ── Scaffold ────────────────────────────────────────────────────────────────
    const appName = api.namespace.name.toLowerCase() + '-api';
    write(outputDir, 'package.json', (0, scaffold_1.generatePackageJson)(appName));
    write(outputDir, 'tsconfig.json', (0, scaffold_1.generateTsConfig)());
    write(outputDir, 'tsconfig.build.json', (0, scaffold_1.generateTsConfigBuild)());
    write(outputDir, 'drizzle.config.ts', (0, scaffold_1.generateDrizzleConfig)());
    write(outputDir, '.env', (0, scaffold_1.generateEnv)());
    // ── Containerization (node runtime) ─────────────────────────────────────────
    write(outputDir, 'Dockerfile', (0, docker_1.generateDockerfile)());
    write(outputDir, '.dockerignore', (0, docker_1.generateDockerIgnore)());
};
exports.generate = generate;
//# sourceMappingURL=index.js.map