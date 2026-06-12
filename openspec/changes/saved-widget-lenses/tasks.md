## 1. SavedLens Store

- [x] 1.1 Create `apps/dna-agent/lib/saved-lenses.ts` with `SavedLens` interface (`id`, `name`, `widget: WidgetPayload`, `savedAt: number`)
- [x] 1.2 Implement `loadSavedLenses(): SavedLens[]` — reads and parses `localStorage['dna-saved-lenses']`; returns `[]` on missing or malformed data
- [x] 1.3 Implement `persistSavedLenses(lenses: SavedLens[]): void` — JSON.stringifies and writes to localStorage; silently catches write errors

## 2. page.tsx State & Handlers

- [x] 2.1 Add `savedLenses: SavedLens[]` state in `page.tsx`, initialized from `loadSavedLenses()`
- [x] 2.2 Add `useEffect` that calls `persistSavedLenses(savedLenses)` whenever `savedLenses` changes
- [x] 2.3 Implement `handleSaveLens(name: string, widget: WidgetPayload)` — creates a `SavedLens` with `crypto.randomUUID()` id and `Date.now()` savedAt; appends to state
- [x] 2.4 Implement `handleRemoveLens(id: string)` — filters `savedLenses` by id
- [x] 2.5 In `handleReset`, clear saved lenses: `setSavedLenses([])` + `localStorage.removeItem('dna-saved-lenses')`
- [x] 2.6 Pass `savedLenses` and `onRemoveLens={handleRemoveLens}` to `LensPanelShell`
- [x] 2.7 Pass `onSaveLens={handleSaveLens}` to `ConversationPanel`

## 3. LensPanelShell — Dynamic Saved Lens Tabs

- [x] 3.1 Add `savedLenses: SavedLens[]` and `onRemoveLens: (id: string) => void` to `LensPanelShellProps`
- [x] 3.2 In the tab list, render saved lens tabs after pack tabs — each trigger shows the lens name and a small ✕ button
- [x] 3.3 ✕ button: call `onRemoveLens(lens.id)` and stop event propagation (do not activate the tab)
- [x] 3.4 When active tab id matches a removed lens, reset active tab to the first pack tab key
- [x] 3.5 In tab content area, render `<InlineWidget widget={lens.widget} />` (no `onSave`) for active saved lens tabs; wrap in padding consistent with other tab panels

## 4. InlineWidget — Save Button & Inline Name Input

- [x] 4.1 Add optional `onSave?: (name: string) => void` prop to `InlineWidget`
- [x] 4.2 Add local `saving: boolean` and `nameInput: string` state inside `InlineWidget`
- [x] 4.3 When `onSave` is provided, render a small save/pin icon button (`⊞` or `↗`) in the widget's top-right; clicking it sets `saving = true`
- [x] 4.4 When `saving` is true, render a compact inline text input with a confirm button (✓); on Enter or ✓ click: call `onSave(nameInput.trim())` if non-empty, reset state
- [x] 4.5 On Escape keydown or if input blurs with empty value: reset `saving = false`, `nameInput = ''`
- [x] 4.6 Wrap each widget sub-component in a relative-positioned container so the save button can be absolutely positioned top-right

## 5. ConversationPanel — onSaveLens Prop

- [x] 5.1 Add `onSaveLens?: (name: string, widget: WidgetPayload) => void` to `ConversationPanelProps`
- [x] 5.2 Pass `onSave={(name) => onSaveLens?.(name, w)}` to each `<InlineWidget>` in the message render loop

## 6. Verification

- [x] 6.1 Run `npx tsc --noEmit` in `apps/dna-agent` — zero type errors
- [x] 6.2 Manually test: agent builds a graph → emits a widget → user clicks save → names it → tab appears on the right
- [x] 6.3 Manually test: page refresh → saved lens tab still present
- [x] 6.4 Manually test: click ✕ on a saved lens tab → tab removed; if it was active, fallback to first pack tab
- [x] 6.5 Manually test: session reset → saved lens tabs cleared
