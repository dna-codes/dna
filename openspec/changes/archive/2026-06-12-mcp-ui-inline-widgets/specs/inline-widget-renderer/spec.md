## ADDED Requirements

### Requirement: Message type extended with widgets field
The `Message` interface in `ConversationPanel.tsx` SHALL include an optional `widgets?: WidgetPayload[]` array. When a `widget` stream chunk arrives for the active assistant message, the payload SHALL be appended to that message's `widgets` array.

#### Scenario: widget appended to active message
- **WHEN** a `widget` chunk arrives mid-stream for the current assistant turn
- **THEN** the message's `widgets` array gains the new payload and the UI re-renders immediately

#### Scenario: multiple widgets on one message
- **WHEN** the agent emits two `render_widget` calls in a single turn
- **THEN** both payloads appear under the same message, in emission order

### Requirement: InlineWidget component renders all four widget kinds
A `InlineWidget` component SHALL accept a `WidgetPayload` and render the appropriate layout using `data-ui-*` attribute-based elements from the ui-library skin.

- `stat-row`: horizontal row of tiles, each a `data-ui-card` with a label and large value
- `record-table`: `<table>` with `data-ui-tag` column headers and muted row cells
- `record-card`: `data-ui-card` with a title, optional subtitle, and a field grid of label+value pairs
- `badge-list`: optional label followed by a flex-wrapped row of `data-ui-badge` elements

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
