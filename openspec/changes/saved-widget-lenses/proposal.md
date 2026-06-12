## Why

Inline widgets in the chat give users quick visual summaries — but they scroll away. When a widget surfaces useful data (a pipeline snapshot, a contact table, an org stat row), the user has no way to pin it for ongoing reference. Saved widget lenses bridge the ephemeral chat and the persistent right panel: any inline widget can become a named lens tab that stays visible and can be refreshed or removed at will.

## What Changes

- Each inline widget in the chat gains a **"Save as lens"** button; clicking it prompts for a name and pins the widget as a new tab in the right panel
- The right panel (LensPanelShell) gains **dynamic saved-lens tabs** alongside the pack-defined tabs; each has an ✕ close button to remove it
- Saved lenses are stored in `localStorage` keyed by session so they survive page refreshes within a session
- A **"+ Add lens"** control in the tab bar lets users add a blank saved lens slot (for future manual entry — no input needed this iteration; the primary add path is from the chat widget)
- Saved lenses render using `InlineWidget` — the same renderer used in the chat — so the right panel and chat stay visually consistent
- On session reset (new pack selection), saved lenses are cleared

## Capabilities

### New Capabilities

- `saved-lens-store`: Client-side state + localStorage persistence for saved lenses — a `SavedLens[]` array with id, name, and `WidgetPayload`
- `lens-tab-management`: Dynamic tab add/remove in `LensPanelShell`; saved lens tabs are appended after pack tabs with close controls
- `save-widget-from-chat`: The "Save as lens" button on `InlineWidget` in `ConversationPanel`; inline name prompt; lifts the save action up to `page.tsx` via a callback

### Modified Capabilities

- `inline-widget-renderer`: `InlineWidget` gains an optional `onSave` callback prop; when provided, renders a save button
- `session-setup-flow`: On reset, `savedLenses` state is cleared (no spec-level behavior change — implementation only)

## Impact

- `apps/dna-agent/app/page.tsx` — add `savedLenses` state, `handleSaveLens` / `handleRemoveLens` callbacks; pass to both panels
- `apps/dna-agent/components/LensPanelShell.tsx` — accept `savedLenses` and `onRemoveLens` props; render saved lens tabs after pack tabs
- `apps/dna-agent/components/ConversationPanel.tsx` — accept `onSaveLens` prop; pass to `InlineWidget`
- `apps/dna-agent/components/InlineWidget.tsx` — accept optional `onSave` prop; render save button when provided
- `apps/dna-agent/lib/saved-lenses.ts` (new) — `SavedLens` type, localStorage read/write helpers
- No backend changes required — entirely client-side
