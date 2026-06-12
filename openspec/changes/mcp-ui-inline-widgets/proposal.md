## Why

The DNA Agent chat is text-only today. When the agent builds or queries the graph, it narrates the result in prose — but a table of contacts, a stat summary, or a mini pipeline snapshot would communicate far more at a glance. Adding inline widget rendering to the conversation lets the agent surface structured, visual output right inside the chat without requiring the user to switch to a lens tab.

## What Changes

- Introduce a `widget` stream chunk type in the chat API response stream, carrying a typed payload the UI can render
- The agent can emit widgets via a new `render_widget` tool call that the MCP server handles by streaming a widget chunk back to the client
- The `ConversationPanel` renders widget chunks inline in the message thread using `data-ui-*` styled components from the ui-library
- Define an initial widget vocabulary: `stat-row` (key-value tiles), `record-table` (tabular list), `record-card` (single entity spotlight), `badge-list` (tag cloud)
- The system prompt instructs the agent when and how to use widgets (after building or querying, surface a quick visual summary)

## Capabilities

### New Capabilities

- `mcp-ui-widget-protocol`: The stream protocol extension — defines the `widget` chunk type, the `render_widget` tool contract, and the typed widget payload schema
- `inline-widget-renderer`: The React-side renderer in `ConversationPanel` that maps widget payloads to `data-ui-*` HTML, using the ui-library skin

### Modified Capabilities

- `session-setup-flow`: No spec-level change — implementation only
- `starter-pack-registry`: No spec-level change — implementation only

## Impact

- `apps/dna-agent/app/api/chat/route.ts` — handle `render_widget` tool call, stream widget chunk
- `apps/dna-agent/components/ConversationPanel.tsx` — render widget chunks inline between messages
- `packages/mcp/src/server.ts` — register `render_widget` tool, validate payload, return widget JSON
- `packages/mcp/src/widgets.ts` (new) — widget type definitions and payload schemas
- `apps/dna-agent/lib/system-prompt.ts` — instructions for when/how to emit widgets
- No breaking changes to existing stream protocol (new chunk type is additive)
