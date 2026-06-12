## Why

When a new session starts, the DNA agent has no type vocabulary — users must describe everything from scratch or the agent improvises types ad hoc. This leads to inconsistent naming and wasted conversation turns on boilerplate schema setup. Additionally, there is no way to lock a mature org's schema against accidental drift.

## What Changes

- Add a **starter pack registry** in `packages/mcp` — named bundles of resource and relationship types representing common business domains (Operational, CRM, HR)
- Add a **pack selection UI** in `dna-agent` — shown on session start / reset so users can pick their starting vocabulary
- Add a **type governance toggle** (locked / open) — UI switch + MCP server enforcement that prevents or allows new type creation mid-session
- Update the **agent system prompt** to reflect the active pack and constraint mode
- Update the **/reset flow** to re-seed from the selected pack with optional lock state

## Capabilities

### New Capabilities

- `starter-pack-registry`: Named packs of resource + relationship type definitions that seed the store on session start. Initial packs: Operational (already partially exists as `default-schema.ts`), CRM, HR.
- `type-governance`: A locked/open mode toggle. In locked mode, `add_resource_type` and `add_relationship_type` patch ops are rejected by the server. The UI exposes the toggle and current state.
- `session-setup-flow`: A session start / reset experience where the user picks a starter pack and initial governance mode before the agent begins.

### Modified Capabilities

- `core-lenses`: No requirement changes — existing lens behavior is unchanged, but the Operational pack formalizes the types they depend on (`position`, `person`, `step`, etc.).

## Impact

- `packages/mcp/src/default-schema.ts` — replaced by a pack registry with named exports
- `packages/mcp/src/server.ts` — `createMcpServer` options gain `lockedTypes: boolean`; validator enforces it
- `packages/mcp/src/bin.ts` — reads pack name and lock flag from env / config
- `apps/dna-agent/app/api/reset/route.ts` — accepts `{ pack, locked }` body
- `apps/dna-agent/app/api/session-config/route.ts` — new endpoint: GET current config, POST update lock state
- `apps/dna-agent/components/SessionSetupModal.tsx` — new component: pack picker + lock toggle shown on first load / reset
- `apps/dna-agent/lib/system-prompt.ts` — updated to include active pack name and lock state context
