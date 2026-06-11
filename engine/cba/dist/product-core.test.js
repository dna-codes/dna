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
const product_core_1 = require("./product-core");
const dna_core_1 = require("@dna-codes/dna-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loadDna = (relativePath) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../', relativePath), 'utf-8'));
describe('materializeProductCore', () => {
    it('produces a valid product/core document from lending DNA', () => {
        const operational = loadDna('examples/lending/operational.json');
        const core = (0, product_core_1.materializeProductCore)(operational);
        expect(core.domain).toBeDefined();
        expect(core.domain.path).toContain('lending');
        expect(core.resources?.length ?? 0).toBeGreaterThan(0);
        expect(core.resources?.some((r) => r.name === 'Loan')).toBe(true);
        const validator = new dna_core_1.DnaValidator();
        const r = validator.validate(core, 'product/core');
        if (!r.valid)
            console.error('validation errors:', r.errors);
        expect(r.valid).toBe(true);
    });
    it('falls back to all resources when no surfaces are provided', () => {
        const operational = loadDna('examples/lending/operational.json');
        const core = (0, product_core_1.materializeProductCore)(operational);
        expect(core.resources?.length ?? 0).toBeGreaterThan(0);
    });
    it('emits operations only for surfaced resources', () => {
        const operational = {
            domain: {
                name: 'test',
                path: 'test',
                resources: [
                    {
                        name: 'Included',
                        attributes: [{ name: 'id', type: 'string' }],
                        actions: [{ name: 'Create', type: 'write' }],
                    },
                    {
                        name: 'Excluded',
                        attributes: [{ name: 'id', type: 'string' }],
                        actions: [{ name: 'Create', type: 'write' }],
                    },
                ],
            },
            operations: [
                { name: 'Included.Create', target: 'Included', action: 'Create' },
                { name: 'Excluded.Create', target: 'Excluded', action: 'Create' },
            ],
        };
        const api = { resources: [{ name: 'Included', resource: 'Included' }] };
        const core = (0, product_core_1.materializeProductCore)(operational, api);
        expect(core.resources?.map((r) => r.name)).toEqual(['Included']);
        expect(core.operations?.map((o) => o.name)).toEqual(['Included.Create']);
    });
    it('includes transitively related resources via relationships', () => {
        const operational = {
            domain: {
                name: 'test',
                path: 'test',
                resources: [
                    { name: 'Order', attributes: [{ name: 'customer_id', type: 'string' }], actions: [] },
                    { name: 'Customer', attributes: [{ name: 'id', type: 'string' }], actions: [] },
                    { name: 'Unrelated', attributes: [{ name: 'id', type: 'string' }], actions: [] },
                ],
            },
            relationships: [
                {
                    name: 'order_belongs_to_customer',
                    from: 'Order',
                    to: 'Customer',
                    attribute: 'customer_id',
                    cardinality: 'many-to-one',
                },
            ],
        };
        const api = { resources: [{ name: 'Order', resource: 'Order' }] };
        const core = (0, product_core_1.materializeProductCore)(operational, api);
        const resourceNames = (core.resources ?? []).map((r) => r.name).sort();
        expect(resourceNames).toEqual(['Customer', 'Order']);
        expect(core.relationships?.length).toBe(1);
    });
});
//# sourceMappingURL=product-core.test.js.map