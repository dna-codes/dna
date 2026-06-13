## 1. MCP server — mode primitive & gating

- [x] 1.1 Replace `McpServerOptions.lockedTypes: boolean` with `mode: 'build' | 'operate'` in `packages/mcp/src/types.ts` (default `build`); export a `SessionMode` type.
- [x] 1.2 Update `validatePatchOps` in `packages/mcp/src/server.ts` to derive locking from `mode === 'operate'` and reject `add_resource_type` / `add_relationship_type` (and type stability updates) with the message `"Type registry is locked in Operate mode — switch to Build mode to add or change types."`.
- [x] 1.3 Update `GET /session-config` to return `{ pack, mode }` and `POST /session-config` to accept `{ mode }`; update `POST /reset` to accept `{ pack, mode }`.
- [x] 1.4 Update contract/patch-schema and server tests in `packages/mcp/src/__tests__` to cover Build-allows / Operate-rejects type ops and instance ops in both modes; rebuild `dist`.

## 2. App — system prompt gated by mode

- [x] 2.1 Change `buildSystemPrompt(pack, locked)` → `buildSystemPrompt(pack, mode)` in `apps/dna-agent/lib/system-prompt.ts`; replace the LOCKED/OPEN `governanceSection` with Build/Operate framing.
- [x] 2.2 In the Build prompt, add the stability lifecycle (`experimental → beta → stable → deprecated`), type creation/maturation guidance, and the explicit "simulation is a narrated dry-run — never commit instances" instruction.
- [x] 2.3 In the Operate prompt, keep the map-to-existing-types rules and the instance plan/apply/summarize protocol; scope `activate_lens` routing to the Operate lens IDs.
- [x] 2.4 Update the exported `SYSTEM_PROMPT` default and any call sites to pass `mode`.

## 3. App — REST + state wiring

- [x] 3.1 Update `apps/dna-agent/app/api/session-config/route.ts` and `app/api/reset/route.ts` to pass `mode` through to the MCP server.
- [x] 3.2 In `app/page.tsx`, replace `sessionConfig.locked` with `sessionConfig.mode`; read current mode on load from session-config.
- [x] 3.3 Replace `handleLockToggle` with a `handleModeChange(mode)` that POSTs `{ mode }` to `/api/session-config` and updates state on success (no graph reset).

## 4. App — UI controls

- [x] 4.1 Replace the header lock button in `app/page.tsx` with a two-segment Build/Operate control bound to `handleModeChange`; render a loading indicator in place of the control until the initial `GET /api/session-config` resolves (no client-side mode persistence).
- [x] 4.2 Replace the locked/open toggle in `components/SessionSetupModal.tsx` with a Build/Operate selection (default Build) and pass `mode` to `onSetupComplete` / `POST /api/reset`.

## 5. App — lens set gated by mode

- [x] 5.1 Pass `mode` into `components/LensPanelShell.tsx`; compute the visible lens set per mode (Operate = existing operational lenses; Build = `graph-explorer` only for this MVP — no bespoke stability lens).
- [x] 5.2 On mode switch, if the active lens is invalid in the new mode, fall back to the first valid lens.
- [x] 5.3 Thread `mode` through `ConversationPanel`/welcome copy as needed so agent-driven `activate_lens` targets only valid lens IDs.

## 6. Docs & verification

- [x] 6.1 Update `apps/dna-agent/README.md` and `packages/mcp/README.md` to document the Build/Operate mode (replacing lock-toggle references).
- [x] 6.2 Manual verify: start session in Build, create a type + simulate (no instances committed); switch to Operate, confirm type ops rejected and instance ops + operational lenses work; switch back.
- [x] 6.3 Run the dna-agent and MCP test suites; confirm green.
