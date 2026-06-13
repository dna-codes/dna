export { createMcpServer } from './server.js'
export type {
  McpServerOptions,
  SessionMode,
  AuthMiddleware,
  PatchOp,
  AddInstanceOp,
  RemoveInstanceOp,
  UpdateInstanceOp,
  AddLinkOp,
  RemoveLinkOp,
  AddResourceTypeOp,
  AddRelationshipTypeOp,
  PatchResult,
  PatchError,
} from './types.js'
export type { OrgChartViewModel, OrgChartNode, OrgChartPerson } from './lenses/org-chart.js'
export type { PipelineViewModel, PipelineOpportunity } from './lenses/pipeline.js'
export type { AccountsViewModel, AccountEntry, AccountOpportunity } from './lenses/accounts.js'
export type { TypeRegistryViewModel, TypeRegistryNode, TypeRegistryEdge } from './lenses/type-registry.js'
export type { WidgetPayload, StatRow, StatTile, RecordTable, RecordCard, RecordField, BadgeList, BadgeItem, WidgetKind } from './widgets.js'
export { WIDGET_KINDS } from './widgets.js'
export { PACKS, DEFAULT_PACK, renderPackForPrompt } from './packs/index.js'
export type { PackName, PackDefinition } from './packs/index.js'
export {
  patchOpSchema,
  patchGraphInputShape,
  PATCH_OPS_SCHEMA,
  PATCH_GRAPH_INPUT_SCHEMA,
  PATCH_OP_NAMES,
} from './patch-schema.js'
