## ADDED Requirements

### Requirement: render_widget tool registration
The MCP server SHALL register a `render_widget` tool with a JSON Schema input that is a discriminated union on the `kind` field, accepting `stat-row`, `record-table`, `record-card`, and `badge-list` payloads.

#### Scenario: tool is listed
- **WHEN** a client calls `listTools` on the MCP server
- **THEN** `render_widget` appears in the tool list with a description and the full union input schema

#### Scenario: valid payload accepted
- **WHEN** the agent calls `render_widget` with a well-formed payload (valid `kind`, required fields present)
- **THEN** the server returns `{ ok: true }` and does not return an error

#### Scenario: unknown kind rejected
- **WHEN** the agent calls `render_widget` with an unrecognized `kind` value
- **THEN** the server returns a tool error response without crashing

### Requirement: widget chunk type in the chat stream
The chat API route SHALL intercept `render_widget` tool calls in the agentic loop and emit a `{ type: "widget", widget: <payload> }` newline-delimited JSON chunk to the SSE stream before the tool result is sent back to the model.

#### Scenario: widget chunk emitted on valid call
- **WHEN** the agent calls `render_widget` with a valid payload during a streaming chat response
- **THEN** the client receives a `widget` chunk carrying the full payload before the next text chunk

#### Scenario: invalid tool input does not break stream
- **WHEN** the agent calls `render_widget` with malformed input
- **THEN** the chat route sends the MCP tool error result back to the model and continues the loop without emitting a widget chunk; the stream does not close

### Requirement: widget payload schema
The widget payload SHALL be a discriminated union with `kind` as the discriminator:

- `stat-row`: `{ kind: "stat-row", stats: [{ label: string, value: string, accent?: string }] }` — max 6 stat tiles
- `record-table`: `{ kind: "record-table", columns: string[], rows: string[][] }` — max 6 rows; rows length MUST match columns length
- `record-card`: `{ kind: "record-card", title: string, subtitle?: string, fields: [{ label: string, value: string }] }` — max 8 fields
- `badge-list`: `{ kind: "badge-list", label?: string, items: [{ text: string, variant?: "neutral" | "success" | "warning" }] }` — max 8 items

#### Scenario: stat-row payload roundtrip
- **WHEN** the agent calls `render_widget` with `{ kind: "stat-row", stats: [{ label: "Open", value: "4" }] }`
- **THEN** the chat route emits `{ type: "widget", widget: { kind: "stat-row", stats: [{ label: "Open", value: "4" }] } }`

#### Scenario: record-table with mismatched row length
- **WHEN** a `record-table` payload is submitted where a row array length differs from `columns` length
- **THEN** the MCP server MUST still return `{ ok: true }` (lenient validation); the renderer handles sparse rows gracefully
