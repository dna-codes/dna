# lens-tab-management Specification

## Purpose
TBD - created by archiving change saved-widget-lenses. Update Purpose after archive.
## Requirements
### Requirement: LensPanelShell accepts savedLenses and onRemoveLens props
`LensPanelShell` SHALL accept `savedLenses: SavedLens[]` and `onRemoveLens: (id: string) => void` as props. Saved lens tabs SHALL render after all pack-defined tabs.

#### Scenario: saved lenses appear after pack tabs
- **WHEN** `savedLenses` contains two entries
- **THEN** the tab bar shows all pack tabs first, then the two saved lens tabs in saved order

#### Scenario: empty savedLenses shows no extra tabs
- **WHEN** `savedLenses` is empty
- **THEN** the tab bar shows only pack-defined tabs, unchanged

### Requirement: Each saved lens tab has a close button
Each saved lens tab trigger SHALL contain a small ✕ button. Clicking it SHALL call `onRemoveLens(lens.id)` and NOT activate the tab.

#### Scenario: close removes the tab
- **WHEN** the user clicks ✕ on a saved lens tab
- **THEN** that tab disappears and `onRemoveLens` is called with the correct id

#### Scenario: closing active tab falls back to first pack tab
- **WHEN** the active tab is a saved lens and the user closes it
- **THEN** the active tab resets to the first pack tab's key

### Requirement: Saved lens tab renders InlineWidget
When a saved lens tab is active, its content area SHALL render `<InlineWidget widget={lens.widget} />` with no `onSave` prop (no re-saving from the right panel).

#### Scenario: saved lens content matches saved widget
- **WHEN** a `stat-row` widget was saved as "Pipeline Summary"
- **THEN** activating that tab renders the same stat tiles as the original inline widget

