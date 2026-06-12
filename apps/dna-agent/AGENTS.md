# DNA Agent — AGENTS.md

## Concern

`dna-agent` — the business-leader interface for creating and operating company DNA.

## Subagent type

`claude` (general purpose). The agent is Claude, connected to `packages/mcp` via the Anthropic SDK's MCP client feature.

## Session start protocol

**Always call `get_type_registry()` first.** Every conversation begins by loading the full type registry so subsequent operations are grounded in registered types, not guesses.

## Key tools (via DNA MCP Server)

| Tool | Purpose |
|---|---|
| `get_type_registry()` | Load all ResourceTypes and RelationshipTypes — call once at session start |
| `query_instances({ type?, nameContains? })` | Find nodes before generating link operations |
| `get_links({ fromId, relationshipType? })` | Traverse edges (e.g. find what position a person fills) |
| `patch_graph({ ops[] })` | Mutate the graph — validated before commit |
| `get_lens({ name })` | Render a view-model (e.g. "org-chart") |

## PatchOp variants

- `add_instance` / `remove_instance` / `update_instance` — node operations
- `add_link` / `remove_link` — edge operations
- `add_resource_type` — creates new type at `stability: experimental`
- `add_relationship_type` — creates new relationship type at `stability: experimental`

## Pushback on new types

Before creating a new type, check all registered types for semantic overlap. Surface conflicts explicitly. New types default to `stability: experimental`.
