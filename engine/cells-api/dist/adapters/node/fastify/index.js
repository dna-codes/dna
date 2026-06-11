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
const drizzle_1 = require("../shared/drizzle");
const scaffold_1 = require("./generators/scaffold");
const main_1 = require("./generators/main");
const auth_1 = require("./generators/auth");
const auth_routes_1 = require("./generators/auth-routes");
const store_1 = require("./generators/store");
const handler_1 = require("./generators/handler");
const openapi_1 = require("./generators/openapi");
const router_1 = require("./generators/router");
const validators_1 = require("./generators/validators");
const db_1 = require("./generators/db");
const seed_1 = require("./generators/seed");
function write(outputDir, relPath, content) {
    const fullPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
}
/**
 * Fastify api-cell adapter. The same generated app runs as either:
 *   - an ECS-hosted service (`compute: 'ecs'`, the default) — Fastify listens
 *     on `:PORT` exactly like the express adapter; or
 *   - an AWS Lambda function (`compute: 'lambda'`) — Fastify is wrapped with
 *     `@fastify/aws-lambda` in streaming mode and exported as a Lambda
 *     handler, no listener.
 *
 * 95% of the generated files are identical across compute targets. Only
 * `src/main.ts` (ECS) vs `src/handler.ts` (Lambda), `package.json`
 * dependencies, and a few build settings differ.
 *
 * OpenAPI-as-contract seam — partial. The runtime spec served at `/api-json`
 * is rendered by `@dna-codes/dna-output-openapi` (see `generators/openapi.ts`)
 * — DNA → OpenAPI translation lives upstream, not in cba. Route registration
 * (`registerRoutes`) still consumes `product.api.json` directly; flipping it
 * to consume the OpenAPI document is a separate, larger change (param
 * parsing, validation middleware, error shapes) deferred to a follow-on.
 * Both compute targets currently read `product.api.json` for routing.
 */
const generate = (api, core, outputDir, authConfig, adapterConfig) => {
    const appName = api.namespace.name.toLowerCase() + '-api';
    const nouns = (0, utils_1.collectNouns)(core);
    const authMode = authConfig?.provider;
    const compute = adapterConfig?.compute ?? 'ecs';
    // ── DNA — loaded at runtime ─────────────────────────────────────────────────
    write(outputDir, 'src/dna/api.json', JSON.stringify(api, null, 2) + '\n');
    write(outputDir, 'src/dna/product.core.json', JSON.stringify(core, null, 2) + '\n');
    if (authConfig) {
        write(outputDir, 'src/dna/auth.json', JSON.stringify(authConfig, null, 2) + '\n');
    }
    // ── Database — Drizzle schema + connection ──────────────────────────────────
    write(outputDir, 'src/db/schema.ts', (0, drizzle_1.generateDrizzleSchema)(nouns));
    write(outputDir, 'src/db/index.ts', (0, db_1.generateDbConnection)());
    // ── Runtime interpreter — generic, reads DNA at startup ─────────────────────
    write(outputDir, 'src/interpreter/flags.ts', (0, auth_1.generateFlags)());
    write(outputDir, 'src/interpreter/auth.ts', (0, auth_1.generateAuth)(authMode));
    if (authMode === 'built-in') {
        write(outputDir, 'src/interpreter/auth-routes.ts', (0, auth_routes_1.generateAuthRoutes)());
    }
    write(outputDir, 'src/interpreter/store.ts', (0, store_1.generateStore)());
    write(outputDir, 'src/interpreter/drizzle-store.ts', (0, db_1.generateDrizzleStore)());
    write(outputDir, 'src/interpreter/validators.ts', (0, validators_1.generateValidators)());
    write(outputDir, 'src/interpreter/handler.ts', (0, handler_1.generateHandler)());
    write(outputDir, 'src/interpreter/openapi.ts', (0, openapi_1.generateOpenApi)());
    write(outputDir, 'src/interpreter/router.ts', (0, router_1.generateRouter)());
    // ── Entry point + seed ──────────────────────────────────────────────────────
    // main.ts is always emitted: ECS uses it as its listener; Lambda uses it for
    // local dev (`npm run start:dev`) so contributors can hit /health and /api
    // without deploying. handler.ts is the Lambda runtime entrypoint and is the
    // only file that imports @fastify/aws-lambda — gating it on compute keeps
    // ECS bundles free of an unused dep and the corresponding TS import error.
    write(outputDir, 'src/main.ts', (0, main_1.generateMain)(api.namespace, authMode));
    if (compute === 'lambda') {
        write(outputDir, 'src/handler.ts', (0, main_1.generateLambdaHandler)(api.namespace, authMode));
    }
    write(outputDir, 'src/seed.ts', (0, seed_1.generateSeed)());
    // ── Scaffold ────────────────────────────────────────────────────────────────
    write(outputDir, 'package.json', (0, scaffold_1.generatePackageJson)(appName, compute));
    write(outputDir, 'tsconfig.json', (0, scaffold_1.generateTsConfig)());
    write(outputDir, '.env', (0, scaffold_1.generateEnv)());
    write(outputDir, 'drizzle.config.ts', (0, drizzle_1.generateDrizzleConfig)());
    // ── Docker (ECS only) ───────────────────────────────────────────────────────
    if (compute === 'ecs') {
        write(outputDir, 'Dockerfile', (0, docker_1.generateDockerfile)());
        write(outputDir, '.dockerignore', (0, docker_1.generateDockerIgnore)());
    }
};
exports.generate = generate;
//# sourceMappingURL=index.js.map