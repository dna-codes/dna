## Why

DNA's resource-relationship graph is already machine-readable, but creating and operating it requires developers writing JSON. Business leaders — CEOs, COOs, ops directors — need to own their company's DNA directly, through natural language, with agents as the interface. This change builds the minimal loop that proves the concept end-to-end: speak → patch graph → see it live.

## What Changes

- **New package `packages/mcp`** — a DNA MCP Server that wraps `DnaDataStore` and exposes the type registry plus graph mutation as MCP protocol tools and resources
- **New app `apps/dna-agent`** — a Next.js business-leader UI with a conversation panel (Claude via Anthropic SDK as MCP client) and a live org-chart lens that re-renders on graph patches
- **Type registry as agent grammar** — agent loads registered `ResourceType` and `RelationshipType` records before generating any patch, so operations are constrained by the actual schema rather than guessed
- **Agent pushback on type overlap** — when a user proposes a new type, the agent reasons over existing types in context and surfaces conflicts ("you already have X — did you mean that?"); new types are created as `stability: experimental`
- Auth-md (WorkOS) is **stubbed** — the middleware shape is wired but not connected to real WorkOS APIs; full auth comes in a follow-on change

## Capabilities

### New Capabilities

- `dna-mcp-server`: MCP protocol server wrapping `DnaDataStore` — exposes type registry resources, graph query tools, and a validated `patch_graph` tool
- `dna-agent-app`: Business-leader Next.js app with agent conversation panel and live org-chart lens, connected to the MCP server
- `agent-type-grammar`: Mechanism by which agents load the registered type system before generating patch operations, mapping natural language to valid resource and relationship types
- `agent-type-pushback`: Agent reasoning over existing types to detect duplicate or alias proposals, surfacing conflicts before creating new experimental types

### Modified Capabilities

- `registry-type-stability`: Agents now CREATE types at `stability: experimental` via the MCP server — adds an agent-initiated creation path to the existing stability lifecycle

## Impact

- New `packages/mcp` — depends on `@dna-codes/dna-core`, `@dna-codes/dna-adapters`; exports an MCP-compliant HTTP server
- New `apps/dna-agent` — Next.js app in the workspace; depends on `@dna-codes/dna-core`, `@anthropic-ai/sdk`, `engine/ui-library`; connects to `packages/mcp` at runtime
- No changes to existing packages (`dna-core`, `dna-adapters`, `dna-api`, Graph Studio)
- Neo4j required at runtime (already used by Graph Studio); in-memory adapter for tests
