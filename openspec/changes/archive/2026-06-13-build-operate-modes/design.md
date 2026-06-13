## Context

The dna-agent runs a Next.js app (`apps/dna-agent`) talking to an MCP server (`packages/mcp`). Session state today is `{ pack, locked }`: a starter pack plus a boolean lock that, when true, makes `validatePatchOps` reject `add_resource_type` / `add_relationship_type`. The lock is set at setup and toggled live via `GET/POST /session-config`; the app mirrors it in `app/page.tsx` and feeds it to `buildSystemPrompt(pack, locked)`.

This change reframes that single boolean as one facet of a richer **mode** axis. Types already carry a `Stability` lifecycle (`experimental | beta | stable | deprecated`, `packages/core/src/types/data-store.ts`) that defaults to `experimental` on creation — Build mode surfaces and exercises it; Operate mode ignores it.

## Goals / Non-Goals

**Goals:**
- A single session-level `mode: 'build' | 'operate'` that subsumes the lock boolean and gates prompt, patch ops, and lens set.
- Backward-compatible server enforcement: Operate behaves exactly like today's locked mode (same rejection of type-schema ops).
- Keep the source-of-truth pattern intact — prompt vocabulary still derived from `@dna-codes/dna-mcp`; mode adds *framing*, not a parallel vocabulary table.
- Surface the stability lifecycle in Build so the agent can promote (`experimental → beta → stable`) and `deprecate` types.

**Non-Goals:**
- A persisted, isolated **simulation store**. In this MVP, "simulate" is a conversational dry-run the agent narrates; no sandbox graph is committed or cleared. (Deferred to a follow-up.)
- New stability values or any data-model change. `beta` is the existing value (not `alpha`).
- Per-type or per-user mode. Mode is one session-wide setting, like pack.

## Decisions

### Decision: `mode` replaces `locked` as the session-config primitive

`McpServerOptions.lockedTypes: boolean` and the session-config `locked` field become `mode: 'build' | 'operate'`. `validatePatchOps` derives locking as `mode === 'operate'`. The violation message changes from "...switch to open mode..." to reference Build mode:
`"Type registry is locked in Operate mode — switch to Build mode to add or change types."`

*Why over keeping `locked` and layering `mode` on top:* the user decided Build/Operate **subsumes** the toggle. Two redundant booleans (`locked` derivable from `mode`) invite drift and an impossible state (Operate + open). One primitive, derive the rest.

*Migration:* `POST /session-config` and `POST /reset` accept `mode`. For one release the server MAY also accept `locked` (mapping `locked:true→operate`, `false→build`) so older clients don't break, but the app is updated in lockstep so this is optional. Default mode is `build` (matches today's default of open/unlocked).

### Decision: Mode gates three surfaces, each already mode-shaped

1. **System prompt** — `buildSystemPrompt(pack, mode)` replaces the `locked` param. The existing `governanceSection` (LOCKED/OPEN) becomes the mode framing: Build prompt explains type modeling, the stability lifecycle, and that simulation is a narrated dry-run; Operate prompt is the current "map everything to existing types, never call add_*_type" guidance plus the instance-wiring protocol.
2. **Patch ops** — type-schema ops (`add_resource_type`, `add_relationship_type`, and stability/`update` of types) are valid only in Build. Operate rejects them via the same `validatePatchOps` path used today.
3. **Lens set** — the lens tab bar shows a mode-appropriate set. Operate keeps the existing per-pack operational lenses (org-chart, pipeline, roster, …). Build shows modeling lenses focused on the type registry and stability (at minimum `graph-explorer` plus a type/stability view); `activate_lens` routing in the prompt is scoped to the active mode's lens IDs.

*Why a single `mode` param threaded through existing functions* rather than a new context object: the three surfaces already branch on `locked`/pack; swapping the discriminant is the smallest change that satisfies the requirements and keeps the derived-prompt invariant.

### Decision: UI — one segmented Build/Operate control replaces the lock button

The header lock button (`app/page.tsx`) becomes a two-segment Build/Operate switch. Toggling calls `POST /api/session-config { mode }` and updates state on success (same pattern as the current `handleLockToggle`). `SessionSetupModal` swaps its locked/open toggle for a Build/Operate choice; default `build`. Switching mode mid-session does **not** reset the graph — only the prompt, allowed ops, and visible lenses change.

## Risks / Trade-offs

- **Hidden lens state on mode switch** → switching to Operate hides Build-only lenses (and vice-versa); the active lens may disappear. Mitigation: on mode switch, fall back to the first lens valid in the new mode.
- **Agent confusion mid-session when mode flips** → the system prompt is rebuilt per request from current mode, so the next turn is consistent; but in-flight multi-turn plans (e.g. a half-built type) may be stranded. Mitigation: prompt instructs the agent to acknowledge mode and re-orient rather than continue a now-invalid plan.
- **"Simulation" under-delivers** → users may expect a real sandbox. Mitigation: the Build prompt is explicit that simulation is a narrated walkthrough in this version; the persisted sandbox is called out as a deferred follow-up in the proposal.
- **Optional `locked` back-compat** → if we keep accepting `locked`, two inputs can disagree. Mitigation: if both arrive, `mode` wins; document and drop `locked` acceptance next release.

## Resolved Questions

- **Build lens set** → Reuse `graph-explorer` only for this MVP; no bespoke type-registry/stability lens. A dedicated stability lens is deferred to a follow-up.
- **Mode persistence on reload** → The server session-config is the single source of truth. On mount the app calls `GET /api/session-config` and adopts the server's `mode`; nothing is persisted client-side. While the GET is in flight, the mode control renders a loading indicator (rather than defaulting to a possibly-wrong mode) so the UI never briefly shows the wrong mode or allows mode-gated actions before state is known.
