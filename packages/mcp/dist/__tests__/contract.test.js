"use strict";
/**
 * Tests for the shared agent contract: the patch-op JSON Schema and the
 * pack-prompt renderer. Both are the single source of truth consumed by the
 * dna-agent system prompt and the `patch_graph` tool, so they must stay
 * congruent with the `PatchOp` type union and the real pack definitions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const patch_schema_js_1 = require("../patch-schema.js");
const index_js_1 = require("../packs/index.js");
// Compile-time guard: this object fails to typecheck if a PatchOp variant is
// added or removed without updating PATCH_OP_NAMES — enforcing congruence
// between the TS union and the published contract.
const OP_DISCRIMINATORS = {
    add_instance: true,
    remove_instance: true,
    update_instance: true,
    add_link: true,
    remove_link: true,
    add_resource_type: true,
    add_relationship_type: true,
};
function opConstsFromSchema(schema) {
    const variants = schema.anyOf
        ?? schema.oneOf
        ?? [];
    return variants
        .map(v => v.properties?.op?.const)
        .filter((c) => typeof c === 'string');
}
describe('patch-op JSON Schema contract', () => {
    it('declares every PatchOp union variant', () => {
        // Runtime mirror of the compile-time guard above.
        expect(new Set(patch_schema_js_1.PATCH_OP_NAMES)).toEqual(new Set(Object.keys(OP_DISCRIMINATORS)));
    });
    it('derived JSON Schema covers every op discriminator', () => {
        expect(new Set(opConstsFromSchema(patch_schema_js_1.PATCH_OPS_SCHEMA))).toEqual(new Set(patch_schema_js_1.PATCH_OP_NAMES));
    });
    it('input schema types `ops` as an array (not an untyped value)', () => {
        const ops = patch_schema_js_1.PATCH_GRAPH_INPUT_SCHEMA.properties?.ops;
        expect(ops?.type).toBe('array');
    });
    it('accepts a valid add_instance op mirroring the example resource shape', () => {
        const parsed = patch_schema_js_1.patchOpSchema.safeParse({ op: 'add_instance', type: 'position', name: 'Loan Officer' });
        expect(parsed.success).toBe(true);
    });
    it('accepts a valid add_link op mirroring the example relationship shape', () => {
        const parsed = patch_schema_js_1.patchOpSchema.safeParse({
            op: 'add_link',
            type: 'reports_to',
            from: 'position:loan-officer',
            to: 'position:lending-manager',
        });
        expect(parsed.success).toBe(true);
    });
    it('rejects an unknown op', () => {
        const parsed = patch_schema_js_1.patchOpSchema.safeParse({ op: 'frobnicate', name: 'x' });
        expect(parsed.success).toBe(false);
    });
});
describe('renderPackForPrompt', () => {
    it('renders operational resource types with category and description', () => {
        const block = (0, index_js_1.renderPackForPrompt)('operational');
        for (const rt of index_js_1.PACKS.operational.resourceTypes) {
            expect(block).toContain(rt.name);
            expect(block).toContain(rt.category);
            if (rt.description)
                expect(block).toContain(rt.description);
        }
    });
    it('renders operational relationship types with from→to, cardinality, and description', () => {
        const block = (0, index_js_1.renderPackForPrompt)('operational');
        for (const rel of index_js_1.PACKS.operational.relationshipTypes) {
            expect(block).toContain(`${rel.from}→${rel.to}`);
            expect(block).toContain(rel.cardinality);
            if (rel.description)
                expect(block).toContain(rel.description);
        }
    });
    it('falls back to the default pack for an unknown name', () => {
        const block = (0, index_js_1.renderPackForPrompt)('does-not-exist');
        expect(block).toContain(index_js_1.PACKS.operational.label);
    });
});
//# sourceMappingURL=contract.test.js.map