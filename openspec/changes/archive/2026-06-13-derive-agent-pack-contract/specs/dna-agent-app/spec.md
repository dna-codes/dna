## MODIFIED Requirements

### Requirement: Conversation panel streams agent responses

The conversation panel SHALL send user messages to a Next.js API route that invokes Claude (via `@anthropic-ai/sdk`) with the DNA MCP server connected as an MCP client. The system prompt sent to Claude SHALL derive its active-pack vocabulary from the shared pack-prompt renderer exported by `@dna-codes/dna-mcp` — presenting each resource type with its category and description and each relationship type with its `from`→`to` endpoints, cardinality, and description. The app SHALL NOT maintain a separate hand-written pack vocabulary table. Agent responses SHALL stream to the UI as they are produced, showing tool call progress (e.g., "Querying type registry…", "Patching graph…") before the final text response.

#### Scenario: User message produces a streaming response
- **WHEN** a user types a message and submits
- **THEN** the conversation panel begins displaying the agent's response incrementally, not all at once

#### Scenario: Tool call progress is surfaced during streaming
- **WHEN** the agent calls an MCP tool during its response
- **THEN** a progress indicator appears in the conversation panel naming the tool being called

#### Scenario: System prompt vocabulary is derived, not hardcoded
- **WHEN** the chat API route builds the system prompt for the active pack
- **THEN** the pack section is produced by the shared renderer reading the real pack definitions, and no hardcoded `PACK_VOCABULARY` table is referenced
