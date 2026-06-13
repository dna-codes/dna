## Context

The app currently has two panels: `ConversationPanel` (left) and `LensPanelShell` (right). The right panel renders pack-defined tabs from `PACK_TABS` — a static `Record<string, TabDef[]>`. `LensPanelShell` takes `pack` and `refreshSignal` props. `page.tsx` owns all shared state.

`InlineWidget` is a pure renderer — it takes a `WidgetPayload` and returns JSX with no side effects. `ConversationPanel` renders widgets below message text via `msg.widgets[]`.

The `WidgetPayload` type (from `@dna-codes/dna-mcp`) is the natural lens definition — it's already serializable JSON, ready for localStorage.

## Goals / Non-Goals

**Goals:**
- Users can pin any chat widget to the right panel with a name
- Pinned lenses survive page refresh (within the same session)
- Users can close any saved lens tab
- The save interaction is low-friction: one click + name entry on the widget itself
- Saved lens tabs render identically to inline widgets (same `InlineWidget` component)
- Session reset clears saved lenses

**Non-Goals:**
- Cross-session persistence (different sessions get fresh lens sets)
- Editing a saved lens after save (rename is a future iteration)
- Multiple workspaces or lens collections
- Server-side lens storage
- Reordering saved lens tabs

## Decisions

### 1. State lives in `page.tsx`, persisted to localStorage

**Decision:** `savedLenses: SavedLens[]` state in `page.tsx`. On mount, hydrate from `localStorage['dna-saved-lenses']`. On change, write back. `handleSaveLens(name, widget)` and `handleRemoveLens(id)` passed down as props.

**Why over a context or global store:** The app is small and already uses prop-passing for `refreshSignal`, `pack`, and `onGraphPatched`. Adding two more props is consistent and avoids introducing a context layer for one feature.

**Why localStorage over sessionStorage:** localStorage survives hard refresh; sessionStorage doesn't. The user's lens set should survive an accidental reload.

### 2. SavedLens shape

```ts
interface SavedLens {
  id: string          // crypto.randomUUID() at save time
  name: string        // user-provided
  widget: WidgetPayload
  savedAt: number     // Date.now() — for future ordering/display
}
```

Stored as `JSON.stringify(savedLenses)` under key `'dna-saved-lenses'`. On session reset, `localStorage.removeItem('dna-saved-lenses')` + `setSavedLenses([])`.

### 3. Save interaction: inline name prompt on the widget

**Decision:** `InlineWidget` accepts an optional `onSave?: (name: string) => void` prop. When present, a small save icon button appears in the widget's top-right corner. Clicking it opens a compact inline text input (replacing the button) for the user to type a name and press Enter or click ✓. Escape or blur cancels.

**Why inline over a modal:** A modal is heavyweight for a one-field action. The inline input stays in context — the user can see the widget while naming it.

**Why optional prop over a wrapper:** Keeps `InlineWidget` self-contained; the save affordance is part of the widget, not an outer shell. The prop is absent when widgets are rendered in `LensPanelShell` (no re-saving).

### 4. Saved lens tabs appended after pack tabs, with ✕ close

**Decision:** `LensPanelShell` accepts `savedLenses: SavedLens[]` and `onRemoveLens: (id: string) => void`. Pack tabs render first (unchanged). Saved lens tabs render after, each with a small ✕ button inside the tab trigger. Active tab state continues to be managed locally in `LensPanelShell`.

When a saved lens is removed and it was the active tab, active tab falls back to the first pack tab.

### 5. No "blank add" button this iteration

The proposal mentioned a "+ Add lens" control. This is deferred — the primary add path (save from chat) is the useful one. A blank slot with no payload has no clear purpose yet.

## Risks / Trade-offs

- **localStorage quota exceeded** (unlikely for small widget payloads, but possible if many are saved) → silent catch on write; show no error (won't crash the app)
- **Stale lenses after schema changes** → `WidgetPayload` shape is simple and additive; old payloads render gracefully via `InlineWidget`'s `null` fallback for unknown kinds
- **Name collision** — two lenses can have the same name. This is fine; they have distinct IDs.
- **Inline name input UX** — small inline input may feel unfamiliar. Trade-off accepted for avoiding modal overhead.

## Migration Plan

No migration needed — new state, new localStorage key. Existing sessions start with `savedLenses: []`.

## Open Questions

- Should saved lenses refresh automatically when `refreshSignal` fires? (Likely yes for `record-table`/`stat-row` lenses — but the widget payload is static, not a live query. Defer until lenses can hold a query spec, not just a snapshot.)
