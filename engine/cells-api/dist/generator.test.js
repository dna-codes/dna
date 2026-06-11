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
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
const schema_1 = require("./adapters/node/nestjs/generators/schema");
const dto_1 = require("./adapters/node/nestjs/generators/dto");
const controller_1 = require("./adapters/node/nestjs/generators/controller");
const service_1 = require("./adapters/node/nestjs/generators/service");
const module_1 = require("./adapters/node/nestjs/generators/module");
const auth_1 = require("./adapters/node/nestjs/generators/auth");
const auth_2 = require("./adapters/node/express/generators/auth");
const docker_1 = require("./adapters/node/docker");
const run_1 = require("./run");
// ── Fixtures ──────────────────────────────────────────────────────────────────
const loanNoun = {
    name: 'Loan',
    description: 'A financial loan.',
    attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'enum', required: true, values: ['pending', 'active', 'repaid'] },
        { name: 'due_date', type: 'date' },
        { name: 'approved_at', type: 'datetime' },
    ],
};
const loanResource = {
    name: 'Loan',
    noun: 'Loan',
    fields: [],
    actions: [{ name: 'Apply', verb: 'Apply' }, { name: 'Approve', verb: 'Approve' }],
};
const namespace = { name: 'Lending', path: '/lending', resources: ['Loan'] };
const applyEndpoint = {
    method: 'POST',
    path: '/lending/loans',
    operation: 'Loan.Apply',
    description: 'Submit a loan application.',
    request: {
        name: 'ApplyLoanRequest',
        fields: [
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'term_months', label: 'Term', type: 'number', required: true },
            { name: 'purpose', label: 'Purpose', type: 'string' },
        ],
    },
};
const approveEndpoint = {
    method: 'PATCH',
    path: '/lending/loans/:id/approve',
    operation: 'Loan.Approve',
    description: 'Approve a loan.',
    params: [{ name: 'id', in: 'path', type: 'string', required: true }],
    request: {
        name: 'ApproveLoanRequest',
        fields: [
            { name: 'interest_rate', label: 'Interest Rate', type: 'number', required: true },
            { name: 'due_date', label: 'Due Date', type: 'date', required: true },
        ],
    },
};
const viewEndpoint = {
    method: 'GET',
    path: '/lending/loans/:id',
    operation: 'Loan.View',
    params: [{ name: 'id', in: 'path', type: 'string', required: true }],
};
const listEndpoint = {
    method: 'GET',
    path: '/lending/loans',
    operation: 'Loan.List',
    params: [
        { name: 'status', in: 'query', type: 'string' },
        { name: 'borrower_id', in: 'query', type: 'string' },
    ],
};
// ── utils ─────────────────────────────────────────────────────────────────────
describe('utils', () => {
    test('toKebabCase', () => {
        expect((0, utils_1.toKebabCase)('Loan')).toBe('loan');
        expect((0, utils_1.toKebabCase)('LoanApplication')).toBe('loan-application');
        expect((0, utils_1.toKebabCase)('BorrowerProfile')).toBe('borrower-profile');
    });
    test('toTableName', () => {
        expect((0, utils_1.toTableName)('Loan')).toBe('loans');
        expect((0, utils_1.toTableName)('Borrower')).toBe('borrowers');
        expect((0, utils_1.toTableName)('LoanApplication')).toBe('loan_applications');
    });
    test('toCamelCase', () => {
        expect((0, utils_1.toCamelCase)('Approve')).toBe('approve');
        expect((0, utils_1.toCamelCase)('Apply')).toBe('apply');
        expect((0, utils_1.toCamelCase)('LoanApply')).toBe('loanApply');
    });
    test('toFileName', () => {
        expect((0, utils_1.toFileName)('Loan')).toBe('loans');
        expect((0, utils_1.toFileName)('Borrower')).toBe('borrowers');
    });
    test('collectNouns returns the flat resources array from a product core', () => {
        const nouns = (0, utils_1.collectNouns)({
            resources: [{ name: 'Borrower' }, { name: 'Loan' }],
        });
        expect(nouns).toHaveLength(2);
        expect(nouns.map(n => n.name)).toEqual(['Borrower', 'Loan']);
    });
    test('collectNouns tolerates a missing nouns array', () => {
        expect((0, utils_1.collectNouns)({})).toEqual([]);
    });
});
// ── Drizzle schema ────────────────────────────────────────────────────────────
describe('generateDrizzleSchema', () => {
    const sql = (0, schema_1.generateDrizzleSchema)([loanNoun]);
    test('imports from drizzle-orm/pg-core', () => {
        expect(sql).toContain("from 'drizzle-orm/pg-core'");
    });
    test('exports a pgTable for the noun', () => {
        expect(sql).toContain("export const loans = pgTable('loans'");
    });
    test('maps id to primaryKey', () => {
        expect(sql).toContain("text('id').primaryKey().notNull()");
    });
    test('maps number to numeric', () => {
        expect(sql).toContain("numeric('amount').notNull()");
    });
    test('maps enum to text with comment', () => {
        expect(sql).toContain("text('status').notNull()");
        expect(sql).toContain('// pending | active | repaid');
    });
    test('maps date to date', () => {
        expect(sql).toContain("date('due_date')");
    });
    test('maps datetime to timestamp with timezone', () => {
        expect(sql).toContain("timestamp('approved_at', { withTimezone: true })");
    });
    test('always includes created_at and updated_at', () => {
        expect(sql).toContain("timestamp('created_at', { withTimezone: true }).notNull().defaultNow()");
        expect(sql).toContain("timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()");
    });
});
// ── DTO ───────────────────────────────────────────────────────────────────────
describe('generateDto', () => {
    test('dtoClassName', () => {
        expect((0, dto_1.dtoClassName)('Apply', 'Loan')).toBe('ApplyLoanDto');
        expect((0, dto_1.dtoClassName)('Approve', 'Loan')).toBe('ApproveLoanDto');
    });
    test('dtoFileName', () => {
        expect((0, dto_1.dtoFileName)('Apply', 'Loan')).toBe('apply-loan.dto');
        expect((0, dto_1.dtoFileName)('Approve', 'Loan')).toBe('approve-loan.dto');
    });
    test('generates DTO class with correct name', () => {
        const dto = (0, dto_1.generateDto)(applyEndpoint, 'Loan');
        expect(dto).toContain('export class ApplyLoanDto');
    });
    test('required fields have validators without @IsOptional', () => {
        const dto = (0, dto_1.generateDto)(applyEndpoint, 'Loan');
        expect(dto).toContain('@IsNumber()');
        expect(dto).not.toMatch(/@IsOptional\(\)\s+@IsNumber\(\)\s+amount/);
    });
    test('optional fields have @IsOptional', () => {
        const dto = (0, dto_1.generateDto)(applyEndpoint, 'Loan');
        expect(dto).toContain('@IsOptional()');
        expect(dto).toContain('purpose?: string');
    });
    test('returns null for endpoints without request body', () => {
        expect((0, dto_1.generateDto)(viewEndpoint, 'Loan')).toBeNull();
        expect((0, dto_1.generateDto)(listEndpoint, 'Loan')).toBeNull();
    });
    test('imports from class-validator', () => {
        const dto = (0, dto_1.generateDto)(applyEndpoint, 'Loan');
        expect(dto).toContain("from 'class-validator'");
    });
});
// ── Controller ────────────────────────────────────────────────────────────────
describe('generateController', () => {
    const endpoints = [applyEndpoint, viewEndpoint, listEndpoint, approveEndpoint];
    const rules = [
        { operation: 'Loan.Apply', type: 'access', allow: [{ role: 'borrower' }] },
        { operation: 'Loan.Approve', type: 'access', allow: [{ role: 'underwriter' }] },
    ];
    const ctrl = (0, controller_1.generateController)(loanResource, endpoints, [], rules, namespace);
    test('declares @Controller with correct base path', () => {
        expect(ctrl).toContain("@Controller('lending/loans')");
    });
    test('imports from @nestjs/common', () => {
        expect(ctrl).toContain("from '@nestjs/common'");
    });
    test('has @Post() for apply', () => {
        expect(ctrl).toContain('@Post()');
    });
    test('has @Patch with relative sub-path for approve', () => {
        expect(ctrl).toContain("@Patch(':id/approve')");
    });
    test('has @Get with :id for view', () => {
        expect(ctrl).toContain("@Get(':id')");
    });
    test('has @Roles for operations with policies', () => {
        expect(ctrl).toContain("@Roles('borrower')");
        expect(ctrl).toContain("@Roles('underwriter')");
    });
    test('emits @AccessAllow with full entries when rule has flags, and no @Roles for that op', () => {
        const ruleWithFlag = {
            operation: 'Loan.Approve',
            type: 'access',
            allow: [
                { role: 'underwriter', flags: ['new_approval_flow'] },
                { role: 'senior_underwriter' },
            ],
        };
        const flaggedCtrl = (0, controller_1.generateController)(loanResource, [approveEndpoint], [], [ruleWithFlag], namespace);
        // @AccessAllow is the new decorator carrying the structured entries.
        expect(flaggedCtrl).toContain('@AccessAllow(');
        expect(flaggedCtrl).toContain('"flags":["new_approval_flow"]');
        expect(flaggedCtrl).toContain('"role":"senior_underwriter"');
        // For a rule with flags, fall through to @AccessAllow only (no @Roles).
        expect(flaggedCtrl).not.toContain("@Roles('underwriter'");
        // AccessAllow must be imported.
        expect(flaggedCtrl).toContain('AccessAllow');
    });
    test('uses @UseGuards(AuthGuard)', () => {
        expect(ctrl).toContain('@UseGuards(AuthGuard)');
    });
    test('has @Param for path params', () => {
        expect(ctrl).toContain("@Param('id') id: string");
    });
    test('has @Query for query params', () => {
        expect(ctrl).toContain("@Query('status') status?: string");
    });
});
// ── Service ───────────────────────────────────────────────────────────────────
describe('generateService', () => {
    const endpoints = [applyEndpoint, approveEndpoint, viewEndpoint];
    const rules = [
        { operation: 'Loan.Apply', type: 'access', allow: [{ role: 'borrower' }] },
        { operation: 'Loan.Apply', type: 'condition', conditions: [{ attribute: 'loan.amount', operator: 'gt', value: 0 }] },
    ];
    // CoreOperation now carries `changes[]` directly; the old separate Outcome
    // primitive was deleted with the operational rewrite.
    const coreOperations = [{
            resource: 'Loan',
            action: 'Apply',
            name: 'Loan.Apply',
            changes: [{ attribute: 'loan.status', set: 'under_review' }],
        }];
    const svc = (0, service_1.generateService)(loanResource, endpoints, coreOperations, rules);
    test('is an @Injectable() class', () => {
        expect(svc).toContain('@Injectable()');
        expect(svc).toContain('export class LoansService');
    });
    test('has mock method implementations', () => {
        expect(svc).toContain('store.set(');
        expect(svc).toContain('NotFoundException');
    });
    test('annotates operations with Access/Rules/Outcome', () => {
        expect(svc).toContain('// Access:');
        expect(svc).toContain('// Rules:');
        expect(svc).toContain('// Outcome:');
    });
    test('includes DTO in method signature for endpoints with request body', () => {
        expect(svc).toContain('ApplyLoanDto');
        expect(svc).toContain('ApproveLoanDto');
    });
});
// ── Module ────────────────────────────────────────────────────────────────────
describe('generateModule', () => {
    const mod = (0, module_1.generateModule)(loanResource);
    test('declares @Module', () => {
        expect(mod).toContain('@Module(');
    });
    test('wires controller and service', () => {
        expect(mod).toContain('LoansController');
        expect(mod).toContain('LoansService');
    });
    test('exports the service', () => {
        expect(mod).toContain('exports: [LoansService]');
    });
});
// ── Flag-aware authz (nestjs + express) ──────────────────────────────────────
describe('flag-aware authz', () => {
    test('nestjs generateFlags emits env-var-backed isFlagEnabled', () => {
        const flags = (0, auth_1.generateFlags)();
        expect(flags).toContain('export function isFlagEnabled(name: string): boolean');
        expect(flags).toContain("'FLAG_' + name.toUpperCase()");
        expect(flags).toContain("raw === '1' || raw === 'true'");
    });
    test('express generateFlags emits env-var-backed isFlagEnabled', () => {
        const flags = (0, auth_2.generateFlags)();
        expect(flags).toContain('export function isFlagEnabled(name: string): boolean');
        expect(flags).toContain("'FLAG_' + name.toUpperCase()");
    });
    test('nestjs AuthGuard reads allow metadata and honors flags', () => {
        const guard = (0, auth_1.generateAuthGuard)();
        expect(guard).toContain("import { isFlagEnabled } from './flags'");
        expect(guard).toContain("reflector.get<AllowEntry[]>('allow'");
        expect(guard).toContain('entryMatches');
        // Still honors the old @Roles metadata as a fallback.
        expect(guard).toContain("reflector.get<string[]>('roles'");
    });
    test('nestjs Roles decorator file exports AccessAllow', () => {
        const dec = (0, auth_1.generateRolesDecorator)();
        expect(dec).toContain('ALLOW_KEY');
        expect(dec).toContain('export const AccessAllow');
        expect(dec).toContain('interface AllowEntry');
    });
    test('express OIDC auth middleware uses isFlagEnabled via entryMatches', () => {
        const auth = (0, auth_2.generateAuth)(); // default = OIDC
        expect(auth).toContain("import { isFlagEnabled } from './flags'");
        expect(auth).toContain('function entryMatches');
        expect(auth).toContain('entry.flags.every');
    });
    test('express built-in auth middleware uses isFlagEnabled via entryMatches', () => {
        const auth = (0, auth_2.generateAuth)('built-in');
        expect(auth).toContain("import { isFlagEnabled } from './flags'");
        expect(auth).toContain('function entryMatches');
    });
});
// ── Docker ────────────────────────────────────────────────────────────────────
describe('docker generators', () => {
    test('Dockerfile uses multi-stage build', () => {
        const df = (0, docker_1.generateDockerfile)(3000);
        expect(df).toContain('AS builder');
        expect(df).toContain('AS runner');
        expect(df).toContain('EXPOSE 3000');
        expect(df).toContain('CMD ["node", "dist/main"]');
    });
    test('.dockerignore excludes node_modules and dist', () => {
        const di = (0, docker_1.generateDockerIgnore)();
        expect(di).toContain('node_modules');
        expect(di).toContain('dist');
    });
});
// ── Integration ───────────────────────────────────────────────────────────────
describe('api-cell integration (nestjs)', () => {
    const repoRoot = path.resolve(__dirname, '../../../../');
    const technicalPath = path.join(repoRoot, 'dna/engine/fixtures/lending/technical.json');
    let outputDir;
    beforeAll(() => {
        outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-cell-test-'));
        (0, run_1.run)(technicalPath, 'api-cell-nestjs', outputDir);
    });
    afterAll(() => {
        fs.rmSync(outputDir, { recursive: true, force: true });
    });
    const expectFile = (relPath) => expect(fs.existsSync(path.join(outputDir, relPath))).toBe(true);
    test('generates Dockerfile and .dockerignore', () => {
        expectFile('Dockerfile');
        expectFile('.dockerignore');
    });
    test('generates scaffold files', () => {
        expectFile('package.json');
        expectFile('tsconfig.json');
        expectFile('tsconfig.build.json');
        expectFile('drizzle.config.ts');
    });
    test('generates Drizzle schema from Operational DNA', () => {
        expectFile('src/db/schema.ts');
        const schema = fs.readFileSync(path.join(outputDir, 'src/db/schema.ts'), 'utf-8');
        expect(schema).toContain("export const borrowers = pgTable('borrowers'");
        expect(schema).toContain("export const loans = pgTable('loans'");
    });
    test('generates auth files', () => {
        expectFile('src/auth/auth.guard.ts');
        expectFile('src/auth/roles.decorator.ts');
    });
    test('generates app.module.ts and main.ts', () => {
        expectFile('src/app.module.ts');
        expectFile('src/main.ts');
    });
    test('generates borrower resource files', () => {
        expectFile('src/borrowers/borrowers.controller.ts');
        expectFile('src/borrowers/borrowers.service.ts');
        expectFile('src/borrowers/borrowers.module.ts');
        expectFile('src/borrowers/dto/register-borrower.dto.ts');
    });
    test('generates loan resource files', () => {
        expectFile('src/loans/loans.controller.ts');
        expectFile('src/loans/loans.service.ts');
        expectFile('src/loans/loans.module.ts');
    });
    test('loans controller has correct decorators', () => {
        const ctrl = fs.readFileSync(path.join(outputDir, 'src/loans/loans.controller.ts'), 'utf-8');
        expect(ctrl).toContain("@Controller('lending/loans')");
        // Borrower as a Role is "BorrowerActor" post-migration since "Borrower"
        // is already taken as a Resource name (names are unique across noun primitives).
        expect(ctrl).toContain("@Roles('BorrowerActor')");
        expect(ctrl).toContain("@Roles('Underwriter')");
        expect(ctrl).toContain("@Patch(':id/approve')");
        expect(ctrl).toContain("@Patch(':id/reject')");
        expect(ctrl).toContain("@Post(':id/repayments')");
    });
    test('loans service has mock implementations', () => {
        const svc = fs.readFileSync(path.join(outputDir, 'src/loans/loans.service.ts'), 'utf-8');
        expect(svc).toContain('// Access:');
        expect(svc).toContain('// Rules:');
        expect(svc).toContain('// Outcome:');
        expect(svc).toContain('store.set(');
        expect(svc).toContain('NotFoundException');
    });
    test('loan DTOs exist for operations with request bodies', () => {
        expectFile('src/loans/dto/apply-loan.dto.ts');
        expectFile('src/loans/dto/approve-loan.dto.ts');
        expectFile('src/loans/dto/repay-loan.dto.ts');
    });
    test('generates lender resource files', () => {
        expectFile('src/lenders/lenders.controller.ts');
        expectFile('src/lenders/lenders.service.ts');
        expectFile('src/lenders/lenders.module.ts');
        expectFile('src/lenders/dto/onboard-lender.dto.ts');
    });
});
// ── Express integration ──────────────────────────────────────────────────────
describe('api-cell integration (express)', () => {
    const repoRoot = path.resolve(__dirname, '../../../../');
    const technicalPath = path.join(repoRoot, 'dna/engine/fixtures/lending/technical.json');
    let outputDir;
    beforeAll(() => {
        outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-cell-express-test-'));
        (0, run_1.run)(technicalPath, 'api-cell', outputDir);
    });
    afterAll(() => {
        fs.rmSync(outputDir, { recursive: true, force: true });
    });
    const expectFile = (relPath) => expect(fs.existsSync(path.join(outputDir, relPath))).toBe(true);
    test('generates Dockerfile and .dockerignore', () => {
        expectFile('Dockerfile');
        expectFile('.dockerignore');
    });
    test('generates scaffold files', () => {
        expectFile('package.json');
        expectFile('tsconfig.json');
        expectFile('.env');
        expectFile('drizzle.config.ts');
    });
    test('generates DNA files for runtime interpretation', () => {
        expectFile('src/dna/api.json');
        expectFile('src/dna/product.core.json');
        expectFile('src/dna/auth.json');
    });
    test('generates Drizzle schema from Operational DNA', () => {
        expectFile('src/db/schema.ts');
        const schema = fs.readFileSync(path.join(outputDir, 'src/db/schema.ts'), 'utf-8');
        expect(schema).toContain("export const borrowers = pgTable('borrowers'");
        expect(schema).toContain("export const loans = pgTable('loans'");
        expect(schema).toContain("export const lenders = pgTable('lenders'");
    });
    test('generates interpreter modules', () => {
        expectFile('src/interpreter/auth.ts');
        expectFile('src/interpreter/store.ts');
        expectFile('src/interpreter/handler.ts');
        expectFile('src/interpreter/openapi.ts');
        expectFile('src/interpreter/router.ts');
        expectFile('src/interpreter/validators.ts');
        expectFile('src/interpreter/drizzle-store.ts');
    });
    test('generates entry point and seed', () => {
        expectFile('src/main.ts');
        expectFile('src/seed.ts');
    });
    test('auth config contains IDP settings', () => {
        const authConfig = JSON.parse(fs.readFileSync(path.join(outputDir, 'src/dna/auth.json'), 'utf-8'));
        expect(authConfig.domain).toBe('acme.auth0.com');
        expect(authConfig.audience).toBe('https://api.acme.finance');
        expect(authConfig.roleClaim).toBe('https://acme.finance/roles');
    });
    test('bundled API DNA matches source', () => {
        const apiDna = JSON.parse(fs.readFileSync(path.join(outputDir, 'src/dna/api.json'), 'utf-8'));
        expect(apiDna.namespace.name).toBe('Lending');
        expect(apiDna.resources).toHaveLength(3);
        expect(apiDna.endpoints.length).toBeGreaterThanOrEqual(13);
    });
    test('package.json includes runtime dependencies', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(outputDir, 'package.json'), 'utf-8'));
        expect(pkg.dependencies.express).toBeDefined();
        expect(pkg.dependencies['drizzle-orm']).toBeDefined();
        expect(pkg.dependencies['jwks-rsa']).toBeDefined();
        expect(pkg.dependencies.jsonwebtoken).toBeDefined();
    });
});
//# sourceMappingURL=generator.test.js.map