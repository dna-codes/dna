## ADDED Requirements

### Requirement: activate_lens MCP tool registration
The MCP server SHALL register an `activate_lens` tool with a single required input `lensId: string` describing the tab ID to activate. The handler SHALL return `{ ok: true }` unconditionally.

#### Scenario: tool appears in list
- **WHEN** a client calls `listTools` on the MCP server
- **THEN** `activate_lens` appears in the result with its description and input schema

#### Scenario: always returns ok
- **WHEN** the agent calls `activate_lens` with any `lensId` string
- **THEN** the server returns `{ ok: true }` without error

### Requirement: activate_lens intercepted by chat route
The chat API route SHALL intercept `activate_lens` tool calls before forwarding to MCP. It SHALL stream `{ type: "activate_lens", lensId: string }` as a newline-delimited JSON chunk, then send `{ ok: true }` as the tool result — identical in structure to the `render_widget` intercept pattern.

#### Scenario: chunk emitted on call
- **WHEN** the agent calls `activate_lens({ lensId: "job-descriptions" })` during a streaming chat response
- **THEN** the client receives `{ type: "activate_lens", lensId: "job-descriptions" }` in the stream

#### Scenario: does not call MCP callTool
- **WHEN** `activate_lens` is intercepted
- **THEN** no outbound call is made to the MCP server for this tool; the route handles it entirely

### Requirement: keyword→lens mapping in system prompt
The system prompt SHALL include a `## Lens routing` section, conditioned on the active pack, that lists each lens tab ID alongside the natural-language keywords and phrases that should trigger it. The agent SHALL use this table to decide when to call `activate_lens`.

#### Scenario: operational pack keywords present
- **WHEN** the system prompt is built for the `operational` pack
- **THEN** the routing section maps terms like "org chart", "job description", "span of control" to their corresponding tab IDs

#### Scenario: crm pack keywords present
- **WHEN** the system prompt is built for the `crm` pack
- **THEN** the routing section maps terms like "pipeline", "deals", "accounts" to their corresponding tab IDs

#### Scenario: hr pack keywords present
- **WHEN** the system prompt is built for the `hr` pack
- **THEN** the routing section maps terms like "roster", "open positions", "hiring" to their corresponding tab IDs

### Requirement: ConversationPanel handles activate_lens chunk
`ConversationPanel` SHALL handle `chunk.type === "activate_lens"` in the stream reader and call `onActivateLens(lensId)` if the prop is provided.

#### Scenario: callback invoked on chunk
- **WHEN** an `activate_lens` chunk arrives with `lensId: "pipeline"`
- **THEN** `onActivateLens("pipeline")` is called
