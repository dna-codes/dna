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
const controller_1 = require("./generators/controller");
const model_1 = require("./generators/model");
const routes_1 = require("./generators/routes");
const migration_1 = require("./generators/migration");
const auth_1 = require("./generators/auth");
const seeds_1 = require("./generators/seeds");
const openapi_1 = require("./generators/openapi");
const docker_1 = require("./generators/docker");
const scaffold_1 = require("./generators/scaffold");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
function writeExecutable(outputDir, relPath, content) {
    write(outputDir, relPath, content);
    fs.chmodSync(path.join(outputDir, relPath), 0o755);
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
    // ── Per-resource controllers ──────────────────────────────────────────────
    // Signals/Outcome plumbing was dropped with the operational rewrite —
    // controllers no longer publish events.
    for (const resource of resources) {
        const endpoints = endpointsForResource(resource.name, api.endpoints);
        write(outputDir, `app/controllers/${(0, naming_1.toControllerFileName)(resource.name)}`, (0, controller_1.generateController)(resource, endpoints, operations, rules, coreOperations, api.namespace));
    }
    // ── Models (one per Noun) ─────────────────────────────────────────────────
    for (const noun of nouns) {
        write(outputDir, `app/models/${(0, naming_1.toModelFileName)(noun.name)}`, (0, model_1.generateModel)(noun));
    }
    // ── ApplicationRecord base ────────────────────────────────────────────────
    write(outputDir, 'app/models/application_record.rb', `class ApplicationRecord < ActiveRecord::Base\n  primary_abstract_class\nend\n`);
    // ── Auth ──────────────────────────────────────────────────────────────────
    write(outputDir, 'app/controllers/application_controller.rb', (0, auth_1.generateApplicationController)(authConfig));
    write(outputDir, 'lib/jwt_verifier.rb', (0, auth_1.generateJwtVerifier)());
    // ── API docs ──────────────────────────────────────────────────────────────
    write(outputDir, 'app/controllers/docs_controller.rb', (0, openapi_1.generateDocsController)(api.namespace));
    write(outputDir, 'public/openapi.json', (0, openapi_1.generateOpenApiSpec)(api));
    // ── Routes ────────────────────────────────────────────────────────────────
    write(outputDir, 'config/routes.rb', (0, routes_1.generateRoutes)(api));
    // ── Database migration ────────────────────────────────────────────────────
    const timestamp = '20240101000000';
    write(outputDir, `db/migrate/${(0, migration_1.migrationFileName)(timestamp)}`, (0, migration_1.generateMigration)(nouns, timestamp));
    // ── Seeds ─────────────────────────────────────────────────────────────────
    write(outputDir, 'db/seeds.rb', (0, seeds_1.generateSeeds)(nouns));
    // ── Config & scaffold ─────────────────────────────────────────────────────
    write(outputDir, 'Gemfile', (0, scaffold_1.generateGemfile)());
    write(outputDir, 'config/database.yml', (0, scaffold_1.generateDatabaseYml)());
    write(outputDir, 'config/application.rb', (0, scaffold_1.generateApplicationRb)(api.namespace));
    write(outputDir, 'config/boot.rb', (0, scaffold_1.generateBootRb)());
    write(outputDir, 'config/environment.rb', (0, scaffold_1.generateEnvironmentRb)());
    write(outputDir, 'config/environments/development.rb', (0, scaffold_1.generateDevelopmentRb)());
    write(outputDir, 'config/environments/production.rb', (0, scaffold_1.generateProductionRb)());
    write(outputDir, 'config/environments/test.rb', (0, scaffold_1.generateTestRb)());
    write(outputDir, 'config/puma.rb', (0, scaffold_1.generatePumaRb)());
    write(outputDir, 'Rakefile', (0, scaffold_1.generateRakefile)());
    write(outputDir, 'config.ru', (0, scaffold_1.generateConfigRu)());
    write(outputDir, '.env', (0, scaffold_1.generateEnv)());
    // ── Bin scripts ────────────────────────────────────────────────────────────
    writeExecutable(outputDir, 'bin/rails', (0, scaffold_1.generateBinRails)());
    writeExecutable(outputDir, 'bin/rake', (0, scaffold_1.generateBinRake)());
    writeExecutable(outputDir, 'bin/setup', (0, scaffold_1.generateBinSetup)());
    // ── Copy DNA into output for reference ─────────────────────────────────────
    write(outputDir, 'dna/api.json', JSON.stringify(api, null, 2) + '\n');
    write(outputDir, 'dna/product.core.json', JSON.stringify(core, null, 2) + '\n');
    // ── Containerization ──────────────────────────────────────────────────────
    write(outputDir, 'Dockerfile', (0, docker_1.generateDockerfile)());
    write(outputDir, '.dockerignore', (0, docker_1.generateDockerIgnore)());
    // ── Gitkeep for empty dirs Rails expects ──────────────────────────────────
    for (const dir of ['log', 'tmp/pids', 'tmp/cache']) {
        write(outputDir, `${dir}/.gitkeep`, '');
    }
};
exports.generate = generate;
//# sourceMappingURL=index.js.map