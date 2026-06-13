## Why

The dna-agent today conflates two fundamentally different activities behind a single open/locked toggle: defining the *grammar* (resource and relationship **types**, their maturity) and running *operations* on **instances**. A business leader modeling a new concept and one staffing a live org are doing different work, with different vocabulary, different guardrails, and different views — but the UI gives them one undifferentiated surface. Splitting the agent into an explicit **Build** mode (model, mature, simulate types) and **Operate** mode (create and wire real instances) makes the current activity legible and lets each mode gate the prompt, tools, and lenses to fit the task.

## What Changes

- Introduce a session-level **mode**: `build` | `operate`, defaulting to the mode chosen at session setup.
- **Build mode** is type-focused: the registry is open, `add_resource_type` / `add_relationship_type` and stability changes are allowed, and the agent can mature types through the lifecycle (`experimental → beta → stable → deprecated`). Simulation in this MVP is a **conversational dry-run** the agent narrates — how proposed types would behave with example instances — without committing anything to the graph.
- **Operate mode** is instance-focused: the registry is effectively locked (type-schema ops rejected, exactly as today's locked mode), and the agent creates/wires resource and relationship instances.
- **BREAKING**: The standalone open/locked lock toggle is **removed** and subsumed by the mode toggle. Build ⇒ open registry; Operate ⇒ locked registry. There is no longer an independent lock control.
- The mode swaps three things: the **system prompt**, the **available patch ops** (type-schema ops gated to Build), and the **lens set** (modeling/type lenses in Build; operational instance lenses in Operate).
- Mode is persisted in the server's session-config and read/written at runtime via REST (`GET`/`POST /session-config` carry `mode`).
- Session setup selects a **starting mode** instead of a locked/open toggle.

## Capabilities

### New Capabilities
- `build-operate-modes`: The two-mode model — definitions of Build vs Operate, what each mode gates (system prompt, patch ops, lens set), mode persistence in session-config and its REST contract, and the UI mode toggle that replaces the lock control.

### Modified Capabilities
- `type-governance`: Locked/open is no longer an independent setting — it is **derived from mode** (Operate ⇒ locked, Build ⇒ open). The standalone UI lock-toggle requirement is removed; the server enforcement and prompt-gating requirements are re-expressed in terms of mode; the REST session-config requirement carries `mode`.
- `session-setup-flow`: The "initial governance mode (locked/open)" selection is replaced by a **Build/Operate starting-mode** selection, and confirming setup calls `POST /api/reset` with `{ pack, mode }`.

## Impact

- **App (`apps/dna-agent`)**: `lib/system-prompt.ts` (mode-gated prompt), `app/page.tsx` (mode toggle replacing lock toggle; mode state), `components/SessionSetupModal.tsx` (mode selection), `components/ConversationPanel.tsx` and `LensPanelShell.tsx` (mode-gated lens set), `app/api/session-config/route.ts` and `app/api/reset/route.ts` (mode field).
- **MCP server (`packages/mcp`)**: `src/server.ts` and `src/types.ts` — session-config `mode` field, patch-op gating derived from mode rather than a `lockedTypes` boolean; REST `/session-config` request/response shape.
- **Specs**: new `build-operate-modes`; deltas to `type-governance` and `session-setup-flow`.
- No data-model change — `Stability` already exists (`experimental | beta | stable | deprecated`); this change surfaces it in Build, it does not introduce it.
