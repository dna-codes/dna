## Why

Right now the right panel is passive — the user has to manually click tabs to see relevant lenses. When the agent discusses a topic that has a direct lens (like "job descriptions" or "the pipeline"), the right panel should follow the conversation without requiring a tab click. Keyword-to-lens routing makes the two panels feel like a single coherent tool: the left side drives the right side.

## What Changes

- Define a **keyword→lens mapping** per pack in the system prompt — each pack lists its lenses with their tab IDs and the natural-language keywords that should trigger them
- Add an **`activate_lens` MCP tool** the agent can call to signal which tab to show; the call is intercepted by the chat route (like `render_widget`) and streamed as an `activate_lens` chunk
- The **`ConversationPanel`** handles the new chunk type and calls an `onActivateLens` callback
- **`page.tsx`** passes an `activeLensId` prop and setter to `LensPanelShell`; the shell uses it to override the locally-selected tab when driven by the agent
- The system prompt instructs the agent: after a `patch_graph` or query that relates to a known lens, call `activate_lens` with the appropriate lens tab ID

## Capabilities

### New Capabilities

- `lens-activation-protocol`: The `activate_lens` MCP tool, the `activate_lens` stream chunk, and the keyword→lens mapping definition that lives in the system prompt
- `lens-panel-agent-control`: `LensPanelShell` accepting an externally-driven active tab that the agent can set, while still allowing manual user tab clicks to override

### Modified Capabilities

- `inline-widget-renderer`: No spec-level change — unchanged
- `session-setup-flow`: No spec-level change — unchanged

## Impact

- `packages/mcp/src/server.ts` — register `activate_lens` tool with `lensId: string` input
- `apps/dna-agent/app/api/chat/route.ts` — intercept `activate_lens` tool call; stream `{ type: 'activate_lens', lensId }` chunk; return `{ ok: true }`
- `apps/dna-agent/components/ConversationPanel.tsx` — handle `activate_lens` chunk; call `onActivateLens(lensId)` callback prop
- `apps/dna-agent/app/page.tsx` — `agentLensId` state; `handleActivateLens` callback; pass to both panels
- `apps/dna-agent/components/LensPanelShell.tsx` — accept `agentLensId` prop; sync local `activeTab` when it changes; manual clicks still work normally
- `apps/dna-agent/lib/system-prompt.ts` — `## Lens routing` section with per-pack keyword→lensId tables and when-to-call instructions
- No breaking changes — `activate_lens` chunk is additive; panels without the prop degrade gracefully
