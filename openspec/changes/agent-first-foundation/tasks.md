## 1. `packages/mcp` — Package scaffold

- [x] 1.1 Create `packages/mcp/` directory with `package.json` (`@dna-codes/dna-mcp`), `tsconfig.json`, and `jest.config.ts` matching workspace conventions
- [x] 1.2 Add `packages/mcp` to root `package.json#workspaces`
- [x] 1.3 Add `@dna-codes/dna-core` and `@dna-codes/dna-adapters` as runtime dependencies in `packages/mcp/package.json`
- [x] 1.4 Add `@modelcontextprotocol/sdk` as a runtime dependency
- [x] 1.5 Run `npm install` at repo root to resolve new workspace member

## 2. `packages/mcp` — Core server and auth middleware

- [x] 2.1 Create `packages/mcp/src/server.ts` — exports `createMcpServer({ dataStore, authMiddleware? })` that returns an MCP-compliant HTTP server
- [x] 2.2 Implement pass-through auth middleware (stub) — all requests pass; interface accepts `(req, res, next) => void` for future WorkOS injection
- [x] 2.3 Wire auth middleware into the server request path before MCP handlers
- [x] 2.4 Create `packages/mcp/src/index.ts` — re-exports `createMcpServer` and all public types

## 3. `packages/mcp` — MCP resources

- [x] 3.1 Register `dna://schema/resource-types` MCP resource — reads all `ResourceType` records from `DnaDataStore` and returns them as JSON
- [x] 3.2 Register `dna://schema/relationship-types` MCP resource — reads all `RelationshipType` records and returns them as JSON

## 4. `packages/mcp` — MCP tools

- [x] 4.1 Implement `get_type_registry()` tool — returns `{ resourceTypes, relationshipTypes }` from the store in one call
- [x] 4.2 Implement `query_instances({ type?, nameContains?, limit? })` tool — filters `InstanceRecord` results; case-insensitive `nameContains` match
- [x] 4.3 Implement `get_links({ fromId, relationshipType? })` tool — returns `LinkRecord` results from a given instance ID
- [x] 4.4 Implement `get_lens({ name })` tool — runs the named lens transform; foundation supports `org-chart`; returns unknown-lens error for others
- [x] 4.5 Implement `patch_graph({ ops })` tool — validates ops via `DnaValidator`, rejects on any violation, commits atomically on success
- [x] 4.6 Add `add_resource_type` and `add_relationship_type` op variants to `patch_graph` — defaults `stability` to `experimental` when omitted; rejects duplicate type names

## 5. `packages/mcp` — Tests

- [x] 5.1 Test `get_type_registry()` returns both arrays from an in-memory store seeded with known types
- [x] 5.2 Test `query_instances` filters by type and nameContains correctly
- [x] 5.3 Test `get_links` returns all links and filters by relationship type
- [x] 5.4 Test `patch_graph` accepts valid ops and rejects invalid type references
- [x] 5.5 Test `patch_graph` `add_resource_type` defaults to `stability: experimental` and rejects duplicate names
- [x] 5.6 Test `get_lens` returns an org-chart view-model and errors on unknown lens name
- [x] 5.7 Test auth middleware hook is called for each request

## 6. `apps/dna-agent` — App scaffold

- [x] 6.1 Create `apps/dna-agent/` with `package.json`, `tsconfig.json`, and `next.config.ts` matching `apps/graph-studio` conventions
- [x] 6.2 Add `apps/dna-agent` to root `package.json#workspaces`
- [x] 6.3 Add dependencies: `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`, `@dna-codes/dna-core`, `engine/ui-library` (workspace ref)
- [x] 6.4 Add `.env.example` documenting `DNA_MCP_URL` and `ANTHROPIC_API_KEY`
- [x] 6.5 Run `npm install` at repo root

## 7. `apps/dna-agent` — Two-panel layout

- [x] 7.1 Create `app/layout.tsx` using `Application` from `engine/ui-library`
- [x] 7.2 Create `app/page.tsx` with two-panel layout: conversation panel (left) + org-chart lens panel (right) using `Sidebar` from `engine/ui-library`
- [x] 7.3 Add global CSS wiring `engine/ui-library` Tailwind config
- [x] 7.4 Stub org-chart panel with a placeholder that shows "Loading…" — real data wired in step 9

## 8. `apps/dna-agent` — Conversation API route

- [x] 8.1 Create `app/api/chat/route.ts` — POST handler that accepts `{ messages }` and streams a Claude response
- [x] 8.2 Wire `@anthropic-ai/sdk` with `DNA_MCP_URL` as an MCP server in the client config
- [x] 8.3 Stream response chunks back to the client using the Web Streams API (Response with `ReadableStream`)
- [x] 8.4 Include tool call progress events in the stream (e.g. `{ type: "tool_call", name: "patch_graph" }`) so the UI can render progress indicators

## 9. `apps/dna-agent` — Live org-chart lens panel

- [x] 9.1 Create `components/OrgChartPanel.tsx` — fetches `/api/lens/org-chart` on mount and re-fetches when a `patch` event is received
- [x] 9.2 Create `app/api/lens/org-chart/route.ts` — calls `get_lens({ name: "org-chart" })` on the MCP server and returns the view-model as JSON
- [x] 9.3 Implement org-chart tree rendering in `OrgChartPanel` using `Card` components from `engine/ui-library` — positions as cards, reports as indented children
- [x] 9.4 Add loading skeleton state during fetch/re-fetch using `Skeleton` from `engine/ui-library`
- [x] 9.5 Wire patch events: after the conversation API route confirms a `patch_graph` success, emit a signal that triggers `OrgChartPanel` to re-fetch

## 10. `apps/dna-agent` — Conversation panel UI

- [x] 10.1 Create `components/ConversationPanel.tsx` — message list + text input + submit button using `Input` and `Button` from `engine/ui-library`
- [x] 10.2 Render streamed response chunks incrementally as they arrive
- [x] 10.3 Render tool call progress lines (e.g. "◈ Querying type registry…", "✓ Graph updated") as distinct styled items in the message list
- [x] 10.4 Scroll to latest message on new content

## 11. Agent system prompt and type grammar

- [x] 11.1 Write the system prompt in `lib/system-prompt.ts` — instructs Claude to call `get_type_registry()` at the start of each conversation, map language to registered types, and use `patch_graph` for all mutations
- [x] 11.2 Include pushback instructions in the system prompt: reason over all registered types for semantic overlap before creating new ones; surface conflicts with specific named suggestions; create new types at `stability: experimental`
- [x] 11.3 Write `AGENTS.md` for `apps/dna-agent` defining the agent contract (concern: `dna-agent`, subagent type, key tools)

## 12. Documentation and README

- [x] 12.1 Write `apps/dna-agent/README.md` — local setup, env vars, how to run against Neo4j or in-memory
- [x] 12.2 Write `packages/mcp/README.md` — MCP tools/resources surface, auth middleware interface, local run instructions
- [x] 12.3 Update root `README.md` to add `packages/mcp` and `apps/dna-agent` to the workspace inventory
