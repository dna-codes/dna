## 1. Pack Registry

- [x] 1.1 Create `packages/mcp/src/packs/` directory with `operational.ts`, `crm.ts`, `hr.ts` — each exporting `resourceTypes` and `relationshipTypes` arrays
- [x] 1.2 Create `packages/mcp/src/packs/index.ts` — exports `PACKS` registry map and `PackName` type (`'operational' | 'crm' | 'hr'`)
- [x] 1.3 Replace `packages/mcp/src/default-schema.ts` with `packages/mcp/src/packs/seed.ts` — exports `seedPack(store, packName)` that seeds the given pack idempotently
- [x] 1.4 Update `packages/mcp/src/bin.ts` to call `seedPack(store, packName)` instead of `seedDefaultSchema`

## 2. Type Governance — Server

- [x] 2.1 Add `lockedTypes: boolean` to `McpServerOptions` in `packages/mcp/src/types.ts`
- [x] 2.2 Thread `lockedTypes` into `createMcpServer` — store in a mutable ref alongside the store ref
- [x] 2.3 Update `validatePatchOps` in `server.ts` — reject `add_resource_type` and `add_relationship_type` with the lock violation message when locked
- [x] 2.4 Add `GET /session-config` handler in `server.ts` — returns `{ pack: string, locked: boolean }`
- [x] 2.5 Add `POST /session-config` handler in `server.ts` — accepts `{ locked: boolean }`, updates the mutable locked ref
- [x] 2.6 Update `POST /reset` handler to accept `{ pack?: string, locked?: boolean }` body, re-seed with the chosen pack, update lock state

## 3. Type Governance — Agent App API

- [x] 3.1 Create `apps/dna-agent/app/api/session-config/route.ts` — GET and POST that proxy to MCP server's `/session-config`
- [x] 3.2 Update `apps/dna-agent/app/api/reset/route.ts` — forward `pack` and `locked` from request body to MCP server reset endpoint

## 4. Session Setup Modal

- [x] 4.1 Create `apps/dna-agent/components/SessionSetupModal.tsx` — full-screen overlay with pack cards (name, description, type list) and locked/open toggle
- [x] 4.2 Wire modal into `apps/dna-agent/app/page.tsx` — show on first load and after reset; pass `onComplete(pack, locked)` callback
- [x] 4.3 Style pack cards to match the dark theme — selected state uses teal border/background, type tags shown as small pills

## 5. System Prompt

- [x] 5.1 Convert `SYSTEM_PROMPT` in `apps/dna-agent/lib/system-prompt.ts` to `buildSystemPrompt(packName: string, locked: boolean): string`
- [x] 5.2 Append active pack vocabulary summary and lock mode instructions to the generated prompt
- [x] 5.3 Update `apps/dna-agent/app/api/chat/route.ts` to call `buildSystemPrompt` with the current session config

## 6. Lock Toggle UI

- [x] 6.1 Create a `LockToggle` component (or inline in `page.tsx`) — small pill button showing lock state, calls `POST /api/session-config` on click
- [x] 6.2 Fetch initial lock state from `GET /api/session-config` on page load and after modal setup
- [x] 6.3 Display active pack name alongside the lock toggle as a subtle label

## 7. Cleanup

- [x] 7.1 Delete `packages/mcp/src/default-schema.ts` (superseded by packs/seed.ts)
- [x] 7.2 TypeScript check — `cd packages/mcp && npx tsc --noEmit` and `cd apps/dna-agent && npx tsc --noEmit` both pass clean
