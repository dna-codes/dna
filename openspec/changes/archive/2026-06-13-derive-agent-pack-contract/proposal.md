## Why

The dna-agent's reliability hinges on what Anthropic sees: the system prompt and the tool schemas. Today both are weak. The agent's pack vocabulary is a hand-maintained `PACK_VOCABULARY` table in `apps/dna-agent/lib/system-prompt.ts` that duplicates — and silently drifts from — the real pack definitions in `packages/mcp/src/packs/`. The model only sees bare type names (`person, position, department…`), not the categories, descriptions, and `from→to` constraints that make a type unambiguous. And `patch_graph`'s tool input is `z.array(z.any())`, giving Claude zero structural guidance on op shape. The result is avoidable mistakes: invented type variants, mismatched link endpoints, malformed ops.

## What Changes

- Add a single shared **pack-prompt renderer** in `packages/mcp/src/packs/` that turns a pack's real `resourceTypes`/`relationshipTypes` into a well-structured prompt block — each resource as `name · category · description`, each relationship as `name · from→to · cardinality · description` — mirroring the shape of the example documents in `dna-codes-site/src/data`.
- Add a shared **patch-op JSON Schema** in `packages/mcp/src/` whose `add_instance` ops mirror the example resource shape (`id`, `type`, `name`, `description`) and `add_link` ops mirror the example relationship shape (`id`, `type`, `from`, `to`), exported as a discriminated union with the other op variants.
- Export both the renderer and the JSON Schema (plus `PACKS`/`PackDefinition`) from `@dna-codes/dna-mcp` so the MCP server and the agent share one source of truth.
- Replace `patch_graph`'s `z.array(z.any())` input with the shared JSON Schema data contract, so Anthropic's tool-use is structurally constrained.
- Rewrite `apps/dna-agent/lib/system-prompt.ts` to derive its pack section from the shared renderer; **remove** the hardcoded `PACK_VOCABULARY` table.

No breaking changes to graph behavior or the wire protocol — the same ops validate and apply; they are just better specified.

## Capabilities

### New Capabilities
<!-- none — all changes refine existing capabilities -->

### Modified Capabilities
- `starter-pack-registry`: the registry SHALL additionally expose a derived prompt-rendering helper that renders a pack's real resource/relationship type definitions as a structured prompt block (single source of truth for agent vocabulary).
- `dna-mcp-server`: `patch_graph` SHALL declare a JSON Schema data contract for its `ops` input (replacing the untyped array); the package SHALL export the patch-op JSON Schema and the pack-prompt renderer.
- `dna-agent-app`: the agent's system prompt SHALL derive its pack vocabulary from the shared renderer rather than a hardcoded table.

## Impact

- `packages/mcp/src/packs/index.ts` — add `renderPackForPrompt` (or similar) helper.
- `packages/mcp/src/` — add patch-op JSON Schema module; export from `index.ts`.
- `packages/mcp/src/server.ts` — `patch_graph` tool uses the JSON Schema for its `ops` input.
- `apps/dna-agent/lib/system-prompt.ts` — consume the renderer; delete `PACK_VOCABULARY`.
- Consumers: agent system prompt content changes (richer); MCP tool schema changes (tighter). No data migration.
