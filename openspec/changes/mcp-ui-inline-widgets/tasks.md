## 1. Widget Type Definitions (packages/mcp)

- [x] 1.1 Create `packages/mcp/src/widgets.ts` with `WidgetPayload` discriminated union and all four variant interfaces (`StatRow`, `RecordTable`, `RecordCard`, `BadgeList`)
- [x] 1.2 Export all widget types from `packages/mcp/src/index.ts`

## 2. MCP Server: render_widget Tool

- [x] 2.1 Register `render_widget` tool in `packages/mcp/src/server.ts` with a JSON Schema input describing the full `kind` union
- [x] 2.2 Implement the `render_widget` handler: validate that `kind` is one of the known values; return `{ ok: true }` on success, tool error on unknown kind
- [x] 2.3 Rebuild `packages/mcp` (`npm run build`)

## 3. Chat Route: Widget Chunk Interception

- [x] 3.1 In `apps/dna-agent/app/api/chat/route.ts`, add a `widget` chunk type to the stream (`send({ type: 'widget', widget: payload })`)
- [x] 3.2 In the tool-execution loop, detect `block.name === 'render_widget'`; parse `block.input` as a `WidgetPayload`; call `send({ type: 'widget', widget: block.input })`; send `{ ok: true }` tool result back (skip the normal MCP `callTool` path for this tool)

## 4. ConversationPanel: Widget State & Streaming

- [x] 4.1 Import `WidgetPayload` type from `@dna-codes/dna-mcp` in `ConversationPanel.tsx`
- [x] 4.2 Add `widgets?: WidgetPayload[]` to the `Message` interface
- [x] 4.3 Add a `StreamChunk` variant: `{ type: 'widget', widget: WidgetPayload }`
- [x] 4.4 In the stream reader loop, handle `chunk.type === 'widget'` by appending the payload to the active assistant message's `widgets` array

## 5. InlineWidget Renderer Component

- [x] 5.1 Create `apps/dna-agent/components/InlineWidget.tsx` with a top-level `InlineWidget({ widget })` component that switches on `widget.kind`
- [x] 5.2 Implement `StatRowWidget`: horizontal flex row of compact `data-ui-card` tiles; label above, bold value below; apply `accent` as text color if provided
- [x] 5.3 Implement `RecordTableWidget`: `<table>` element with `data-ui-tag` header cells and muted body cells; handle sparse rows gracefully
- [x] 5.4 Implement `RecordCardWidget`: `data-ui-card` with title, optional muted subtitle, and a two-column CSS grid of label+value pairs
- [x] 5.5 Implement `BadgeListWidget`: optional label line, then `data-ui-badge` elements in a flex-wrap row with `data-variant` set per item
- [x] 5.6 Return `null` for unknown `kind` values

## 6. Wire Widgets into ConversationPanel

- [x] 6.1 Import `InlineWidget` in `ConversationPanel.tsx`
- [x] 6.2 In the message render loop, after the message text/markdown block, map over `msg.widgets` and render `<InlineWidget key={i} widget={w} />` for each

## 7. System Prompt: Widget Guidance

- [x] 7.1 Add a `## Widgets` section to `apps/dna-agent/lib/system-prompt.ts` instructing the agent when to call `render_widget` (after `patch_graph`, after `query_instances`), with widget kind guidance and count limits
- [x] 7.2 Keep widget instructions concise — the agent should use widgets to supplement text, not replace it

## 8. Verification

- [x] 8.1 Run `npx tsc --noEmit` in `apps/dna-agent` — zero type errors
- [x] 8.2 Manually test: tell the agent "Acme Corp has two reps: Jane and Bob"; confirm the agent builds the graph and optionally emits a widget summarizing what was created
- [x] 8.3 Manually test each widget kind by prompting the agent to show contacts as a table, pipeline as a stat row, etc.
