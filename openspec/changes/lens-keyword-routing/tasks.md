## 1. MCP Server: activate_lens Tool

- [x] 1.1 In `packages/mcp/src/server.ts`, register an `activate_lens` tool with input `{ lensId: z.string() }` and description "Switch the right-panel lens tab to the given tab ID"
- [x] 1.2 Handler returns `{ ok: true }` unconditionally
- [x] 1.3 Rebuild `packages/mcp` (`npm run build`)

## 2. Chat Route: activate_lens Interception

- [x] 2.1 In `apps/dna-agent/app/api/chat/route.ts`, add `activate_lens` to the intercepted tools block (alongside `render_widget`)
- [x] 2.2 On intercept: stream `{ type: 'activate_lens', lensId: block.input.lensId }`; push `{ ok: true }` tool result; `continue`

## 3. ConversationPanel: activate_lens Chunk & Callback

- [x] 3.1 Add `onActivateLens?: (lensId: string) => void` to `ConversationPanelProps`
- [x] 3.2 Add `activate_lens` variant to `StreamChunk` type: `{ type: 'activate_lens'; lensId: string }`
- [x] 3.3 In the stream reader loop, handle `chunk.type === 'activate_lens'`: call `onActivateLens?.(chunk.lensId)`
- [x] 3.4 Wire `onActivateLens={handleActivateLens}` in `page.tsx` → `ConversationPanel`

## 4. page.tsx: agentLens Signal State

- [x] 4.1 Add `agentLens: { lensId: string; seq: number } | null` state (init `null`) and a monotonic `seqRef` counter (`useRef(0)`)
- [x] 4.2 Implement `handleActivateLens(lensId: string)` — increments `seqRef.current`, sets `agentLens({ lensId, seq: seqRef.current })`
- [x] 4.3 Pass `agentLens={agentLens}` to `LensPanelShell`

## 5. LensPanelShell: Agent-Driven Tab Sync

- [x] 5.1 Add `agentLens?: { lensId: string; seq: number } | null` to `LensPanelShellProps`
- [x] 5.2 Add `useEffect` watching `agentLens`: if `agentLens` is non-null and `lensId` exists in `packTabs` or `savedLenses`, call `setActiveTab(agentLens.lensId)`
- [x] 5.3 Verify manual tab clicks still call `setActiveTab` directly and are unaffected by the new effect

## 6. System Prompt: Lens Routing Section

- [x] 6.1 Add `## Lens routing` section to `buildSystemPrompt` in `apps/dna-agent/lib/system-prompt.ts`, conditioned on `packName`
- [x] 6.2 For `operational`: list tab IDs with keyword triggers — `org-chart`, `people-positions`, `reporting-chains`, `span-of-control`, `job-descriptions`, `graph-explorer`
- [x] 6.3 For `crm`: list `pipeline`, `accounts`, `graph-explorer` with triggers
- [x] 6.4 For `hr`: list `org-chart`, `roster`, `reporting-chains`, `open-positions`, `graph-explorer` with triggers
- [x] 6.5 Add agent instruction: call `activate_lens` after queries/patches that relate to a lens topic, or when the user explicitly asks to "see" or "show" something; do NOT call on every response

## 7. Verification

- [x] 7.1 Run `npx tsc --noEmit` in `apps/dna-agent` — zero type errors
- [x] 7.2 Manually test: ask "show me the org chart" → right panel switches to Org Chart tab
- [x] 7.3 Manually test: ask about job descriptions → Job Descriptions tab activates
- [x] 7.4 Manually test: manual tab click after agent switch → user selection takes effect
- [x] 7.5 Manually test: CRM pack — "show me the pipeline" → Pipeline tab activates
