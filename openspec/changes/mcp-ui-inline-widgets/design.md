## Context

The DNA Agent's chat stream today emits three chunk types: `text`, `tool_call`, and `graph_patched`. The agentic loop in `api/chat/route.ts` already intercepts specific tool calls (e.g. detecting `patch_graph` to emit a `graph_patched` signal). We extend that interception pattern to handle a new `render_widget` tool, which the agent calls when it wants to surface a visual summary.

The ui-library skin is already embedded in `globals.css` via `data-ui-*` attribute selectors. Widgets will use the same attribute system — `data-ui-card`, `data-ui-badge`, `data-ui-tag`, etc. — so they look native to the app without importing any React components.

Current `Message` shape: `{ id, role, content, toolCalls?: string[] }`.

## Goals / Non-Goals

**Goals:**
- Agent can emit typed widget payloads (stat tiles, tables, record cards, badge lists) inline in the chat thread
- Widgets render using `data-ui-*` ui-library attributes — consistent with existing panels
- The stream protocol extension is additive: existing clients that don't understand `widget` chunks degrade to text-only
- Widget logic lives on both sides: MCP server defines and validates the schema; chat route intercepts the tool and streams the payload; ConversationPanel renders it

**Non-Goals:**
- Interactive widgets (clickable, editable) — read-only in this iteration
- Custom widget types defined by packs — fixed vocabulary for now
- Streaming a widget progressively — widgets arrive as a single complete payload
- Replacing lens panels — widgets are quick inline summaries, not full lens views

## Decisions

### 1. Delivery via intercepted tool call, not text parsing

**Decision:** Agent calls `render_widget(payload)` as an MCP tool. The chat route detects this tool call, extracts `block.input` as the widget payload, streams a `{ type: 'widget', widget: payload }` chunk to the client, then sends a minimal success result back to the model so the loop continues.

**Why over text-based embedding (JSON in a code fence):** Text parsing is fragile — the model sometimes adds extra prose around fenced JSON, truncates it, or formats it differently. A tool call forces a structured, validated input at the MCP layer.

**Why not a separate WebSocket or SSE channel:** The existing newline-delimited JSON stream already handles interleaved chunk types; adding a new type is zero-infrastructure.

### 2. Widget payload as discriminated union on `kind`

```ts
type WidgetPayload =
  | { kind: 'stat-row';      stats: { label: string; value: string; accent?: string }[] }
  | { kind: 'record-table';  columns: string[]; rows: string[][] }
  | { kind: 'record-card';   title: string; subtitle?: string; fields: { label: string; value: string }[] }
  | { kind: 'badge-list';    label?: string; items: { text: string; variant?: 'neutral' | 'success' | 'warning' }[] }
```

`kind` is the discriminator. MCP server validates incoming input matches one of these shapes before streaming. Unknown `kind` returns a tool error without crashing the stream.

### 3. Widgets stored on the Message record, rendered below message text

**Decision:** Extend `Message` with `widgets?: WidgetPayload[]`. When a `widget` stream chunk arrives for the current assistant message, append to `widgets`. ConversationPanel renders text first, then any widgets below it within the same message bubble container.

**Why not separate widget-only messages:** Keeping widgets attached to the message that triggered them preserves the narrative flow — the agent says "here's your pipeline snapshot" and the widget appears as part of that same turn.

### 4. `render_widget` is a no-op on the MCP server side

The MCP server validates the payload and returns `{ ok: true }`. All the rendering logic is in the client. The tool exists in the MCP tool registry purely to give the model a structured call target with an input schema it can generate against.

### 5. System prompt additions

Add a `## Widgets` section to the system prompt instructing the agent:
- After building graph nodes with `patch_graph`, optionally call `render_widget` with a `record-card` or `stat-row` summarizing what was just created
- After querying with `query_instances`, optionally render a `record-table`
- Keep widgets tight — max 4 stat tiles, max 6 table rows, max 5 badge items
- Never render a widget without accompanying text; the widget supplements, doesn't replace, the narrative

## Risks / Trade-offs

- **Model over-uses widgets** → system prompt guardrails (max counts, "supplements not replaces") + easy to tune
- **MCP server validation rejects valid-looking payloads** → keep the schema lenient (optional fields optional, no deep nesting); log rejected payloads
- **Widget payload is large and slows the stream** → widgets are small by design; if needed, cap field counts in server validation
- **ConversationPanel grows complex** → widget renderer is a separate `InlineWidget` component, not inline JSX; isolates complexity

## Migration Plan

No migration needed — additive change. Existing sessions that don't emit `render_widget` are unaffected. The new `widget` chunk type is ignored by any prior client code (the `if (chunk.type === ...)` switch just falls through).

## Open Questions

- Should widgets be collapsible? (Likely yes in a future iteration — skip for now)
- Should pack system prompts each have tailored widget suggestions? (Defer — global guidance is enough for the initial cut)
