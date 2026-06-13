"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH_OP_NAMES = exports.PATCH_GRAPH_INPUT_SCHEMA = exports.PATCH_OPS_SCHEMA = exports.patchGraphInputShape = exports.patchOpSchema = exports.addRelationshipTypeOp = exports.addResourceTypeOp = exports.removeLinkOp = exports.addLinkOp = exports.updateInstanceOp = exports.removeInstanceOp = exports.addInstanceOp = void 0;
const zod_1 = require("zod");
// ── Patch-op data contract ────────────────────────────────────────────────────
// A single Zod source of truth for the `patch_graph` tool input. The MCP SDK
// accepts only Zod for a tool's inputSchema and converts it to JSON Schema when
// advertising the tool; we register `patchGraphInputShape` with the tool AND
// derive the exported JSON Schemas from the same definition, so the contract an
// agent (e.g. Anthropic) receives never drifts from what we publish.
//
// Instance and link variants mirror the reference example documents in
// `dna-codes-site/src/data/lens-demo-*.json`:
//   resource     → { id, type, name, description }
//   relationship → { id, type, from, to }
// Every variant here corresponds 1:1 with a `PatchOp` variant in `types.ts`.
const NOUN_CATEGORIES = ['person', 'role', 'group', 'resource'];
const STABILITIES = ['experimental', 'beta', 'stable', 'deprecated'];
const attributes = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
exports.addInstanceOp = zod_1.z.object({
    op: zod_1.z.literal('add_instance'),
    type: zod_1.z.string().describe('Registered ResourceType name, e.g. "position" or "person".'),
    name: zod_1.z.string().describe('Human-readable display name of the instance.'),
    attributes: attributes.optional().describe('Optional extra attributes for the instance.'),
}).describe('Create a new resource instance. Mirrors an example resource: { type, name, … }.');
exports.removeInstanceOp = zod_1.z.object({
    op: zod_1.z.literal('remove_instance'),
    id: zod_1.z.string().describe('ID of the instance to remove, e.g. "person:jordan".'),
    type: zod_1.z.string().describe('Registered ResourceType name of the instance.'),
}).describe('Remove an existing resource instance by id.');
exports.updateInstanceOp = zod_1.z.object({
    op: zod_1.z.literal('update_instance'),
    id: zod_1.z.string().describe('ID of the instance to update, e.g. "position:loan-officer".'),
    type: zod_1.z.string().describe('Registered ResourceType name of the instance.'),
    attributes: attributes.describe('Attribute fields to set or overwrite on the instance.'),
}).describe('Update attributes on an existing resource instance.');
exports.addLinkOp = zod_1.z.object({
    op: zod_1.z.literal('add_link'),
    type: zod_1.z.string().describe('Registered RelationshipType name, e.g. "reports_to" or "fills".'),
    from: zod_1.z.string().describe('Source instance id, e.g. "position:loan-officer".'),
    to: zod_1.z.string().describe('Target instance id, e.g. "position:lending-manager".'),
}).describe('Create a relationship edge between two instances. Mirrors an example relationship: { type, from, to }.');
exports.removeLinkOp = zod_1.z.object({
    op: zod_1.z.literal('remove_link'),
    id: zod_1.z.string().describe('ID of the link to remove.'),
}).describe('Remove an existing relationship edge by id.');
exports.addResourceTypeOp = zod_1.z.object({
    op: zod_1.z.literal('add_resource_type'),
    name: zod_1.z.string().describe('New ResourceType name (kebab/lower-case, e.g. "squad").'),
    category: zod_1.z.enum(NOUN_CATEGORIES).describe('Noun category the type belongs to.'),
    description: zod_1.z.string().optional().describe('What this type represents.'),
    stability: zod_1.z.enum(STABILITIES).optional().describe('Concept maturity; defaults to "experimental".'),
    attribute_schema: zod_1.z.array(zod_1.z.unknown()).optional().describe('Optional attribute schema for the type.'),
}).describe('Register a new ResourceType. Only when the type registry is open.');
exports.addRelationshipTypeOp = zod_1.z.object({
    op: zod_1.z.literal('add_relationship_type'),
    name: zod_1.z.string().describe('New RelationshipType name (snake_case, e.g. "mentors").'),
    from_type: zod_1.z.string().describe('Registered ResourceType name the edge originates from.'),
    to_type: zod_1.z.string().describe('Registered ResourceType name the edge points to.'),
    description: zod_1.z.string().optional().describe('What this relationship represents.'),
    stability: zod_1.z.enum(STABILITIES).optional().describe('Concept maturity; defaults to "experimental".'),
}).describe('Register a new RelationshipType. Only when the type registry is open.');
/** Discriminated union over every supported patch operation. */
exports.patchOpSchema = zod_1.z.discriminatedUnion('op', [
    exports.addInstanceOp,
    exports.removeInstanceOp,
    exports.updateInstanceOp,
    exports.addLinkOp,
    exports.removeLinkOp,
    exports.addResourceTypeOp,
    exports.addRelationshipTypeOp,
]);
/**
 * Raw shape registered as the `patch_graph` tool input. The MCP SDK converts
 * this to the JSON Schema advertised to clients.
 */
exports.patchGraphInputShape = {
    ops: zod_1.z.array(exports.patchOpSchema).describe('Ordered list of graph mutation operations applied atomically.'),
};
const patchGraphInputObject = zod_1.z.object(exports.patchGraphInputShape);
/** JSON Schema for a single patch operation (the discriminated union). */
exports.PATCH_OPS_SCHEMA = zod_1.z.toJSONSchema(exports.patchOpSchema);
/** JSON Schema for the full `patch_graph` tool input `{ ops: PatchOp[] }`. */
exports.PATCH_GRAPH_INPUT_SCHEMA = zod_1.z.toJSONSchema(patchGraphInputObject);
/** Every `op` discriminator value present in the contract. */
exports.PATCH_OP_NAMES = [
    'add_instance',
    'remove_instance',
    'update_instance',
    'add_link',
    'remove_link',
    'add_resource_type',
    'add_relationship_type',
];
//# sourceMappingURL=patch-schema.js.map