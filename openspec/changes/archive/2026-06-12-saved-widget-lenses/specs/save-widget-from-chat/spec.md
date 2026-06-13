## ADDED Requirements

### Requirement: ConversationPanel accepts onSaveLens prop and passes to InlineWidget
`ConversationPanel` SHALL accept `onSaveLens?: (name: string, widget: WidgetPayload) => void` and pass a bound callback to each `InlineWidget` it renders: `onSave={(name) => onSaveLens?.(name, widget)}`.

#### Scenario: save propagates from widget to page
- **WHEN** the user saves an inline widget with name "My View"
- **THEN** `onSaveLens("My View", widgetPayload)` is called on `page.tsx`

#### Scenario: no onSaveLens prop — no save button shown
- **WHEN** `ConversationPanel` is rendered without `onSaveLens`
- **THEN** inline widgets show no save button

### Requirement: page.tsx handleSaveLens creates a SavedLens and appends it
`handleSaveLens(name, widget)` SHALL create a `SavedLens` with `id: crypto.randomUUID()`, `savedAt: Date.now()`, and append it to `savedLenses`.

#### Scenario: new lens appended
- **WHEN** `handleSaveLens("Contacts", tableWidget)` is called
- **THEN** `savedLenses` gains one entry with name "Contacts" and the table widget payload

### Requirement: handleRemoveLens filters by id
`handleRemoveLens(id)` SHALL set `savedLenses` to the array with the matching entry removed.

#### Scenario: remove by id
- **WHEN** `handleRemoveLens(lens.id)` is called for an existing lens
- **THEN** that lens is no longer in `savedLenses`
