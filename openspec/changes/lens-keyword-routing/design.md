## Context

The app has an agentic chat loop in `api/chat/route.ts` that already intercepts specific tool calls: `patch_graph` emits `graph_patched`, `render_widget` emits `widget`. Both patterns skip the normal MCP `callTool` path and return `{ ok: true }` directly. `activate_lens` follows the same pattern.

`LensPanelShell` currently owns `activeTab` state entirely locally. It resets to the first pack tab when `pack` changes. Manual tab clicks call `setActiveTab` directly.

The system prompt already has pack-aware sections (type vocabulary, governance, wiring expectations). The keyword→lens table fits naturally as a new `## Lens routing` section.

## Goals / Non-Goals

**Goals:**
- Agent can call `activate_lens(lensId)` to switch the right panel tab
- Works with pack-defined tabs and saved lens tabs (by ID)
- Manual user tab clicks always work and are not blocked by agent state
- System prompt tells the agent which keywords map to which lens IDs, per pack
- Agent-driven tab switch is smooth: no flicker, no reset of other state

**Non-Goals:**
- Automatic keyword detection in the chat text (no regex scanning of messages)
- The agent proactively scanning every message for keywords — it decides when to call based on system prompt instructions
- Routing to non-existent lens IDs (silently ignored)

## Decisions

### 1. Agent-driven tab as a prop, not shared global state

**Decision:** `page.tsx` holds `agentLensId: string | null` state. `handleActivateLens(lensId)` sets it. It's passed as a prop to `LensPanelShell`. Inside the shell, a `useEffect` watches `agentLensId` and calls `setActiveTab(agentLensId)` when it changes and the ID is valid (exists in pack tabs or saved lenses).

**Why not lift all tab state to page.tsx:** `LensPanelShell` has local tab state for a reason — it resets on pack change, handles saved lens removal fallback, etc. Lifting it all up would couple page.tsx too tightly to lens internals. The prop-override pattern keeps both independent: agent sets the intent; shell decides whether to honor it.

**Why `agentLensId` separate from tab state:** The agent may set the same lens ID twice (e.g., two questions about the org chart in a row). If `agentLensId` were the same value as `activeTab`, the second call would produce no state change and no `useEffect` trigger. Using a separate signal (even a `{ id, ts }` object if needed) avoids the deduplication problem. For simplicity, wrap as `{ lensId: string; seq: number }` where `seq` is a monotonic counter — the effect triggers on every new value.

### 2. `activate_lens` is a no-op on the MCP server

Same pattern as `render_widget`: the server registers the tool with a valid schema so the model can call it, but the handler just returns `{ ok: true }`. All logic is in the chat route interceptor.

### 3. Keyword table lives in the system prompt, not a separate config file

**Decision:** The keyword→lensId mapping is inlined in `buildSystemPrompt` as part of the `## Lens routing` section, conditioned on the active pack.

**Why not a separate JSON/TS config:** The mapping is only consumed by the LLM (not by any runtime code). Keeping it in the prompt alongside the other pack-specific instructions makes it easier to update both together. Runtime lens ID validation happens in `LensPanelShell` anyway.

### 4. Keyword tables per pack

```
operational:
  "org chart", "reporting", "hierarchy"  → org-chart
  "people", "positions", "headcount"      → people-positions
  "reporting chain", "direct reports"    → reporting-chains
  "span of control", "manager ratio"     → span-of-control
  "job description", "JD", "open role"   → job-descriptions
  "graph", "explorer", "raw data"        → graph-explorer

crm:
  "pipeline", "deals", "opportunities"   → pipeline
  "accounts", "companies", "customers"   → accounts
  "graph", "explorer"                    → graph-explorer

hr:
  "org chart", "hierarchy"               → org-chart
  "roster", "employees", "team"          → roster
  "reporting", "direct reports"          → reporting-chains
  "open positions", "job postings", "hiring" → open-positions
  "graph", "explorer"                    → graph-explorer
```

### 5. Agent instruction: when to call activate_lens

The prompt instructs the agent to call `activate_lens` in these situations:
- After a `query_instances` or `get_lens` call that returns data for a specific lens topic
- After a `patch_graph` that creates entities associated with a specific lens (e.g., adding job postings → activate `job-descriptions`)
- When the user explicitly asks to "see", "show", "view", or "open" a specific lens topic
- NOT on every message — only when context clearly maps to a lens

## Risks / Trade-offs

- **Agent over-activates** — calls `activate_lens` on every response, making the tab constantly jump. Mitigated by explicit system prompt guidance: "only call when the user is asking to see something or when you've just built/queried data for that lens."
- **Agent activates wrong lens ID** — silently ignored in `LensPanelShell` (the tab just doesn't change). Low risk since IDs are listed explicitly in the prompt.
- **Stale agentLensId after pack change** — handled: `LensPanelShell` ignores `agentLensId` if it's not in the current pack's tab list.

## Open Questions

- Should `activate_lens` also work for saved lens IDs (UUIDs)? Yes — the effect checks both pack tabs and `savedLenses` before switching.
