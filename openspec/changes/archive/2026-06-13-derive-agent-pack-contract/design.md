## Context

The dna-agent (`apps/dna-agent`) talks to Claude via `@anthropic-ai/sdk` in `app/api/chat/route.ts`. Claude's behavior is shaped by two inputs we control:

1. **The system prompt** — built by `apps/dna-agent/lib/system-prompt.ts`. It contains a `PACK_VOCABULARY` constant: a hand-written map of `{ types: string[], relationships: string[], description }` per pack. This duplicates the *real* pack definitions that live in `packages/mcp/src/packs/{operational,crm,hr}.ts` and are seeded into the store via `seedPack`. The two can drift, and the prompt version is strictly poorer — bare names, no categories, descriptions, or endpoint constraints.
2. **The tool schemas** — `patch_graph` is registered in `packages/mcp/src/server.ts` with `{ ops: z.array(z.any()) }`. The MCP→Anthropic bridge (`mcpToolToAnthropic`) passes the tool's `inputSchema` straight through as Claude's `input_schema`. An `any` array means Claude gets no structural contract for ops.

Meanwhile, the reference example documents in `dna-codes-site/src/data/lens-demo-*.json` already model the exact shape we want Claude to emit: `resources: [{ id, type, name, description }]` and `relationships: [{ id, type, from, to }]`. These are the canonical "well-structured" target.

The pack registry (`packages/mcp/src/packs/index.ts`) already exposes `PACKS: Record<PackName, PackDefinition>` with full `ResourceTypeInput[]` / `RelationshipTypeInput[]`. It is the natural single source of truth — it just isn't exported from the package's public entry (`packages/mcp/src/index.ts`) nor rendered for prompts.

## Goals / Non-Goals

**Goals:**
- One source of truth for agent-facing pack vocabulary: the real `PACKS` definitions.
- The system prompt presents resource/relationship types as structured definitions (category, description, `from→to`, cardinality), not bare names.
- `patch_graph` carries a real JSON Schema data contract whose instance/link ops mirror the example resource/relationship shapes.
- The renderer and schema are exported from `@dna-codes/dna-mcp` so server and agent share them.

**Non-Goals:**
- No change to graph storage, validation logic, or the on-the-wire op semantics — `validatePatchOps`/`applyPatchOps` stay as-is. The schema is additive guidance, not a new validator.
- No change to lens, widget, or governance prose beyond wiring the derived pack block in.
- No change to the example documents themselves — they are the reference target, not an output.

## Decisions

### 1. Renderer lives next to `PACKS`, in `packages/mcp/src/packs/index.ts`
A `renderPackForPrompt(packName: PackName): string` function reads `PACKS[packName]` and emits a markdown block. Resources render as `- **name** · _category_ — description`; relationships as `- **name** · from→to · cardinality — description`. It uses the live `description`/`category`/`from`/`to`/`cardinality` fields already on the definitions.

*Why here, not in the agent?* The agent must not re-derive vocabulary; co-locating with `PACKS` guarantees the prompt and the seeded store never diverge. *Alternative considered:* render inside the agent by importing `PACKS` — rejected because it splits "what the pack is" from "how it's described to the model" across packages.

### 2. Patch-op contract is a single Zod discriminated union; the JSON Schema is derived from it
A new `packages/mcp/src/patch-schema.ts` defines `patchOpSchema = z.discriminatedUnion('op', […])` covering all seven `PatchOp` variants, where `add_instance` carries `type`, `name`, optional `attributes` and `add_link` carries `type`, `from`, `to` — field vocabulary tracking the `lens-demo-*.json` examples. It exports `patchGraphInputShape` (the `{ ops: z.array(patchOpSchema) }` raw shape used to register the tool) plus the derived JSON Schemas `PATCH_OPS_SCHEMA` and `PATCH_GRAPH_INPUT_SCHEMA`, produced with Zod v4's built-in `z.toJSONSchema()`.

*Why a Zod source of truth rather than a hand-authored JSON Schema?* The MCP SDK's tool registration accepts **only** a Zod schema/raw-shape for `inputSchema` (`AnySchema = z3.ZodTypeAny | z4.$ZodType`) and converts it to JSON Schema internally when advertising the tool. So a Zod schema is unavoidable for the tool. Deriving the *exported* JSON Schema from the same Zod object — rather than hand-authoring a parallel constant — guarantees the imported contract equals the one Anthropic actually receives, with zero drift. The package already resolves Zod v4 (4.3.6), whose `z.toJSONSchema()` needs no extra dependency.

*Alternative considered:* hand-author a standalone JSON Schema constant in parallel with the Zod tool schema. Rejected — two sources of truth for one contract; the spec requires the exported schema to match the tool's advertised `input_schema`.

### 3. `patch_graph` consumes the shape; server keeps validating
`server.ts` registers `patch_graph` with `patchGraphInputShape` (i.e. `{ ops: z.array(patchOpSchema) }`) instead of `{ ops: z.array(z.any()) }`. The SDK converts this to the JSON Schema it advertises to clients, which the agent's `mcpToolToAnthropic` bridge forwards verbatim as Claude's `input_schema`. The runtime still runs `validatePatchOps` — the schema constrains *generation*, validation guarantees *correctness*. Defense in depth, not either/or.

### 4. Agent imports the renderer; `PACK_VOCABULARY` is deleted
`system-prompt.ts`'s `buildSystemPrompt(packName, locked)` calls `renderPackForPrompt(packName)` for the "Active starter pack" section. The hardcoded `PACK_VOCABULARY` table is removed entirely. The function signature and all other prose (governance, plan/apply, lenses, widgets) are unchanged.

## Risks / Trade-offs

- **Zod patch schema and TS `PatchOp` union drift** → Mitigation: a unit test in `packages/mcp/src/__tests__` asserts every op variant's `op` literal appears in the derived `PATCH_OPS_SCHEMA`, and type-checks that `patchOpSchema`'s inferred output is assignable to/from `PatchOp`. Both live in the same package, reviewed together.
- **MCP SDK `mcp.tool` accepts only Zod for `inputSchema`** → Resolved during apply: confirmed (`AnySchema = z3.ZodTypeAny | z4.$ZodType`). We register a Zod shape and derive the exported JSON Schema from it, so there is a single source of truth.
- **Richer prompt increases token count** → Mitigation: only the active pack is rendered (5–6 resource + ~5 relationship lines); negligible versus the existing prompt body.

## Migration Plan

Pure code change, no data migration. Deploy is a rebuild of `@dna-codes/dna-mcp` and `dna-agent`. Rollback = revert the commit; the on-the-wire op format is unchanged, so old and new agents interoperate with the same MCP server.
