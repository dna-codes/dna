import { z } from 'zod'

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

const NOUN_CATEGORIES = ['person', 'role', 'group', 'resource'] as const
const STABILITIES = ['experimental', 'beta', 'stable', 'deprecated'] as const

const attributes = z.record(z.string(), z.unknown())

export const addInstanceOp = z.object({
  op: z.literal('add_instance'),
  type: z.string().describe('Registered ResourceType name, e.g. "position" or "person".'),
  name: z.string().describe('Human-readable display name of the instance.'),
  attributes: attributes.optional().describe('Optional extra attributes for the instance.'),
}).describe('Create a new resource instance. Mirrors an example resource: { type, name, … }.')

export const removeInstanceOp = z.object({
  op: z.literal('remove_instance'),
  id: z.string().describe('ID of the instance to remove, e.g. "person:jordan".'),
  type: z.string().describe('Registered ResourceType name of the instance.'),
}).describe('Remove an existing resource instance by id.')

export const updateInstanceOp = z.object({
  op: z.literal('update_instance'),
  id: z.string().describe('ID of the instance to update, e.g. "position:loan-officer".'),
  type: z.string().describe('Registered ResourceType name of the instance.'),
  attributes: attributes.describe('Attribute fields to set or overwrite on the instance.'),
}).describe('Update attributes on an existing resource instance.')

export const addLinkOp = z.object({
  op: z.literal('add_link'),
  type: z.string().describe('Registered RelationshipType name, e.g. "reports_to" or "fills".'),
  from: z.string().describe('Source instance id, e.g. "position:loan-officer".'),
  to: z.string().describe('Target instance id, e.g. "position:lending-manager".'),
}).describe('Create a relationship edge between two instances. Mirrors an example relationship: { type, from, to }.')

export const removeLinkOp = z.object({
  op: z.literal('remove_link'),
  id: z.string().describe('ID of the link to remove.'),
}).describe('Remove an existing relationship edge by id.')

export const addResourceTypeOp = z.object({
  op: z.literal('add_resource_type'),
  name: z.string().describe('New ResourceType name (kebab/lower-case, e.g. "squad").'),
  category: z.enum(NOUN_CATEGORIES).describe('Noun category the type belongs to.'),
  description: z.string().optional().describe('What this type represents.'),
  stability: z.enum(STABILITIES).optional().describe('Concept maturity; defaults to "experimental".'),
  attribute_schema: z.array(z.unknown()).optional().describe('Optional attribute schema for the type.'),
}).describe('Register a new ResourceType. Only when the type registry is open.')

export const addRelationshipTypeOp = z.object({
  op: z.literal('add_relationship_type'),
  name: z.string().describe('New RelationshipType name (snake_case, e.g. "mentors").'),
  from_type: z.string().describe('Registered ResourceType name the edge originates from.'),
  to_type: z.string().describe('Registered ResourceType name the edge points to.'),
  description: z.string().optional().describe('What this relationship represents.'),
  stability: z.enum(STABILITIES).optional().describe('Concept maturity; defaults to "experimental".'),
}).describe('Register a new RelationshipType. Only when the type registry is open.')

/** Discriminated union over every supported patch operation. */
export const patchOpSchema = z.discriminatedUnion('op', [
  addInstanceOp,
  removeInstanceOp,
  updateInstanceOp,
  addLinkOp,
  removeLinkOp,
  addResourceTypeOp,
  addRelationshipTypeOp,
])

/**
 * Raw shape registered as the `patch_graph` tool input. The MCP SDK converts
 * this to the JSON Schema advertised to clients.
 */
export const patchGraphInputShape = {
  ops: z.array(patchOpSchema).describe('Ordered list of graph mutation operations applied atomically.'),
}

const patchGraphInputObject = z.object(patchGraphInputShape)

/** JSON Schema for a single patch operation (the discriminated union). */
export const PATCH_OPS_SCHEMA = z.toJSONSchema(patchOpSchema)

/** JSON Schema for the full `patch_graph` tool input `{ ops: PatchOp[] }`. */
export const PATCH_GRAPH_INPUT_SCHEMA = z.toJSONSchema(patchGraphInputObject)

/** Every `op` discriminator value present in the contract. */
export const PATCH_OP_NAMES = [
  'add_instance',
  'remove_instance',
  'update_instance',
  'add_link',
  'remove_link',
  'add_resource_type',
  'add_relationship_type',
] as const
