## 1. Patch-op JSON Schema (dna-mcp)

- [x] 1.1 Add `packages/mcp/src/patch-schema.ts` defining `patchOpSchema = z.discriminatedUnion('op', […])` covering all seven `PatchOp` variants (`add_instance` carries `type`, `name`, optional `attributes`; `add_link` carries `type`, `from`, `to`; plus `remove_instance`, `update_instance`, `remove_link`, `add_resource_type`, `add_relationship_type`). Export `patchGraphInputShape` (the `{ ops }` raw shape) and the derived JSON Schemas `PATCH_OPS_SCHEMA` / `PATCH_GRAPH_INPUT_SCHEMA` via Zod v4's `z.toJSONSchema()`.
- [x] 1.2 Wire `patch_graph` in `packages/mcp/src/server.ts` to register with `patchGraphInputShape` instead of `{ ops: z.array(z.any()) }`; keep `validatePatchOps`/`applyPatchOps` unchanged.

## 2. Pack-prompt renderer (dna-mcp)

- [x] 2.1 Add `renderPackForPrompt(packName: PackName): string` to `packages/mcp/src/packs/index.ts`, reading `PACKS[packName]` and emitting a structured block: resources as `name · category · description`, relationships as `name · from→to · cardinality · description`.

## 3. Package exports (dna-mcp)

- [x] 3.1 Export `renderPackForPrompt`, `PACKS`, `PackDefinition`, `PackName`, `PATCH_OPS_SCHEMA`, and `PATCH_GRAPH_INPUT_SCHEMA` from `packages/mcp/src/index.ts`.

## 4. Derive the agent system prompt (dna-agent)

- [x] 4.1 In `apps/dna-agent/lib/system-prompt.ts`, replace the hardcoded `PACK_VOCABULARY` table and the "Active starter pack" section with output from the imported `renderPackForPrompt`; delete `PACK_VOCABULARY`. Keep the `buildSystemPrompt(packName, locked)` signature and all other prose sections intact.

## 5. Tests & verification

- [x] 5.1 Add a unit test in `packages/mcp/src/__tests__` asserting every `op` literal in the `PatchOp` TS union has a matching variant (with its required fields) in `PATCH_OPS_SCHEMA`, and that the schema exported from the package equals the one advertised by `patch_graph`.
- [x] 5.2 Add a test (or extend an existing one) asserting `renderPackForPrompt('operational')` includes each operational resource type's category/description and each relationship's `from`→`to`, cardinality, and description.
- [x] 5.3 Build `@dna-codes/dna-mcp` and `dna-agent`; run the mcp package test suite; confirm no type or lint errors.
- [x] 5.4 Update `README.md`/relevant local docs to note the shared renderer and patch-op schema exports.
