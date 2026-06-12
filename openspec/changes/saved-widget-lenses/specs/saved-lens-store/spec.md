## ADDED Requirements

### Requirement: SavedLens type
A `SavedLens` interface SHALL be defined in `apps/dna-agent/lib/saved-lenses.ts` with fields: `id: string`, `name: string`, `widget: WidgetPayload`, `savedAt: number`.

#### Scenario: shape is serializable
- **WHEN** a `SavedLens` is JSON-stringified and parsed back
- **THEN** all fields are preserved with their original values

### Requirement: localStorage persistence helpers
`saved-lenses.ts` SHALL export `loadSavedLenses(): SavedLens[]` and `persistSavedLenses(lenses: SavedLens[]): void`. The storage key SHALL be `'dna-saved-lenses'`.

#### Scenario: load from empty storage
- **WHEN** `loadSavedLenses()` is called and no key exists in localStorage
- **THEN** it returns an empty array without throwing

#### Scenario: load after persist
- **WHEN** `persistSavedLenses([lens])` is called then `loadSavedLenses()` is called
- **THEN** the returned array contains the same lens

#### Scenario: write error is silent
- **WHEN** `persistSavedLenses` throws (e.g. quota exceeded)
- **THEN** the error is caught and not re-thrown

### Requirement: savedLenses state in page.tsx
`page.tsx` SHALL initialize `savedLenses: SavedLens[]` from `loadSavedLenses()` on mount and persist on every change via `useEffect`.

#### Scenario: hydrated on mount
- **WHEN** the page mounts and localStorage contains saved lenses
- **THEN** the tab bar shows those lenses without the user doing anything

#### Scenario: session reset clears lenses
- **WHEN** the user starts a new session (handleReset)
- **THEN** `savedLenses` is set to `[]` and `localStorage.removeItem('dna-saved-lenses')` is called
