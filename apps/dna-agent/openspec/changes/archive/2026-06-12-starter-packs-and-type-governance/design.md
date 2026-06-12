## Context

The MCP server currently seeds a hardcoded set of operational types from `default-schema.ts` on every startup. There is no UI for selecting a domain vocabulary, no way to switch schemas between sessions, and no mechanism to prevent the agent from expanding the type registry once an org's schema is mature. This change formalizes packs as first-class configuration and adds a governance layer to the patch pipeline.

## Goals / Non-Goals

**Goals:**
- Named starter packs that seed resource + relationship types in one step
- A session setup UI (shown on first load and reset) for pack selection and lock mode
- Server-side enforcement of locked mode — agent cannot add types when locked
- Agent system prompt awareness of active pack and lock state
- Three initial packs: Operational, CRM, HR

**Non-Goals:**
- Custom pack authoring UI (packs are code-defined for now)
- Per-type locking (all-or-nothing toggle)
- Pack versioning or migration between packs mid-session
- Persisting pack/lock selection across server restarts (in-memory only for now)

## Decisions

### Pack registry as a static map

Packs are defined as a `Record<PackName, PackDefinition>` in `packages/mcp/src/packs/`. Each pack exports its type arrays; the registry re-exports them all under a string key.

**Why not JSON files?** TypeScript definitions are type-safe and co-located with the seeding logic. JSON would require a schema + parser and adds no end-user authoring benefit at this stage.

**Alternative considered:** `seedFromDna()` with `OperationalDNA` objects per pack. Rejected — `OperationalDNA` maps domain category keys (`roles`, `persons`) not domain-specific names, and the `seedFromDna` contract requires `from`/`to` type names to already exist for relationship types.

### Lock state lives on the server, not the client

`createMcpServer` accepts `{ lockedTypes: boolean }` and holds it in a mutable ref. A `POST /session-config` endpoint toggles it at runtime. The UI reads current state via `GET /session-config` and posts changes.

**Why not client-only?** The agent bypasses the UI entirely — it calls `patch_graph` directly. Enforcement must be in `validatePatchOps` on the server.

**Alternative considered:** A signed JWT claim. Overkill for single-user dev tool.

### Session setup as a modal overlay, not a route

A `SessionSetupModal` renders over the full UI on first load and after reset (tracked via a `setupDone` React state in `page.tsx`). This avoids a separate route and keeps the setup co-located with the reset flow.

### Pack selection passed through the reset API

`POST /api/reset` accepts `{ pack?: string, locked?: boolean }`. The server re-creates the store, seeds the chosen pack, and sets the lock state atomically. This keeps reset and pack-switch as one operation.

### System prompt updated with pack + lock context

A new `buildSystemPrompt(packName, locked)` function replaces the static `SYSTEM_PROMPT` export. It appends:
- Active pack name and its type vocabulary summary
- Whether the registry is locked and what that means for the agent

## Risks / Trade-offs

- **In-memory lock state resets on server restart** → acceptable for dev; production would persist this to the store
- **Pack mismatch after manual type edits** → if a user adds types then resets to a different pack, the types are wiped; the modal makes this explicit
- **HR / CRM packs are best-effort initial definitions** → they'll need iteration based on real usage; `stability: 'experimental'` signals this

## Open Questions

- Should "open" mode show a warning in the UI when the agent creates a new type (so users notice schema drift)?
- Should packs be composable (e.g., "Operational + CRM") or single-select only?
