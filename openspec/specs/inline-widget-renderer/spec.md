## Purpose

Render structured UI widgets (stat rows, record tables, record cards, badge lists) inline within agent chat messages, so the agent can surface visual summaries of graph data alongside its text responses.
## Requirements
### Requirement: Message type extended with widgets field
The `Message` interface in `ConversationPanel.tsx` SHALL include an optional `widgets?: WidgetPayload[]` array. When a `widget` stream chunk arrives for the active assistant message, the payload SHALL be appended to that message's `widgets` array.

#### Scenario: widget appended to active message
- **WHEN** a `widget` chunk arrives mid-stream for the current assistant turn
- **THEN** the message's `widgets` array gains the new payload and the UI re-renders immediately

#### Scenario: multiple widgets on one message
- **WHEN** the agent emits two `render_widget` calls in a single turn
- **THEN** both payloads appear under the same message, in emission order

### Requirement: InlineWidget component renders all four widget kinds
The `InlineWidget` component SHALL accept an optional `onSave?: (name: string) => void` prop in addition to `widget`. When `onSave` is provided, a save button SHALL appear in the top-right of the widget. Clicking it reveals a compact inline name input; submitting calls `onSave(name)` and closes the input. Pressing Escape or blurring without submitting cancels without saving.

#### Scenario: stat-row renders stat tiles
- **WHEN** a `stat-row` widget is rendered
- **THEN** each stat appears as a compact card tile with label above and bold value below; accent color applied if provided

#### Scenario: record-table renders column headers and rows
- **WHEN** a `record-table` widget is rendered
- **THEN** column names appear as header cells and each row renders as a table row; missing cells render as empty

#### Scenario: record-card renders field grid
- **WHEN** a `record-card` widget is rendered
- **THEN** the card shows title prominently, optional subtitle muted below, and fields in a two-column label/value grid

#### Scenario: badge-list renders badges
- **WHEN** a `badge-list` widget is rendered
- **THEN** each item renders as a `data-ui-badge` with variant applied if provided; items wrap on overflow

#### Scenario: unknown kind renders nothing
- **WHEN** a widget payload has an unrecognized `kind`
- **THEN** `InlineWidget` renders nothing (returns `null`) without throwing

#### Scenario: save button visible when onSave provided
- **WHEN** `InlineWidget` is rendered with an `onSave` prop
- **THEN** a save/pin icon button is visible in the widget header area

#### Scenario: save button absent when onSave not provided
- **WHEN** `InlineWidget` is rendered without an `onSave` prop
- **THEN** no save button or name input is rendered

#### Scenario: inline name input on save click
- **WHEN** the user clicks the save button
- **THEN** a text input replaces the button; the user types a name and presses Enter; `onSave(name)` is called; the input closes

#### Scenario: escape cancels save
- **WHEN** the inline name input is open and the user presses Escape
- **THEN** the input closes without calling `onSave`

### Requirement: Widgets appear below message text, inside the message bubble
Widgets SHALL render below the message text content within the same assistant message container. They are not separate message items.

#### Scenario: widget below text
- **WHEN** an assistant message has both `content` text and one or more `widgets`
- **THEN** the text renders first, then the widgets stack below it, all within the same message bubble

#### Scenario: widget-only message
- **WHEN** an assistant message has empty `content` and one widget
- **THEN** only the widget renders inside the bubble; no empty text node or whitespace gap above it

### Requirement: WidgetPayload types exported from packages/mcp
`packages/mcp/src/index.ts` SHALL export the `WidgetPayload` union type and all variant interfaces so the app can import them without duplicating type definitions.

#### Scenario: type import from mcp package
- **WHEN** `ConversationPanel.tsx` does `import type { WidgetPayload } from '@dna-codes/dna-mcp'`
- **THEN** TypeScript resolves the type without error

